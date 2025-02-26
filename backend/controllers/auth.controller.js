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

    const { email, password, name, role } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({msg: "User already exists"});
        };

        const user = await User.create({ name, email, password, role });

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
    
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email});

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.status(200).json({user:{
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }, msg: "User logged in"});
        } else {
            res.status(401).json({msg: "Invalid email or password"});
        }
    } catch(error) {
        res.status(500).json({msg: error.message});
    }   
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {

            const { userId } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            // delete refresh token from redis
            await redis.del(`refresh_token:${userId}`);

        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({msg: "Logged out sucessfully"});
    } catch(error) {
        res.status(500).json({msg: error.message});
    }
}

// recreate accessToken when expires
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({"msg": "No refresh token provided"});
        }

        const { userId } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${userId}`);

        if (storedToken !== refreshToken) {
            return res.status(401).json({msg: "Invalid refresh token"});
        }

        const accessToken = jwt.sign({userId: userId}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.cookie('accessToken', accessToken, {
            httpOnly: true, // XSS attacks
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.status(200).json({msg: "Access Token refreshed"});

    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// export const getProfile = async (req, res) => {

// }