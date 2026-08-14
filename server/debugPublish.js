const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-marketplace';

async function debugCreate() {
    await mongoose.connect(DB_URI);

    // Pick first user
    const user = await User.findOne({});
    if (!user) {
        console.error("No user found");
        process.exit(1);
    }

    console.log("Found user:", user.email, "College:", user.college);

    const payload = {
        title: 'Bicycle Test',
        description: 'Testing the dashboard metrics natively',
        price: 90000,
        category: 'Two Wheelers',
        condition: 'Good',
        images: ['default']
    };

    // Mimic the backend controller precisely
    payload.seller = user._id;
    if (!payload.college) {
        payload.college = user.college;
    }

    console.log("Attempting to validate/save this payload:");
    console.log(payload);

    try {
        const product = new Product(payload);
        const err = product.validateSync();
        if (err) {
            console.error("VALIDATION ERROR:");
            console.error(err.errors);
        } else {
            console.log("Validation passed! Waiting to save...");
            await product.save();
            console.log("Saved successfully.");
        }
    } catch (e) {
        console.error("EXCEPTION CAUGHT:", e);
    }

    process.exit(0);
}

debugCreate();
