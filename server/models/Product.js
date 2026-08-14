const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['ELECTRONICS', 'STUDY & ACADEMICS', 'VEHICLES & MOBILITY', 'HOSTEL & LIVING']
    },
    subcategory: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    searchKeywords: {
        type: [String],
        default: []
    },
    condition: {
        type: String,
        required: [true, 'Please select the condition'],
        enum: ['Like New', 'Good', 'Fair', 'Poor']
    },
    images: {
        type: [String],
        required: true,
        validate: [arrayLimit, 'You need at least one image and max 5 images']
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    college: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Draft'],
        default: 'Available'
    },
    views: {
        type: Number,
        default: 0
    },
    aiEstimatedPrice: {
        min: Number,
        max: Number,
        recommended: Number,
        reasoning: String
    },
    aiConditionAnalysis: {
        type: String
    }
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length > 0 && val.length <= 5;
}

// Text index for optimized, normalized searches
productSchema.index({
    title: 'text',
    description: 'text',
    category: 'text',
    subcategory: 'text',
    tags: 'text',
    searchKeywords: 'text'
}, {
    weights: {
        title: 10,
        category: 8,
        subcategory: 8,
        searchKeywords: 6,
        tags: 5,
        description: 1
    },
    name: "TextSearchIndex"
});

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);
