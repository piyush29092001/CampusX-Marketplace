const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Start or Get Conversation by Product ID & Seller
// @route   POST /api/messages/start
// @access  Private
exports.startConversation = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;

        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID is required' });
        }

        const Product = require('../models/Product');
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const sellerId = product.seller.toString();

        if (buyerId === sellerId) {
            return res.status(400).json({ success: false, error: 'You cannot message yourself' });
        }

        // CORE LOOKUP: find EXACTLY one conversation for this pair
        let conversation = await Conversation.findOne({
            participants: { $all: [buyerId, sellerId], $size: 2 }
        });

        if (!conversation) {
            // First time they've ever talked — create ONE definitive thread
            conversation = await Conversation.create({
                participants: [buyerId, sellerId],
                product: productId,
                hiddenFor: [],
                unreadCounts: { [buyerId]: 0, [sellerId]: 0 }
            });
        } else {
            // Existing thread found! 
            // Reactivate it for the current user by removing them from hiddenFor.
            let updated = false;

            if (conversation.hiddenFor.map(id => id.toString()).includes(buyerId)) {
                const now = new Date();
                await Conversation.updateOne(
                    { _id: conversation._id },
                    {
                        $pull: { hiddenFor: buyerId },
                        $set: { [`clearedAt.${buyerId}`]: now }
                    }
                );
                conversation.hiddenFor = conversation.hiddenFor.filter(id => id.toString() !== buyerId);
                conversation.set(`clearedAt.${buyerId}`, now);
                updated = true;
            }

            // Always update the Conversation's product cache to the latest context 
            // so the inbox view correctly reflects the latest intent.
            if (productId && (!conversation.product || conversation.product.toString() !== productId.toString())) {
                conversation.product = productId;
                updated = true;
            }

            if (updated) {
                await conversation.save();
            }
        }

        // --- 8. Add/create the new product-context message. ---
        // (Only if they've explicitly Pinged this seller with a productId)
        if (productId) {
            const initialText = `I am interested in this product.`;

            const newMessage = await Message.create({
                conversation: conversation._id,
                sender: buyerId,
                receiver: sellerId,
                text: initialText,
                productId: product._id,
                productName: product.title,
                status: 'sent'
            });

            // Update conversation metadata
            conversation.lastMessage = initialText;
            conversation.lastMessageAt = newMessage.createdAt;
            const currentUnread = conversation.get(`unreadCounts.${sellerId}`) || 0;
            conversation.set(`unreadCounts.${sellerId}`, currentUnread + 1);
            await conversation.save();

            // Broadcast instantly if socket is available natively
            try {
                const io = req.app.get('io');
                const onlineUsers = req.app.get('onlineUsers');
                if (io && onlineUsers) {
                    const receiverSockets = onlineUsers.has(sellerId) ? Array.from(onlineUsers.get(sellerId)) : [];

                    const populatedConversation = await Conversation.findById(conversation._id)
                        .populate('participants', 'name avatar isVerified')
                        .populate('product', 'title price images status');

                    receiverSockets.forEach(sId => {
                        io.to(sId).emit('new_message', newMessage);
                        io.to(sId).emit('conversation_updated', populatedConversation);
                    });
                }
            } catch (err) {
                console.error('Socket emit skipped during startConversation:', err);
            }
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('participants', 'name avatar isVerified')
            .populate('product', 'title price images status');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        console.error('[startConversation] error:', error);
        res.status(500).json({ success: false, error: 'Failed to start conversation' });
    }
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
            hiddenFor: { $ne: req.user.id }
        })
            .select('-__v')
            .populate('participants', 'name avatar isVerified')
            .populate('product', 'title price images status')
            .sort({ lastMessageAt: -1 })
            .limit(50);

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = 1 } = req.query;
        const limit = 50;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        // Verify participant
        if (!conversation.participants.map(p => p.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Unauthorized to view this conversation' });
        }

        const filter = { conversation: conversationId };
        const userClearedAt = conversation.get(`clearedAt.${userId}`);
        if (userClearedAt) {
            filter.createdAt = { $gt: userClearedAt };
        }

        const messages = await Message.find(filter)
            .populate('replyTo', 'sender text imageUrl type deletedForEveryone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Mark unread messages as read
        await Message.updateMany(
            { conversation: conversationId, receiver: userId, status: { $ne: 'read' } },
            { $set: { status: 'read', readAt: new Date() } }
        );

        // Reset unread counts for this user
        conversation.set(`unreadCounts.${userId}`, 0);
        await conversation.save();

        res.status(200).json({
            success: true,
            data: messages.reverse() // reverse back to chronological for frontend
        });
    } catch (error) {
        console.error('[getMessages] error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
};

// @desc    Delete conversation from user's inbox (per-user hide)
// @route   DELETE /api/messages/conversations/:conversationId
// @access  Private
exports.deleteConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

        if (!conversation.participants.map(p => p.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Add user to hiddenFor — this permanently hides this thread from their inbox.
        // We also set clearedAt to NOW, so if they are ever unhidden (by PING_SELLER)
        // they don't see history prior to this deletion!
        await Conversation.updateOne(
            { _id: conversationId, participants: userId },
            {
                $addToSet: { hiddenFor: userId },
                $set: { [`clearedAt.${userId}`]: new Date() }
            }
        );

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete conversation' });
    }
};

// @desc    Delete a single message for everyone
// @route   DELETE /api/messages/:messageId
// @access  Private (sender only)
exports.deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, error: 'Message not found' });

        // Only the sender can delete a message for everyone
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Only the sender can delete a message' });
        }

        message.deletedForEveryone = true;
        message.text = '';
        message.imageUrl = '';

        await message.save();
        res.status(200).json({ success: true, data: { _id: message._id } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
};

// @desc    Send a message via HTTP
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const { conversationId, receiverId, type, text, imageUrl, replyTo, productId, productName } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderId)) {
            return res.status(403).json({ success: false, error: 'Unauthorized to send to this conversation' });
        }

        const newMessage = await Message.create({
            conversation: conversationId,
            sender: senderId,
            receiver: receiverId,
            type: type || 'text',
            text: text || '',
            imageUrl: imageUrl || '',
            replyTo: replyTo || null,
            productId: productId || null,
            productName: productName || null,
            status: 'sent'
        });

        conversation.lastMessage = type === 'image' ? '[IMAGE]' : text;
        conversation.lastMessageAt = Date.now();

        const currentUnread = conversation.get(`unreadCounts.${receiverId}`) || 0;
        conversation.set(`unreadCounts.${receiverId}`, currentUnread + 1);
        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
            .populate('participants', 'name avatar isVerified')
            .populate('product', 'title price images status');

        // Progressive Enhancement: Emits to active WebSockets natively if they actually exist on this node instance
        try {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');

            if (io && onlineUsers) {
                const receiverSockets = onlineUsers.has(receiverId.toString()) ? Array.from(onlineUsers.get(receiverId.toString())) : [];

                if (receiverSockets.length > 0) {
                    receiverSockets.forEach(sId => {
                        io.to(sId).emit('new_message', newMessage);
                        io.to(sId).emit('conversation_updated', populatedConversation);
                    });
                } else {
                    // Start offline email fallback since no local active sockets exist for receiver
                    const receiverUser = await User.findById(receiverId);
                    if (receiverUser && receiverUser.email) {
                        const emailSubject = `New message received on CampusX`;
                        const emailHtml = `
                            <h2>You have a new unread message on CampusX!</h2>
                            <p><strong>From:</strong> A user on CampusX</p>
                            <p><strong>Message:</strong> ${type === 'image' ? '[IMAGE ATTACHMENT]' : (text || '')}</p>
                            <p><a href="https://campus-x-marketplace-asrh.vercel.app/messages">Log in to your account</a> to reply to this message!</p>
                        `;
                        const emailText = `You have a new unread message on CampusX!\n\nMessage: ${type === 'image' ? '[IMAGE ATTACHMENT]' : (text || '')}\n\nLog in to reply.`;

                        sendEmail({
                            email: receiverUser.email,
                            subject: emailSubject,
                            html: emailHtml,
                            text: emailText
                        }).catch(e => console.error("Offline Email Delivery Error in sendMessage:", e));
                    }
                }
            }
        } catch (socketError) {
            console.error('Socket emission failed gracefully via sendMessage HTTP endpoint:', socketError);
        }

        res.status(200).json({ success: true, data: newMessage, conversation: populatedConversation });
    } catch (error) {
        console.error('[sendMessage] error:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
};
