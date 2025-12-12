import { prisma } from "../server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI 답변 생성
export const generateAIAnswerService = async (
  questionId: number,
  type: "short" | "long"
) => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) throw new Error("질문을 찾을 수 없습니다.");

  const prompt =
    type === "short"
      ? `10줄 내로 이해하기 쉽게 핵심 요약해서 답변 줘: ${question.content}`
      : `이해하기 쉽게 핵심 요약해서 30줄 내로 설명해줘: ${question.content}`;

  const completion = await openai.responses.create({
    model: "gpt-5-nano",
    input: prompt,
  });

  return completion.output_text || "";
};

// AI 답변 채택
export const adoptAIAnswerService = async (
  questionId: number,
  content: string,
  authorId: number
) => {
  const newAnswer = await prisma.answer.create({
    data: { content, questionId, authorId, isSelected: true },
  });

  await prisma.question.update({
    where: { id: questionId },
    data: { isCompleted: true },
  });

  return newAnswer;
};
