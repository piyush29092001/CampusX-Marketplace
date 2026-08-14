require('dotenv').config();
const mongoose = require('mongoose');

async function testPopulate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Product = require('./models/Product');

        const p = await Product.findOne({ status: 'Available' }).populate('seller', 'name');
        console.log("Populated Product Seller:", p.seller);
        console.log("Seller _id:", p.seller._id);
        console.log("Seller id:", p.seller.id);
        console.log("Raw Product JSON:", JSON.stringify(p.seller));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testPopulate();
