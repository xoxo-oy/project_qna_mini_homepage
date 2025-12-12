import { Request, Response } from "express";
import { prisma } from "../server";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getAiChatMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.aiChatMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages" });
  }
};

export const postAiChatMessage = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const userId = req.user!.id;
    const { content } = req.body;

    // 1) 유저 메시지 저장
    await prisma.aiChatMessage.create({
      data: { userId, role: "user", content },
    });

    // 2) 마지막 assistant 메시지 가져오기 (대화 이어서)
    const lastAssistant = await prisma.aiChatMessage.findFirst({
      where: { userId, role: "assistant", responseId: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    // 3) OpenAI response 생성
    let aiText = "";
    let responseId: string | undefined;

    try {
      let response = await openai.responses.create({
        model: "gpt-5-mini",
        input: `'질문이 대화 같으면 자연스럽게 대화 해주고, 질문 같으면 20줄 내로 핵심 요약 답변 줘' 질문:${content} `,
        previous_response_id: lastAssistant?.responseId || undefined,
        max_output_tokens: 2000,
      });

      aiText += response.output_text || "";
      responseId = response.id;

      // incomplete이면 이어서 생성 (DB insert는 아직 하지 않음)
      while (response.status === "incomplete") {
        response = await openai.responses.create({
          model: "gpt-5-mini",
          previous_response_id: response.id,
          max_output_tokens: 2000,
        });
        aiText += response.output_text || "";
        responseId = response.id;
      }
    } catch (e) {
      console.error("OpenAI error:", e);
      aiText = "죄송합니다. 답변을 생성할 수 없습니다.";
    }

    // 4) assistant 메시지 DB 저장 (한 번만)
    const aiMsg = await prisma.aiChatMessage.create({
      data: { userId, role: "assistant", content: aiText, responseId },
    });

    // 5) socket emit (한 번만)
    req.app.get("io")?.to(String(userId)).emit("ai:new", aiMsg);

    // 6) 클라이언트 반환
    res.json(aiMsg);
  } catch (err) {
    next(err);
  }
};
