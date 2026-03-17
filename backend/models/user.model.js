import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
    user_id: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String },
    status: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date },
    refreshToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    count_type_cart: {type: Number},
});

// Băm mật khẩu trước khi lưu
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Phương thức check lại pass
UserSchema.methods ={
    comparePassword: async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
    },
    createPasswordResetToken: function () {
        const resetToken = crypto.randomBytes(32).toString("hex");
        this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút
        return resetToken;
    },
}



const User = mongoose.model("User", UserSchema);
export default User;