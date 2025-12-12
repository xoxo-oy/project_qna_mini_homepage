import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getMessages } from "../controllers/chat.controller";
import { prisma } from "../server";

const router = Router();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// GET 메시지 (페이징)
router.get("/", authenticate, getMessages);

// POST 메시지 (DB 저장)
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user!.id;
    const msg = await prisma.chatMessage.create({
      data: { content, userId },
      include: { user: true },
    });
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
