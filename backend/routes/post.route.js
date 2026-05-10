import express from "express";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  importPosts,
} from "../controllers/post.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(getPosts).post(adminMiddleware, createPost);
router.post("/import", adminMiddleware, importPosts);
router
  .route("/:id")
  .get(getPostById)
  .put(adminMiddleware, updatePost)
  .delete(adminMiddleware, deletePost);

export default router;
