require('dotenv').config();
const mongoose = require('mongoose');

async function migrateConversations() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for Migration...');

    const Conversation = require('./models/Conversation');
    const Message = require('./models/Message');

    const conversations = await Conversation.find({});
    console.log(`Found ${conversations.length} total conversations.`);

    const grouped = {};

    for (let convo of conversations) {
        if (!convo.participants || convo.participants.length < 2) continue;
        const p1 = convo.participants[0].toString();
        const p2 = convo.participants[1].toString();
        const key = [p1, p2].sort().join('_');

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(convo);
    }

    let mergedCount = 0;
    let deletedCount = 0;

    for (const [key, convos] of Object.entries(grouped)) {
        if (convos.length > 1) {
            // Sort by createdAt ascending
            convos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const primary = convos[0];
            const duplicates = convos.slice(1);

            console.log(`Merging ${duplicates.length} duplicate conversations into primary: ${primary._id} for pair ${key}`);

            for (let duplicate of duplicates) {
                // Point messages to primary
                await Message.updateMany(
                    { conversation: duplicate._id },
                    { $set: { conversation: primary._id } }
                );

                // Update unread counts
                for (let part of duplicate.participants) {
                    const pid = part.toString();
                    const dCount = duplicate.get(`unreadCounts.${pid}`) || 0;
                    const pCount = primary.get(`unreadCounts.${pid}`) || 0;
                    primary.set(`unreadCounts.${pid}`, pCount + dCount);
                }

                deletedCount++;
                await Conversation.findByIdAndDelete(duplicate._id);
            }

            // Sync last Message
            const latestMessage = await Message.findOne({ conversation: primary._id }).sort({ createdAt: -1 });
            if (latestMessage) {
                primary.lastMessageAt = latestMessage.createdAt;
                primary.lastMessage = latestMessage.type === 'image' ? '[IMAGE]' : latestMessage.text;
                if (latestMessage.productId && (!primary.product || primary.product.toString() !== latestMessage.productId.toString())) {
                    primary.product = latestMessage.productId;
                }
            }

            await primary.save();
            mergedCount++;
        }
    }

    console.log(`Migration Complete. Pairs merged: ${mergedCount}. Duplicate conversations deleted: ${deletedCount}.`);
    process.exit(0);
}

migrateConversations().catch(console.error);
