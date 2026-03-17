import express from "express";
import { getUserWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const wishlistRouter = express.Router();

// Lấy danh sách yêu thích (yêu cầu đăng nhập)
wishlistRouter.get("/", authMiddleware, getUserWishlist);

// Thêm/bỏ yêu thích (toggle)
wishlistRouter.post("/", authMiddleware, addToWishlist);

// Xóa khỏi yêu thích
wishlistRouter.delete("/:id", authMiddleware, removeFromWishlist);

export default wishlistRouter;
