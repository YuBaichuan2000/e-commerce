import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
// import workoutRoutes from './routes/workouts.js';
import productRoutes from './routes/product.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from "./routes/analytics.route.js";
import mongoose from 'mongoose';
// import cors from 'cors';
// import passport from 'passport';
import cookieParser from 'cookie-parser';
// import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import redisClient from './redisClient.js';

dotenv.config();

const app = express();

// Configure the rate limiter middleware
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15-minute window
//     max: 100, // Limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true, 
//     legacyHeaders: false,  
//     store: new RedisStore({
//       // Use the connected redisClient to store rate limit data
//       sendCommand: (...args) => redisClient.sendCommand(args),
//     }),
//   });

// app.use(limiter);

// app.use(cors({
//     origin: process.env.NODE_ENV === 'development' ?  'http://localhost:3000' : 'https://workout-tracker-frontend-1gjy.onrender.com',
//     credentials: true
// }));


// app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json());
// app.use(passport.initialize());
app.use(cookieParser());

// app.use('/api/workouts', workoutRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
// });

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    app.listen(process.env.PORT || 4000, ( req, res )=> {
        console.log("connected to db and app is listening on port", process.env.PORT);
    });
})
.catch((e) => {
    console.log(e);
});




