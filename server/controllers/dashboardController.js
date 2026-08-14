const Product = require('../models/Product');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @desc    Get dashboard metrics for logged in user
// @route   GET /api/dashboard/overview
// @access  Private
exports.getOverview = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const activeListingsCount = await Product.countDocuments({ seller: userId, status: 'Available' });

        // Aggregate total views
        const viewsAggregation = await Product.aggregate([
            { $match: { seller: userId } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const totalViews = viewsAggregation.length > 0 ? viewsAggregation[0].totalViews : 0;

        // Calculate distinct buyer inquiries (1 buyer + 1 product = 1 inquiry)
        const inquiryAggregation = await Message.aggregate([
            { $match: { receiver: new mongoose.Types.ObjectId(userId), productId: { $ne: null } } },
            { $group: { _id: { sender: "$sender", productId: "$productId" } } }
        ]);
        const buyerInquiries = inquiryAggregation.length;

        // Fetch recent transactions (not used in new UI but kept for API stability)
        const recentTransactions = await Product.find({ seller: userId })
            .select('title price status createdAt images')
            .sort('-updatedAt')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                activeListings: activeListingsCount,
                itemsSold: 0,
                totalViews,
                buyerInquiries,
                recentTransactions
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error loading dashboard' });
    }
};
