import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateToken, generateRefreshToken } from "../middleware/jwt.js";
import asyncHandler from 'express-async-handler';
import sendmail from "../utils/sendmail.js";
import { createHash } from 'crypto';
import { getNextSequenceValue } from "../models/counter.model.js";
import logger from "../utils/logger.js";

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

        // Tạo user_id tự động (Atomic)
        const newUserId = await getNextSequenceValue("user_id");

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
        logger.error(error); // Hiển thị lỗi chi tiết trong terminal
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
        if (!user) return res.status(400).json({ success: false, message: "Email không tồn tại!" });

        // So sánh mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Nhập sai password!" });

        // Tạo token JWT để lưu trong cookie
        const token = generateToken({ _id: user._id, email: user.email, role: user.role });

        // Lưu refresh token vào cơ sở dữ liệu
        const refreshToken = generateRefreshToken({ _id: user._id, email: user.email, role: user.role });

        // Lưu refresh token vào database
        await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true })

        res.cookie('refreshtoken', refreshToken, {
            httpOnly: true,
            secure: false,          // chỉ bật true khi dùng HTTPS
            sameSite: 'Lax',        // hoặc 'none' nếu frontend ở khác domain
            maxAge: 2 * 60 * 60 * 1000 // 2h (7,200,000 ms)
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
    if (!cookie?.refreshtoken) return res.status(400).json({ message: "No refresh token in cookies" })

    const refresh_Token = cookie.refreshtoken;
    jwt.verify(refresh_Token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err || !decoded) return res.status(403).json({ success: false, message: "Refresh token is not valid" });

        const user = await User.findOne({ _id: decoded._id, refreshToken: refresh_Token });
        if (!user) return res.status(403).json({ success: false, message: "User not found or token mismatch" });

        res.status(200).json({
            success: true,
            newAccessToken: generateToken({ _id: user._id, email: user.email, role: user.role }),
        });
    });
})

// Đăng xuất
export const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshtoken) return res.status(400).json({ message: "No refresh token in cookies" })

    const refresh_Token = cookie.refreshtoken;
    jwt.verify(refresh_Token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Refresh token is not valid" })
        await User.findOneAndUpdate({ _id: decoded._id }, { refreshToken: "" }, { new: true })
        res.clearCookie("refreshtoken", { httpOnly: true, secure: true });
        res.status(200).json({ success: true, message: "Logout successfully" })
    })
})

//quên mật khẩu
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Please provide your email" })

    const user = await User.findOne({ email: email })
    if (!user) return res.status(400).json({ message: "User not found" })

    const resetToken = user.createPasswordResetToken()
    await user.save()

    const html = `Xin vui lòng nhập vào link sau để lấy lại mật khẩu: <a href=${process.env.FRONTEND_URL}/resetpassword/${resetToken}>Reset Password</a>`
    const rs = await sendmail(email, html)
    return res.status(200).json({ success: true, message: `Reset password link has been sent to ${email}` })
})

//Đổi mật khẩu
export const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.body;
    if (!password) return res.status(400).json({ message: "Please provide your password" })

    const hashedToken = createHash("sha256").update(token).digest("hex")
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    if (!user) return res.status(400).json({ success: false, message: "Token is invalid or has expired" })

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()
    return res.status(200).json({ success: true, message: "Password has been changed successfully" })
})

//Thông tin tài khoản
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password"); // Không trả về password
        if (!user) return res.status(404).json({ success: false, message: "User not found" });


        res.status(200).json(user);
    } catch (error) {
        logger.error("Error in fetching user: " + error.message)
        res.status(500).json({ success: false, message: "Error retrieving user data", error });
    }
};

//Lấy thông tin tất cả tài khoản
export const fetchAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'create_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const sortOptions = { [sortBy]: sortOrder };

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone_number: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalItems = await User.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            data: users,
            page,
            limit,
            totalPages,
            totalItems
        });
    } catch (e) {
        logger.error("error in fetching users: " + e.message)
        res.status(500).json({ success: false, message: "Server Error" })
    }
};

//Lấy thông tin tài khoản theo id
export const fetchOneUser = async (req, res) => {
    try {
        const query = isNaN(req.params.id) ? { _id: req.params.id } : { user_id: Number(req.params.id) };
        const user = await User.findOne(query).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        res.status(200).json({ success: true, data: user })
    } catch (e) {
        logger.error("Error in fetching user: " + e.message)
        res.status(500).json({ success: false, message: "Server Error" })
    }
}

//Tạo tài khoản mới
export const createUsers = async (req, res) => {
    const user = req.body;

    if (!user.name || !user.email || !user.password) {
        return res.status(400).json({ success: false, message: "Please provide all fields" });
    }
    if (!user.user_id) {
        user.user_id = await getNextSequenceValue("user_id");
    } else {
        user.user_id = Number(user.user_id)
    }

    if (req.file && req.file.path) {
        user.avatar = req.file.path;
    }

    try {
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã tồn tại!" });
        }

        const newUser = new User(user)
        await newUser.save();
        res.status(201).json({ success: true, data: newUser });
    } catch (e) {
        logger.error("Error in Create user: " + e.message);
        res.status(500).json({ success: false, message: e.message || "Server Error" });
    }
};

//Update tài khoản
export const updateUsers = async (req, res) => {
    const user_id = req.params.id;
    const user = req.body;
    try {
        const existingUser = await User.findById(user_id);
        if (!existingUser) {
            return res.status(400).json({ success: false, message: "Invalid User ID" })
        }

        // Kiểm tra email mới có bị trùng với user khác không
        if (user.email && user.email !== existingUser.email) {
            const emailExists = await User.findOne({ email: user.email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: "Email đã tồn tại!" });
            }
        }

        const allowedFields = ['name', 'email', 'phone_number', 'address', 'dob', 'gender', 'role', 'count_cart'];

        allowedFields.forEach((key) => {
            if (user[key] !== undefined && user[key] !== '') {
                existingUser[key] = user[key];
            }
        });

        if (user.password) {
            existingUser.password = user.password;
        }

        if (req.file && req.file.path) {
            existingUser.avatar = req.file.path;
        }

        await existingUser.save();
        const updateUser = await User.findById(user_id).select("-password");

        res.status(200).json({ success: true, message: "Success", data: updateUser })
    } catch (e) {
        logger.error("Error in Update user: " + e.message)
        res.status(500).json({ success: false, message: "Server Error" })
    }
}

//Xóa tài khoản
export const deleteUsers = async (req, res) => {
    const user_id = req.params.id;
    try {
        const deleteUser = await User.findOneAndDelete({ _id: user_id })
        if (!deleteUser) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    }
    catch (e) {
        logger.error("Error in Delete user: " + e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Cập nhật hồ sơ người dùng (tự cập nhật)
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const updates = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const allowedFields = ['name', 'phone_number', 'address', 'dob', 'gender', 'password'];

        allowedFields.forEach((key) => {
            if (updates[key] !== undefined && updates[key] !== '') {
                user[key] = updates[key];
            }
        });

        // Nếu có upload file avatar thông qua Multer & Cloudinary
        if (req.file && req.file.path) {
            user.avatar = req.file.path;
        }

        await user.save();
        const updatedUser = await User.findById(userId).select("-password");

        res.status(200).json({ success: true, data: updatedUser });
    } catch (e) {
        logger.error("Error updating profile: " + e.message);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
});