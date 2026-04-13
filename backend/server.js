import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import userRoutes from "./routes/user.route.js";
import Authrouter from "./routes/auth.route.js";
import session from 'express-session';
import passport from "./config/passport.js";
import productRoutes from "./routes/product.route.js";
import productImageRoutes from "./routes/productImage.route.js";
import categoryRoutes from "./routes/category.route.js"
import orderRoutes from "./routes/order.route.js";
import brandRoutes from "./routes/brand.route.js"
import typeRoutes from "./routes/type.route.js";
import reviewRoutes from "./routes/review.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import cookieParser from 'cookie-parser';
import cartRouter from "./routes/cart.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import paymentRoutes from "./routes/payment.route.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "";
const FRONTEND_URL_VERCEL = process.env.FRONTEND_URL_VERCEL || "https://ie-213.vercel.app";
connectDB();

const app = express();

// --- CẤU HÌNH QUAN TRỌNG KHI CHẠY SAU NGINX/K8S ---
app.set("trust proxy", 1); // Cho phép Express tin tưởng các Header từ Nginx gửi sang

app.use(express.json());
app.use(cookieParser());

// Cấu hình Session phù hợp cho cả HTTP và HTTPS
app.use(
    session({
        secret: "a9b8c7d6e5f4g3h2i1",
        resave: false,
        saveUninitialized: false, // Đổi thành false để bảo mật hơn
        cookie: { 
            secure: true,        // Bắt buộc true khi chạy HTTPS để trình duyệt nhận Cookie
            sameSite: "none",    // Bắt buộc "none" nếu Frontend và Backend khác Port/Giao thức
            maxAge: 24 * 60 * 60 * 1000 // 1 ngày
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

// --- CẤU HÌNH CORS CHI TIẾT ---
app.use(cors({
    origin: [
        "https://192.168.88.133:30443", 
        "http://192.168.88.133:30002",
        "https://192.168.88.133",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Quan trọng để gửi nhận Cookie/Session
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/productImages", productImageRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/order", orderRoutes)
app.use("/api/v1/brand", brandRoutes);
app.use("/api/v1/type", typeRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use('/api/auth', Authrouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/vnpay', paymentRoutes);

// Route đăng nhập Google
app.get('/api/auth/google',
    passport.authenticate("google", { scope: ["openid", "profile", "email"] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.send(`🚀 Đăng nhập thành công! Chào ${req.user.displayName}`);
    }
);

app.use('*', (req, res) => {
    res.status(404).json({ error: "not found" })
});

app.listen(PORT, () => console.log(`Server started at http://192.168.88.133:${PORT}`));

export default app;