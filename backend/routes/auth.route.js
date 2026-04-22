import express from 'express';
import passport from 'passport';
import { generateToken } from '../middleware/jwt.js';

const Authrouter = express.Router();

// Bắt đầu xác thực Google
Authrouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Xử lý callback từ Google
Authrouter.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // req.user lúc này là user object từ passport strategy
        const user = req.user;
        const token = generateToken({ _id: user._id, email: user.email, role: user.role });
        
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        };
        
        const encodedUser = encodeURIComponent(JSON.stringify(userData));
        const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}&user=${encodedUser}`;
        
        res.redirect(redirectUrl);
    }
);

export default Authrouter;