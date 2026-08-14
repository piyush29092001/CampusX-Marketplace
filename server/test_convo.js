require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Product = require('./models/Product');
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Create a dummy buyer and seller
        const buyer = new mongoose.Types.ObjectId();
        const seller = new mongoose.Types.ObjectId();
        const product = new mongoose.Types.ObjectId();

        console.log('Buyer:', buyer.toString());
        console.log('Seller:', seller.toString());

        let conversation = await Conversation.create({
            participants: [buyer.toString(), seller.toString()],
            product: product.toString(),
            unreadCounts: { [buyer.toString()]: 0, [seller.toString()]: 0 }
        });

        console.log('Created conversation:', conversation._id);

        const found = await Conversation.find({
            participants: buyer.toString(),
            hiddenFor: { $ne: buyer.toString() }
        });

        console.log('Found via basic Mongoose scan:', found.map(c => c._id));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
