import Product from '../models/product.model.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});

        res.status(200).json({ products });
    } catch ( error ) {
        res.status(500).json({msg: error.message});
    }
}

export const getFeaturedProducts = async (req, res) => {
    
}