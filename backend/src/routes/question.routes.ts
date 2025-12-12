import { Router } from "express";
import {
  getQuestions,
  createQuestion,
  getUserQuestions,
  createAnswer,
  completeQuestion,
  updateQuestion,
  deleteQuestion,
  updateAnswer,
  deleteAnswer,
} from "../controllers/question.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { prisma } from "../server";

const router = Router();

// 질문 조회/등록
router.get("/", getQuestions); // Public dashboard
router.post("/", authenticate, createQuestion);

// 유저별 질문 조회
router.get("/:userId", getUserQuestions);

// 질문 수정/삭제
router.patch("/:id", authenticate, updateQuestion);
router.delete("/:id", authenticate, deleteQuestion);

// 답변 등록
router.post("/:questionId/answers", authenticate, createAnswer);

// 답변 수정/삭제
router.patch("/answers/:id", authenticate, updateAnswer);
router.delete("/answers/:id", authenticate, deleteAnswer);

// 질문 완료 처리
router.patch("/:id/complete", authenticate, completeQuestion);

// 미니홈 질문 조회
router.get("/minihome/:userId", async (req, res, next) => {
  const { getUserQuestions } = await import(
    "../controllers/question.controller"
  );
  getUserQuestions(req as any, res, next);
});

// AI 답변 채택
router.post("/ai/adopt-answer", async (req, res) => {
  try {
    const { questionId, content, authorId } = req.body;

    if (!questionId || !content) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    const newAnswer = await prisma.answer.create({
      data: {
        content,
        authorId: authorId || null,
        questionId,
        isSelected: true,
      },
    });

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        isCompleted: true,
        answers: { connect: { id: newAnswer.id } },
      },
      include: { answers: true },
    });

    res.json(updatedQuestion);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || "서버 오류" });
  }
});

export default router;
