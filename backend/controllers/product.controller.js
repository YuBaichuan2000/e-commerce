import { redis } from '../config/redis.js';
import cloudinary from "../config/cloudinary.js";
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
    try {

        // check if cached
        let featuredProducts = await redis.get("featured_products");

        if (featuredProducts) {
            return res.status(200).json(JSON.parse(featuredProducts)); // stored as string
        }

        featuredProducts = await Product.find({ isFeatured: true }).lean(); // return plain js object when read-only

        if (!featuredProducts) {
            return res.status(404).json({ msg: "No featured products found" });
        }

        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.status(200).json(featuredProducts);



    } catch( error ) {
        res.status(500).json({msg: error.message});
    }
}

export const createProduct = async (req, res) => {
    const { name, description, price, image, category } = req.body;

    try {
        let cloudinaryRes = null;

        if (image) {
            cloudinaryRes = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryRes?.secure_url ? cloudinaryRes.secure_url : "",
            category
        })


        res.status(201).json(product);

    } catch (error) {
        console.log(error);
        res.status(500).json({msg: error.message});
    }
}

export const deleteProduct = async (req, res) => {
    // del from db and cloudinary

    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({msg: "Product not found"});
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`)
            } catch (error) {
                res.status(400).json({msg: "Error deleting image"});
            }
        }

        await Product.findByIdAndDelete(productId);

        res.status(200).json({msg: "Product deleted succesfully"});

    } catch(error) {
        res.status(500).json({msg: error.message});
    }
}


// implement ML methods
export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: {size:3}
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])

        res.status(200).json(products)
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const getProductsByCategory = async (req, res) => {
    const { categoryName } = req.params;

    try {
        const products = await Product.find({ category: categoryName });

        if (!products) {
            return res.status(404).json({msg: "No products found in this category"});
        }

        res.status(200).json(products);
    } catch (e) {
        res.status(500).json({msg: e.message});
    }
}

export const toggleFeatured = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById({ _id: id });

        if (!product) {
            return res.status(404).json({msg: "Product not found"});
        }

        product.isFeatured = !product.isFeatured;
        const updatedProduct = await product.save();

        await updateFeaturedProductsCache();

        // update redis
        res.json(200).json(updatedProduct);

    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

const updateFeaturedProductsCache = async () => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();

        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log(error);
    }
}
