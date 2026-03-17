import express from "express";
import { getProfile, updateProfile, RefreshToken, fetchOneUser, fetchAllUsers, updateUsers, createUsers, deleteUsers, register, login, logout, forgotPassword, resetPassword } from "../controllers/user.controller.js";
import {adminMiddleware,authMiddleware} from "../middleware/auth.js";

const userRouter = express.Router();

// Đăng ký
userRouter.post("/register", register);

// Đăng nhập
userRouter.post("/login", login);

//Refresh token
userRouter.post("/refreshtoken",RefreshToken);

// Đăng xuất
userRouter.post("/logout",logout);

//Quên mật khẩu
userRouter.post("/forgotpassword",forgotPassword);

//đổi mật khẩu
userRouter.put("/resetpassword", resetPassword);
// Lấy thông tin user
userRouter.get("/profile",authMiddleware, getProfile);
// Sửa thông tin profile
userRouter.put("/profile", authMiddleware, updateProfile); // <– mới

userRouter.use(adminMiddleware);

// Lấy danh sách tất cả user
userRouter.get("/", fetchAllUsers);
// Cập nhật thông tin user
userRouter.put("/:id", updateUsers);
// Tạo mới user
userRouter.post("/", createUsers );
//xóa user
userRouter.delete("/:id", deleteUsers);
// Lấy thông tin một user theo ID
userRouter.get("/:id", fetchOneUser);
export default userRouter;
