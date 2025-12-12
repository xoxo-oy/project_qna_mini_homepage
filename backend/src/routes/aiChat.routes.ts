// aiChat.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getAiChatMessages,
  postAiChatMessage,
} from "../controllers/aiChat.controller";

const router = Router();

// GET: 사용자의 AI 채팅 전체 불러오기
router.get("/", authenticate, getAiChatMessages);

// POST: 새 질문 보내고 ChatGPT 스타일 답변 받기
router.post("/", authenticate, postAiChatMessage);

export default router;
