import { Router } from "express";
import {
  generateAIAnswer,
  adoptAIAnswer,
} from "../controllers/answer.controller";

const router = Router();

router.post("/ai/generate", generateAIAnswer);
router.post("/ai/adopt", adoptAIAnswer);

export default router;
