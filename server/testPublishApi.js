const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('./models/User');

async function testApi() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-marketplace');
    const user = await User.findOne({});

    // sign token manually
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const payload = {
        title: 'Bicycle Test',
        description: 'Blah blah',
        price: 5000,
        category: 'Two Wheelers', // Simulated bad frontend dropdown value
        condition: 'Good',
        images: ['data:image/jpeg;base64,' + 'A'.repeat(3 * 1024 * 1024)] // Large local string
    };

    console.log("Sending...");
    try {
        const res = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("STATUS:", res.status);
        console.log("RESPONSE ERROR STRINGS:", data);
    } catch (e) {
        console.error("Fetch threw Error", e);
    }

    process.exit(0);
}
testApi();
