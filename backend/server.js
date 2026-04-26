import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
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
import initChatSocket from "./socket/chatSocket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "";
const FRONTEND_URL_VERCEL = process.env.FRONTEND_URL_VERCEL || "https://ie-213.vercel.app";
connectDB();

const app = express();

// Tạo HTTP server để dùng cả Express lẫn Socket.io
const httpServer = createServer(app);

// Cấu hình Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [
            "https://192.168.88.133:30443",
            "http://192.168.88.133:30002",
            "https://192.168.88.133",
            "http://localhost:3000",
            "http://192.168.88.1:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Khởi tạo chat socket
initChatSocket(io);

// --- CẤU HÌNH QUAN TRỌNG KHI CHẠY SAU NGINX/K8S ---
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
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
        "http://localhost:3000",
        "http://192.168.88.1:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
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

import { generateToken } from "./middleware/jwt.js";

app.use('*', (req, res) => {
    res.status(404).json({ error: "not found" })
});

import logger from "./utils/logger.js";

// Dùng httpServer thay cho app.listen để Socket.io hoạt động
httpServer.listen(PORT, () => logger.info(`Server started at http://192.168.88.133:${PORT}`));

export default app;