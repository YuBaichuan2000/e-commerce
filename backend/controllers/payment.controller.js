import express from "express";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../config/stripe.js";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "lala"

async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        precent_off: discountPercentage,
        duration: "once"
    });

    return coupon.id;
}

async function createNewCoupon(userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Data.now() + 30*24*60*60*1000),
        userId: userId
    })

    await newCoupon.save();
    return newCoupon;
}

export const createCheckoutSession = async (req, res) => {

    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({error: "Invalid or empty products array"});
        }

        let totalAmount = 0;

        const lineItems = products.map(product => {
            const amount = Math.round(product.price * 100) // send amount in cents for Stripe
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "aud",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount
                }
            }

        });

        let coupon = null;

        if (couponCode) {
            coupon = await Coupon.findOne({code: couponCode, userId: req.user._id, isActive:true});
            if (coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100);
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${BASE_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${BASE_URL}/purchase-cancel`,
            discount: coupon ? [
                {
                    coupon: await createStripeCoupon(coupon.discountPercentage)
                }
            ]: [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price
                    }))
                )
            }
        });

        // create a 10% off coupon for next shopping if spent over 200
        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }
        res.status(200).json({ id:session.id, totalAmount: totalAmount/100 });
    } catch (e) {
        res.status(500).json({msg: e.message});
    }   

}

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // invalid used coupon
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate({
                    code: session.metadata.couponCode, userId: session.metadata.userId
                }, {isActive:false})
            }
        }

        const products = JSON.parse(session.metadata.products);
        const newOrder = new Order({
            user:session.metadata.userId,
            products: products.map((p) => (
                {
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price
                }
            )),
            totalAmount: session.amount_total / 100,
            stripeSessionId: sessionId
        })

        await newOrder.save();

        res.json({
            success:true,
            message:"payment success, order created, coupon deactivated",
            orderId: newOrder._id
        })
    } catch(e) {
        res.status(500).json({msg: e.message});
    }
}