import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Lấy token đúng định dạng "Bearer <token>"
    
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // console.log(req.user);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token is not valid", error: error.message });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Access denied, admin only" });
    }
}
const adminMiddleware = [authMiddleware, isAdmin];
export { adminMiddleware };

