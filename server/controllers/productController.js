const Product = require('../models/Product');

// @desc    Get all products (with filters & pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const { keyword, category, subcategory, condition, college, page = 1, limit = 12, sort } = req.query;

        const query = { status: 'Available' };

        if (keyword) {
            query.$text = { $search: keyword };
        }
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (condition) query.condition = condition;
        if (college) query.college = college; // In a full implementation, you'd match the user's college by default

        // Sorting
        let sortObj = { createdAt: -1 };
        if (keyword) {
            // Sort by text score if searching
            sortObj = { score: { $meta: "textScore" } };
        }
        if (sort === 'lowest') sortObj = { price: 1 };
        if (sort === 'highest') sortObj = { price: -1 };

        const products = await Product.paginate(query, {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: sortObj,
            populate: { path: 'seller', select: 'name avatar college isVerified rating' }
        });

        res.status(200).json({
            success: true,
            data: products.docs,
            pagination: {
                total: products.totalDocs,
                limit: products.limit,
                page: products.page,
                pages: products.totalPages
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to fetch products' });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', 'name avatar rating isVerified completedTransactions college');

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Increment views unless the requester is the seller (we attempt to verify auth loosely here)
        // If the request isn't authenticated, we can't reliably know, so we increment.
        const headerToken = req.headers.authorization;
        let isOwner = false;
        if (headerToken && headerToken.startsWith('Bearer')) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(headerToken.split(' ')[1], process.env.JWT_SECRET);
                if (decoded.id === product.seller._id.toString()) {
                    isOwner = true;
                }
            } catch (e) { } // skip errors
        }

        if (!isOwner) {
            await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
            product.views += 1;
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error("GET Product Error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.seller = req.user.id;

        // Auto-fill college from user profile if not strictly provided
        if (!req.body.college) {
            req.body.college = req.user.college || 'Not Specified';
        }

        const product = await Product.create(req.body);

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error("CREATE API ERROR:", error);
        res.status(400).json({ success: false, error: error.message || 'Could not create product' });
    }
};

// @desc    Get logged in user's products
// @route   GET /api/products/my-listings
// @access  Private
exports.getMyListings = async (req, res, next) => {
    try {
        const products = await Product.find({ seller: req.user.id }).sort('-createdAt').lean();

        const Message = require('../models/Message');
        const mongoose = require('mongoose');
        const inquiriesAggr = await Message.aggregate([
            { $match: { receiver: new mongoose.Types.ObjectId(req.user.id), productId: { $ne: null } } },
            { $group: { _id: { sender: "$sender", productId: "$productId" } } },
            { $group: { _id: "$_id.productId", count: { $sum: 1 } } }
        ]);

        const inquiryMap = {};
        inquiriesAggr.forEach(agg => {
            inquiryMap[agg._id.toString()] = agg.count;
        });

        const productsWithInquiries = products.map(p => ({
            ...p,
            inquiries: inquiryMap[p._id.toString()] || 0
        }));

        res.status(200).json({ success: true, data: productsWithInquiries });
    } catch (error) {
        console.error("getMyListings Error:", error);
        res.status(500).json({ success: false, error: 'Failed to fetch your listings' });
    }
};

// @desc    Update a product (Edit Listing)
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Ownership check
        if (product.seller.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, error: 'You are not authorized to edit this listing.' });
        }

        const allowedFields = ['title', 'price', 'description', 'condition', 'category', 'subcategory', 'tags', 'searchKeywords', 'images'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                product[field] = req.body[field];
            }
        });

        await product.save();
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error("UPDATE API ERROR:", error);
        res.status(400).json({ success: false, error: error.message || 'Failed to update product' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'User not authorized to delete this product' });
        }
        await product.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
};

// @desc    Change product status
// @route   PUT /api/products/:id/status
// @access  Private
exports.updateProductStatus = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        if (product.seller.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

        product.status = req.body.status || product.status;
        await product.save();
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
};
