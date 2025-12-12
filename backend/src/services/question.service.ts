import { prisma } from "../server";
// Fix: Remove Category import from @prisma/client as it might not be generated
// import { Category } from '@prisma/client';

export class QuestionService {
  async getAllQuestions(
    page: number,
    limit: number,
    category?: string,
    search?: string,
    isCompleted?: boolean // 추가
  ) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (category && category !== "ALL") whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    if (typeof isCompleted === "boolean") whereClause.isCompleted = isCompleted; // ✅ 필터

    const [total, questions] = await prisma.$transaction([
      prisma.question.count({ where: whereClause }),
      prisma.question.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, nickname: true } },
          _count: { select: { answers: true } },
        },
      }),
    ]);

    return { questions, total, totalPages: Math.ceil(total / limit) };
  }

  async getUserQuestions(userId: number) {
    return prisma.question.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, nickname: true } },
        answers: {
          include: { author: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: "asc" }, // Show oldest answers first usually, or desc for newest
        },
      },
    });
  }

  async createQuestion(userId: number, data: any) {
    return prisma.question.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: userId,
      },
      include: { author: true },
    });
  }

  async createAnswer(userId: number, questionId: number, content: string) {
    return prisma.answer.create({
      data: {
        content,
        questionId,
        authorId: userId,
      },
      include: { author: { select: { id: true, nickname: true } } },
    });
  }

  async completeQuestion(userId: number, questionId: number, answerId: number) {
    // Verify ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw { status: 404, message: "Question not found" };
    if (question.authorId !== userId)
      throw { status: 403, message: "Not authorized" };
    if (question.isCompleted)
      throw { status: 400, message: "Already completed" };

    // Transaction
    return prisma.$transaction([
      prisma.question.update({
        where: { id: questionId },
        data: { isCompleted: true },
      }),
      prisma.answer.update({
        where: { id: answerId },
        data: { isSelected: true },
      }),
    ]);
  }
  // 질문 수정
  async updateQuestion(userId: number, questionId: number, data: any) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw { status: 404, message: "Question not found" };
    if (question.authorId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title ?? question.title,
        content: data.content ?? question.content,
        category: data.category ?? question.category,
      },
    });
  }

  // 질문 삭제
  async deleteQuestion(userId: number, questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw { status: 404, message: "Question not found" };
    if (question.authorId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.question.delete({ where: { id: questionId } });
  }

  // ------------------------
  // 답변 수정
  async updateAnswer(userId: number, answerId: number, content: string) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) throw { status: 404, message: "Answer not found" };
    if (answer.authorId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.answer.update({
      where: { id: answerId },
      data: { content },
    });
  }

  // 답변 삭제
  async deleteAnswer(userId: number, answerId: number) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) throw { status: 404, message: "Answer not found" };
    if (answer.authorId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.answer.delete({ where: { id: answerId } });
  }
}
