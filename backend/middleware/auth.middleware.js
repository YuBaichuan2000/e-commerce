import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

export const protectRoute = async (req, res, next) => {
    try {

        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({msg: "User not authenticated - token not provided"});
        }

        const { userId } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(401).json({msg: "User not found"});
        }

        req.user = user;

        next();

    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const adminRoute = async (req, res, next) => {
    if (req.user && req.user.role === "admin"){
        next();
    } else {
        return res.status(403).json({msg: "Access Denied - Admin only"});
    }
}