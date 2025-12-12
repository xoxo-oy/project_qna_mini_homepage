import { Request, Response } from "express";
import {
  generateAIAnswerService,
  adoptAIAnswerService,
} from "../services/answer.service";

export const generateAIAnswer = async (req: Request, res: Response) => {
  try {
    const { questionId, type } = req.body;
    const aiAnswer = await generateAIAnswerService(questionId, type);
    res.json({ aiAnswer });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "AI 답변 생성 실패" });
  }
};

export const adoptAIAnswer = async (req: Request, res: Response) => {
  try {
    const { questionId, content, authorId } = req.body;
    const savedAnswer = await adoptAIAnswerService(
      questionId,
      content,
      authorId
    );
    res.json(savedAnswer);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "AI 답변 채택 실패" });
  }
};
