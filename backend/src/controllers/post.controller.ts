import { Request, Response, NextFunction } from "express";
import { postService } from "../services/post.service";

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content } = req.body;
    const post = await postService.createPost(req.user.id, title, content);
    res.status(201).json({ data: post, message: "게시글 생성 완료" });
  } catch (err) {
    next(err);
  }
};

export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await postService.getAllPosts();
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
};

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await postService.getPostById(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content } = req.body;
    const post = await postService.updatePost(
      req.user.id,
      parseInt(req.params.id),
      title,
      content
    );
    res.json({ data: post, message: "게시글 수정 완료" });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await postService.deletePost(
      req.user.id,
      parseInt(req.params.id)
    );
    res.json({ data: post, message: "게시글 삭제 완료" });
  } catch (err) {
    next(err);
  }
};
