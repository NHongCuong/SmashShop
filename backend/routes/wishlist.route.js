import express from "express";
import { getUserWishlist, addToWishlist, removeFromWishlist, fetchAllWishlistsAdmin, deleteWishlistAdmin } from "../controllers/wishlist.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const wishlistRouter = express.Router();

// ===== ADMIN ROUTES (phải đặt trước /:id) =====
wishlistRouter.get("/admin", authMiddleware, isAdmin, fetchAllWishlistsAdmin);
wishlistRouter.delete("/admin/:id", authMiddleware, isAdmin, deleteWishlistAdmin);

// ===== USER ROUTES =====
// Lấy danh sách yêu thích (yêu cầu đăng nhập)
wishlistRouter.get("/", authMiddleware, getUserWishlist);

// Thêm/bỏ yêu thích (toggle)
wishlistRouter.post("/", authMiddleware, addToWishlist);

// Xóa khỏi yêu thích
wishlistRouter.delete("/:id", authMiddleware, removeFromWishlist);

export default wishlistRouter;
