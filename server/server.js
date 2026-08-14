const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Connect to database
connectDB();

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Active User Mapping (Support Multi-Device)
const onlineUsers = new Map(); // userId => Set(socket.id)
app.set('io', io);
app.set('onlineUsers', onlineUsers);

const getReceiverSockets = (id) => {
    return onlineUsers.has(id.toString()) ? Array.from(onlineUsers.get(id.toString())) : [];
};

// Middleware for Socket Auth
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication fault'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // { id: '...' }
        next();
    } catch (error) {
        next(new Error('Authentication fault'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.user.id;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    console.log(`\n[SOCKET CONNECT]\nuserId: ${userId}\nsocketId: ${socket.id}`);

    // Broadcast presence
    io.emit('user_online', userId);

    socket.on('send_message', async (data) => {
        try {
            const { conversationId, receiverId, type, text, imageUrl, replyTo, productId, productName } = data;
            const senderId = socket.user.id; // Guarantee authenticity securely

            console.log(`\n[SEND MESSAGE RECEIVED]\nsender: ${senderId}\nconversationId: ${conversationId}`);

            // Verify Conversation array Map logic natively
            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !conversation.participants.includes(senderId)) return;

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

            console.log(`\n[MESSAGE SAVED]\nmessageId: ${newMessage._id}\nconversationId: ${conversationId}\nsender: ${senderId}`);

            // Update Conversation Map Metadata natively
            conversation.lastMessage = type === 'image' ? '[IMAGE]' : text;
            conversation.lastMessageAt = Date.now();

            // DO NOT touch conversation.hiddenFor here.
            // If a user deleted this thread, sending new messages into it
            // does NOT resurrect it. New contacts create NEW threads via startConversation.

            // Unread counts Map injection
            const currentUnread = conversation.get(`unreadCounts.${receiverId}`) || 0;
            conversation.set(`unreadCounts.${receiverId}`, currentUnread + 1);
            await conversation.save();

            const populatedConversation = await Conversation.findById(conversationId)
                .populate('participants', 'name avatar isVerified')
                .populate('product', 'title price images status');

            // Emit to receiver natively across ALL their active sockets
            const receiverSockets = getReceiverSockets(receiverId);

            console.log(`\n[RECEIVER FOUND]\nreceiverUserId: ${receiverId}\nreceiverSocketIds: ${receiverSockets.join(', ')}`);

            receiverSockets.forEach(sId => {
                console.log(`\n[EMITTING NEW MESSAGE]\nsocketId: ${sId}\nmessageId: ${newMessage._id}`);
                io.to(sId).emit('new_message', newMessage);
                io.to(sId).emit('conversation_updated', populatedConversation);
            });

            // Emit success callback natively mirroring exact database structure
            socket.emit('message_sent', newMessage);
            socket.emit('conversation_updated', populatedConversation);

        } catch (err) {
            console.error("Socket Message Execution Error:", err);
            socket.emit('message_failed', { error: 'Failed to process message' });
        }
    });

    socket.on('message_delivered', async ({ messageId, conversationId, senderId }) => {
        try {
            const receiverId = socket.user.id;

            // Note: Receiver claims they got the message. Update status.
            await Message.findOneAndUpdate(
                { _id: messageId, receiver: receiverId, status: 'sent' },
                { status: 'delivered', deliveredAt: new Date() }
            );

            console.log(`\n[MESSAGE DELIVERY]\nmessageId: ${messageId}`);

            const senderSockets = getReceiverSockets(senderId);
            senderSockets.forEach(sId => {
                io.to(sId).emit('message_status_updated', { messageId, status: 'delivered' });
            });
        } catch (e) {
            console.error("Socket Delivered Error", e);
        }
    });

    socket.on('message_read', async ({ conversationId, senderId }) => {
        try {
            const userId = socket.user.id;

            const result = await Message.updateMany(
                { conversation: conversationId, receiver: userId, status: { $ne: 'read' } },
                { $set: { status: 'read', readAt: new Date() } }
            );

            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                conversation.set(`unreadCounts.${userId}`, 0);
                await conversation.save();

                // Populate before emitting so frontend gets full participant objects
                const populatedConvo = await Conversation.findById(conversationId)
                    .populate('participants', 'name avatar isVerified')
                    .populate('product', 'title price images status');

                // Update my own sockets to reflect 0 unread
                const mySockets = getReceiverSockets(userId);
                mySockets.forEach(sId => io.to(sId).emit('conversation_updated', populatedConvo));
            }

            if (result.modifiedCount > 0) {
                const senderSockets = getReceiverSockets(senderId);
                senderSockets.forEach(sId => {
                    io.to(sId).emit('message_status_updated', { conversationId, status: 'read' });
                });
            }
        } catch (e) {
            console.error("Socket Read Error", e);
        }
    });

    socket.on('typing_start', ({ receiverId, conversationId }) => {
        const receiverSockets = getReceiverSockets(receiverId);
        receiverSockets.forEach(sId => io.to(sId).emit('typing_start', { senderId: socket.user.id, conversationId }));
    });

    socket.on('typing_stop', ({ receiverId, conversationId }) => {
        const receiverSockets = getReceiverSockets(receiverId);
        receiverSockets.forEach(sId => io.to(sId).emit('typing_stop', { senderId: userId, conversationId }));
    });

    // Forward delete_message event to receiver (always deletedForEveryone)
    socket.on('delete_message', ({ messageId, conversationId, receiverId }) => {
        const receiverSockets = getReceiverSockets(receiverId);
        receiverSockets.forEach(sId => io.to(sId).emit('message_deleted', { messageId, conversationId }));
    });

    socket.on('disconnect', () => {
        console.log(`\n[SOCKET DISCONNECT]\nuserId: ${userId}\nsocketId: ${socket.id}`);
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                onlineUsers.delete(userId);
                io.emit('user_offline', userId);
            }
        }
    });
});

// Pass IO instance dynamically to requests if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
