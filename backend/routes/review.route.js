import express from "express";
import { getReviewsByProduct, createReview, deleteReview, fetchAllReviewsAdmin, updateReviewAdmin } from "../controllers/review.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const reviewRouter = express.Router();

// Lấy đánh giá theo sản phẩm (public)
reviewRouter.get("/product/:productId", getReviewsByProduct);

// Admin routes
reviewRouter.get("/admin", authMiddleware, isAdmin, fetchAllReviewsAdmin);
reviewRouter.put("/admin/:id", authMiddleware, isAdmin, updateReviewAdmin);

// Tạo đánh giá mới (yêu cầu đăng nhập)
reviewRouter.post("/", authMiddleware, createReview);

// Xóa đánh giá (yêu cầu đăng nhập hoặc admin)
reviewRouter.delete("/:id", authMiddleware, deleteReview);

export default reviewRouter;
