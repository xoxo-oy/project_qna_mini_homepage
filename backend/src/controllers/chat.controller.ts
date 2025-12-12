import { Request, Response } from "express";
import { prisma } from "../server";

// GET /api/chat?page=1&limit=20
export const getMessages = async (req: Request, res: Response) => {
  console.log(req.query);
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const messages = await prisma.chatMessage.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get messages" });
  }
};
