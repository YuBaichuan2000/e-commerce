
import Product from '../models/product.model.js';

export const addToCart = async (req, res) => {

    try {
        // if product already exists in user cart, increment count by one, otherwise push a new one
        const { productId } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find((item) => item.product.id === productId); // ???????

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cartItems.push(productId);
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (e) {
        res.status(500).json({msg: e.message});
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            user.cartItems = []; // remove whole cart
        } else {
            user.cartItems = user.cartItems.filter((item) => item.product.id !== productId);
        }
        await user.save();
        res.status(200).json(user.cartItems);
    } catch (e) {
        res.status(500).json({msg: e.message});
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.product.id === productId);

        if (existingItem) {
            if (quantity === 0) {
                user.cartItems = user.cartItems.filter(item => item.product.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            } 

            existingItem.quantity = quantity;
            await user.save();
            res.json(user.cartItems);
        } else {
            res.status(404).json({msg: "Product not found"});
        }
    } catch (e) {
        res.status(500).json({msg: e.message});
    }
}

// fetching complete information
export const getCart = async (req, res) => {
    try {
        const products = await Product.find({_id:{$in:req.user.cartItems}});
        
        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);
            return {...product.toJSON(), quantity:item.quantity} // toJSON inbuilt method for mongoose
        })

        res.json(cartItems);
    } catch (e) {
        res.status(500).json({msg: e.message});
    }
}

