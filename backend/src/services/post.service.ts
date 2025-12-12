import { prisma } from "../server";
import { Post } from "@prisma/client";

export class PostService {
  // 게시글 생성
  async createPost(
    userId: number,
    title: string,
    content: string
  ): Promise<Post> {
    return prisma.post.create({
      data: {
        title,
        content,
        userId,
      },
    });
  }

  // 게시글 전체 조회
  async getAllPosts(): Promise<Post[]> {
    return prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
  }

  // 특정 게시글 조회
  async getPostById(id: number): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  // 게시글 수정
  async updatePost(
    userId: number,
    postId: number,
    title: string,
    content: string
  ): Promise<Post> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw { status: 404, message: "Post not found" };
    if (post.userId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.post.update({
      where: { id: postId },
      data: { title, content },
    });
  }

  // 게시글 삭제
  async deletePost(userId: number, postId: number): Promise<Post> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw { status: 404, message: "Post not found" };
    if (post.userId !== userId)
      throw { status: 403, message: "Not authorized" };

    return prisma.post.delete({ where: { id: postId } });
  }
}

export const postService = new PostService();
