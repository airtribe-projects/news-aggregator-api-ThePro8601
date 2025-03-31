const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

const authMiddleware = (users) => (req, res, next) => {
    const token = req.header("Authorization");
    console.log("Received Token:", token);

    if (!token || !token.startsWith("Bearer ")) {
        console.log("No token provided or format is incorrect");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
        console.log("Token Decoded:", decoded);
        
        req.user = users.find(u => u.username === decoded.username);
        if (!req.user) {
            console.log("User not found in stored users");
            return res.status(404).json({ message: "User not found" });
        }
        
        next();
    } catch (error) {
        console.log("Invalid token error:", error.message);
        res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
