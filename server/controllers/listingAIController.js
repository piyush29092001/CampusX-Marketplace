const { analyzeListing } = require('../ai/services/openRouterService');
const { validateAIResponse } = require('../ai/utils/validateAIResponse');

exports.analyzeProductListing = async (req, res) => {
    try {
        const productData = req.body;
        // Extracted image URLs if any (maybe from Cloudinary if previously uploaded, or base64)
        const imageUris = req.body.productImages || [];

        const rawAiData = await analyzeListing(productData, imageUris);
        const validatedData = validateAIResponse(rawAiData);

        res.status(200).json(validatedData);
    } catch (error) {
        console.error('Error in analyzeProductListing:', error);
        res.status(503).json({
            success: false,
            aiUnavailable: true,
            message: 'AI assistance is temporarily unavailable. You can continue manually.'
        });
    }
};
