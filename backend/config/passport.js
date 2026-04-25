import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import { getNextSequenceValue } from "../models/counter.model.js";
import crypto from "crypto";

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
                    const newUserId = await getNextSequenceValue("user_id");
                    
                    user = await User.create({
                        user_id: newUserId,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: crypto.randomBytes(20).toString('hex'), // Mật khẩu ngẫu nhiên bảo mật hơn
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
