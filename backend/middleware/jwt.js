import jwt from "jsonwebtoken";

export const generateToken = (user) => {
    // console.log(user, "user in generateToken")
    return jwt.sign({ _id: user._id, email: user.email, role:user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
}

export const generateRefreshToken = (user) => {
    return jwt.sign({ _id: user._id, email: user.email, role:user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

//client đăng nhập vào
//server tạo ra access token và refresh token
//server gửi access token về client và lưu refresh token vào db