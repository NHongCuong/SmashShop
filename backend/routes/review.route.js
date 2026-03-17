import express from "express";
import { getReviewsByProduct, createReview, deleteReview } from "../controllers/review.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const reviewRouter = express.Router();

// Lấy đánh giá theo sản phẩm (public)
reviewRouter.get("/:productId", getReviewsByProduct);

// Tạo đánh giá mới (yêu cầu đăng nhập)
reviewRouter.post("/", authMiddleware, createReview);

// Xóa đánh giá (yêu cầu đăng nhập)
reviewRouter.delete("/:id", authMiddleware, deleteReview);

export default reviewRouter;
