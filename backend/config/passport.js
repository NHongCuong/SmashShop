import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback",
            scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    return done(null, user);
                } else {
                    const lastUser = await User.findOne().sort({ user_id: -1 });
                    const newUserId = lastUser ? lastUser.user_id + 1 : 1;
                    
                    user = await User.create({
                        user_id: newUserId,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: Math.random().toString(36).substring(7), // Mật khẩu ngẫu nhiên cho user Google
                        avatar: profile.photos[0].value,
                        role: 'user'
                    });
                    return done(null, user);
                }
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});
// Deserialize user
passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;
