import { response } from "express";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateToken, generateRefreshToken } from "../middleware/jwt.js";
import asyncHandler from 'express-async-handler';
import sendmail from "../utils/sendmail.js";
import { createHash } from 'crypto';
import Cookies from 'js-cookie';

// Đăng ký
export const register = async (req, res) => {
    try {
        const { name, email, password, phone_number } = req.body;

        // Kiểm tra thiếu dữ liệu
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields" 
            });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already in use" 
            });
        }

        // Tạo user_id tự động
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const newUserId = lastUser ? lastUser.user_id + 1 : 1;

        // Tạo user mới
        const newUser = new User({ 
            user_id: newUserId,
            name, 
            email, 
            password, 
            phone_number 
        });

        await newUser.save();
        res.status(201).json({ 
            success: true,
            message: "User registered successfully",
            user: newUser 
        });
    } catch (error) {
        console.error(error); // Hiển thị lỗi chi tiết trong terminal
        res.status(500).json({ 
            success: false,
            message: "Error registering user", 
            error: error.message 
        });
    }
};

// Đăng nhập
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({success: false, message: "Sai email hoặc mật khẩu!" });

        // So sánh mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({success: false, message: "Sai email hoặc mật khẩu!" });

        // Tạo token JWT để lưu trong cookie
        const token = generateToken({ _id: user._id, email: user.email, role: user.role });

        // Lưu refresh token vào cơ sở dữ liệu
        const refreshToken = generateRefreshToken({ _id: user._id, email: user.email, role: user.role });

        // Lưu refresh token vào database
        await User.findByIdAndUpdate(user._id, {refreshToken} ,{new:true})

        res.cookie('refreshtoken', refreshToken, {
            httpOnly: true,
            secure: false,          // chỉ bật true khi dùng HTTPS
            sameSite: 'Lax',        // hoặc 'none' nếu frontend ở khác domain
            maxAge:  2*60*60*10000 //2h
        });

        res.status(200).json({ 
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, count_cart: user.count_cart }, 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi  trong quá trình đăng nhập", error });
    }
};

//Refresh token
export const RefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    // console.log(cookie, "cookie in refreshtoken")
    if (!cookie?.refreshtoken) return res.status(400).json({message: "No refresh token in cookies"})
    
    const refresh_Token = cookie.refreshtoken;
    // console.log("User:", refresh_Token)
    jwt.verify(refresh_Token, process.env.JWT_REFRESH_SECRET,async(err, decoded) => {
        const user = await User.findOne({_id: decoded._id, refreshToken: refresh_Token})
        res.status(200).json({
            success: response ? true : false,
            newAccessToken: response ? generateToken({ _id: user._id, email: user.email, role: user.role }) : "Refresh token is not valid",
        })
    })
})

// Đăng xuất
export const logout = asyncHandler( async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshtoken) return res.status(400).json({message: "No refresh token in cookies"})
    
    const refresh_Token = cookie.refreshtoken;
    jwt.verify(refresh_Token, process.env.JWT_REFRESH_SECRET,async(err, decoded) => {
        if (err) return res.status(403).json({message: "Refresh token is not valid"})
        await User.findOneAndUpdate({_id: decoded._id}, {refreshToken: ""}, {new: true})
        res.clearCookie("refreshtoken", {httpOnly: true, secure: true});
        res.status(200).json({success: true, message: "Logout successfully"})
    })
})

//quên mật khẩu
export const forgotPassword = asyncHandler( async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({message: "Please provide your email"})
    
    const user = await User.findOne({email: email})
    if (!user) return res.status(400).json({message: "User not found"})

    const resetToken = user.createPasswordResetToken()
    await user.save()

    const html = `Xin vui lòng nhập vào link sau để lấy lại mật khẩu: <a href=${process.env.URL_SERVER}/resetpassword/${resetToken}>Reset Password</a>`
    const rs = await sendmail(email, html)
    return res.status(200).json({success: true, message: `Reset password link has been sent to ${email}`})
})

//Đổi mật khẩu
export const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.body;
    // console.log("REQ BODY:", req.body);
    if (!password) return res.status(400).json({message: "Please provide your password"})
    
    const hashedToken = createHash("sha256").update(token).digest("hex")
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})

    if (!user) return res.status(400).json({success: false, message: "Token is invalid or has expired"})

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()
    return res.status(200).json({success: true, message: "Password has been changed successfully"})
})

//Thông tin tài khoản
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password"); // Không trả về password
        if (!user) return res.status(404).json({success: false,  message: "User not found" });


        res.status(200).json(user);
    } catch (error) {
        console.error("Error in fetching user:", error.mesage)
        res.status(500).json({success: false,  message: "Error retrieving user data", error });
    }
};

//Lấy thông tin tất cả tài khoản
export const fetchAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password -refreshToken -passwordResetToken -passwordResetExpires").sort({user_id: 1});
        res.status(200).json({success: true, data: users})
    } catch (e) {
        console.log("error in fetching users", e.message)
        res.status(500).json({success: false, message: "Server Error"})
    }
};

//Lấy thông tin tài khoản theo id
export const fetchOneUser = async (req, res) => {
    const user_id = Number(req.params.id)

    try {
        const user = await User.findOne({user_id: user_id}).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

        if (!user){
            return res.status(404).json({success: false, message: "User not found"})
        }

        res.status(200).json({success: true, data: user})
    } catch (e){
        console.error("Error in fetching user:", e.mesage)
        res.status(500).json({success: false, message: "Server Error"})
    }
}

//Tạo tài khoản mới
export const createUsers = async (req, res) => {
    const user = req.body;

    if(!user.user_id || !user.name || !user.email || !user.password) {
        return res.status(400).json({success: false, message: "Please provide all fields"});
    }
    user.user_id = Number(user.user_id)
    const newUser = new User(user)

    try {
        await newUser.save();
        res.status(201).json({success: true, data: newUser});
    } catch (e) {
        console.error("Error in Create user:", e.message);
        res.status(500).json({success: false, message: "Server Error"});
    }
};

//Update tài khoản
export const updateUsers = async (req,res) => {
    const user_id = req.params.id;
    const user = req.body;
    // console.log("User ID:", user_id)
    // console.log("User data:", user)
    try {
        const updateUser = await User.findOneAndUpdate({_id: user_id}, user, {new: true})

        if (!updateUser){
            return res.status(400).json({success: false, mesage: "Invalid User ID"})
        }

        res.status(200).json({success: true, message: updateUser})
    } catch (e) {
        console.error("Error in Update user:", e.message)
        res.status(500).json({success: false, message: "Server Error"})
    }
}

//Xóa tài khoản
export const deleteUsers = async (req, res) => {
    const user_id = req.params.id;
    try {
        const deleteUser = await User.findOneAndDelete({_id: user_id})
        if (!deleteUser) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    }
    catch (e) {
        console.error("Error in Delete user:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Cập nhật hồ sơ người dùng (tự cập nhật)
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const updates = req.body;
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      ).select("-password");
  
      if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
  
      res.status(200).json({ success: true, data: updatedUser });
    } catch (e) {
      console.error("Error updating profile:", e.message);
      res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  });