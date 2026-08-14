const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const connectDB = require('./config/db');
require('dotenv').config();

const merge = async () => {
    await connectDB();
    console.log("Connected. Finding duplicate architectures...");
    const conversations = await Conversation.find({});

    // Group by sorted participants string
    const groups = {};
    for (let c of conversations) {
        if (!c.participants || c.participants.length < 2) continue;
        const key = c.participants.map(p => p.toString()).sort().join('_');
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
    }

    for (let key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            console.log(`Found ${group.length} duplicates for pair ${key}`);
            // Sort by newly active
            group.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            const primary = group[0];
            const obsoleteIds = [];
            for (let i = 1; i < group.length; i++) {
                const dup = group[i];
                obsoleteIds.push(dup._id);

                // Merge unreads safely
                for (let participant of dup.participants) {
                    const pId = participant.toString();
                    const existingUnread = primary.unreadCounts?.get(pId) || 0;
                    const dupUnread = dup.unreadCounts?.get(pId) || 0;
                    primary.set(`unreadCounts.${pId}`, existingUnread + dupUnread);
                }
            }

            // Re-map messages keeping chronological history natively intact
            const result = await Message.updateMany(
                { conversation: { $in: obsoleteIds } },
                { $set: { conversation: primary._id } }
            );
            console.log(`Merged ${result.modifiedCount} messages into primary ${primary._id}`);

            await primary.save();
            await Conversation.deleteMany({ _id: { $in: obsoleteIds } });
        }
    }
    console.log("Migration complete.");
    process.exit(0);
};

merge();
