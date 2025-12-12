import { Request, Response, NextFunction } from "express";
import { QuestionService } from "../services/question.service";
import { successResponse } from "../utils/response";

const questionService = new QuestionService();

// Fix: Use any for req/res to avoid type errors with query, params, etc.
export const getQuestions = async (req: any, res: any, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const isCompleted = req.query.isCompleted
      ? req.query.isCompleted === "true"
      : undefined; // ✅ 문자열을 boolean으로 변환

    const result = await questionService.getAllQuestions(
      page,
      limit,
      category,
      search,
      isCompleted // ✅ 서비스에 전달
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const getUserQuestions = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const questions = await questionService.getUserQuestions(parseInt(userId));
    successResponse(res, questions);
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const createQuestion = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const result = await questionService.createQuestion(req.user.id, req.body);
    successResponse(res, result, "질문이 등록되었습니다.");
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const createAnswer = async (req: any, res: any, next: NextFunction) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const result = await questionService.createAnswer(
      req.user.id,
      parseInt(questionId),
      content
    );
    successResponse(res, result, "답변이 등록되었습니다.");
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const completeQuestion = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // Question ID
    const { answerId } = req.body;
    const result = await questionService.completeQuestion(
      req.user.id,
      parseInt(id),
      answerId
    );
    successResponse(res, result, "답변이 채택되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 질문 수정
export const updateQuestion = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // Question ID
    const updated = await questionService.updateQuestion(
      req.user.id,
      parseInt(id),
      req.body
    );
    successResponse(res, updated, "질문이 수정되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 질문 삭제
export const deleteQuestion = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deleted = await questionService.deleteQuestion(
      req.user.id,
      parseInt(id)
    );
    successResponse(res, deleted, "질문이 삭제되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 답변 수정
export const updateAnswer = async (req: any, res: any, next: NextFunction) => {
  try {
    const { id } = req.params; // Answer ID
    const { content } = req.body;
    const updated = await questionService.updateAnswer(
      req.user.id,
      parseInt(id),
      content
    );
    successResponse(res, updated, "답변이 수정되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 답변 삭제
export const deleteAnswer = async (req: any, res: any, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await questionService.deleteAnswer(
      req.user.id,
      parseInt(id)
    );
    successResponse(res, deleted, "답변이 삭제되었습니다.");
  } catch (error) {
    next(error);
  }
};
