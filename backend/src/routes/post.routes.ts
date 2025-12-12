import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
} from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllPosts);
router.get("/:id", getPost);
router.post("/", authenticate, createPost);
router.patch("/:id", authenticate, updatePost);
router.delete("/:id", authenticate, deletePost);

export default router;
