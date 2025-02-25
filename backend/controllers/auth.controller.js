import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis.js';

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    })

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    })

    return { accessToken, refreshToken };

}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true, // XSS attacks
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // XSS attacks
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

}

export const signup = async (req, res) => {

    const { email, password, name } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({msg: "User already exists"});
        };

        const user = await User.create({ name, email, password });

        // authenticate
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);


        res.status(201).json({user:{_id: user._id, email: user.email, role: user.role}, msg: "User created succesfully"});

    } catch (error) {
        res.status(500).json({msg: error.message});
    } 
}

export const login = async (req, res) => {
    res.send('login route');
}

export const logout = async (req, res) => {
    res.send('logout route');
}