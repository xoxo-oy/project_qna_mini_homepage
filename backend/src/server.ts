// server.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes";
import questionRoutes from "./routes/question.routes";
import chatRoutes from "./routes/chat.routes";
import aiChatRoutes from "./routes/aiChat.routes";
import { PrismaClient } from "@prisma/client";
import { errorHandler } from "./middlewares/error.middleware";
import answerRouter from "./routes/answer.routes";
import postRouter from "./routes/post.routes";

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// HTTP + Socket.io 서버
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3002", "http://220.93.220.93:3002"],
    credentials: true,
  },
});

app.set("io", io);

// =======================
// Socket.io 이벤트
// =======================
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  // -----------------------
  // 일반 채팅
  // -----------------------
  socket.on("chat:send", async (data) => {
    try {
      const msg = await prisma.chatMessage.create({
        data: {
          userId: data.userId,
          content: data.content,
        },
        include: { user: true },
      });

      // 내 메시지 포함 모두 전송
      io.emit("chat:new", msg);
    } catch (err) {
      console.error("Failed to send chat message:", err);
    }
  });

  // -----------------------
  // AI 채팅 방 join
  // -----------------------
  socket.on("joinAiRoom", (userId: number) => {
    socket.join(userId.toString());
    console.log(`User ${userId} joined AI chat room`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

// =======================
// Middleware
// =======================
app.use(helmet() as any);
app.use(
  cors({
    origin: ["http://localhost:3002", "http://220.93.220.93:3002"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser() as any);

// =======================
// Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/chat", chatRoutes); // 일반 채팅
app.use("/api/ai-chat", aiChatRoutes); // AI 채팅
app.use("/api/answers", answerRouter);
app.use("/api/posts", postRouter);

// Minihome fallback
app.use("/api/minihome", (async (req: any, res: any, next: any) => {
  try {
    const { getUserQuestions } = await import(
      "./controllers/question.controller"
    );
    if (req.method === "GET") {
      req.params.userId = req.url.replace("/", "");
      if (!req.params.userId) throw new Error("User ID required");
      return getUserQuestions(req as any, res, next);
    }
    res.status(404).json({ message: "Not found" });
  } catch (e) {
    next(e);
  }
}) as any);

// =======================
// Error handler
// =======================
app.use(errorHandler as any);

const PORT = 3001;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// =======================
// 서버 실행
// =======================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server + Chat running on port ${PORT}`);
});
