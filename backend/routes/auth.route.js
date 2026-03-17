import express from 'express';
import passport from 'passport';


const Authrouter = express.Router();

// Bắt đầu xác thực Google
Authrouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Xử lý callback từ Google
Authrouter.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const { user, token } = req.user;
        res.json({ message: "Login successful!", user, token });
    }
);

export default Authrouter;