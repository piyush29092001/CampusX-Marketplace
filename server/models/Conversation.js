const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    // Users who have deleted this conversation from their inbox.
    // A conversation is only eligible for reuse when clearedAt is empty.
    // Once any user deletes, PING_SELLER creates a NEW thread instead.
    hiddenFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    clearedAt: {
        type: Map,
        of: Date,
        default: {}
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
