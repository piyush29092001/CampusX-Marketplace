const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

const request = (url, method, token, body = null) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

async function testFlow() {
    try {
        console.log("WAIT 1s FOR SERVER...");
        await new Promise(r => setTimeout(r, 1000));

        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected");

        const User = require('./models/User');
        const Product = require('./models/Product');
        const Conversation = require('./models/Conversation');

        // Grab any active product
        const product = await Product.findOne({ status: 'Available' });
        if (!product) throw new Error("No active product found!");

        const sellerId = product.seller;

        // Grab another user who is NOT the seller
        const buyer = await User.findOne({ _id: { $ne: sellerId } });
        if (!buyer) throw new Error("No other user to act as buyer!");

        console.log(`Buyer: ${buyer._id}, Seller: ${sellerId}, Product: ${product._id}`);

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        console.log(`Token created for buyer`);

        // PING SELLER
        console.log(`\n\n--- 1. PINGING SELLER ---`);
        const pingRes1 = await request(`${BASE_URL}/messages/start`, 'POST', token, { productId: product._id });
        const conversationId1 = pingRes1.data.data._id;
        console.log(`Ping 1 Response Status: ${pingRes1.status}`);
        console.log(`Conversation ID: ${conversationId1}`);

        // DELETE CHAT
        console.log(`\n\n--- 2. DELETING CHAT ---`);
        const deleteRes = await request(`${BASE_URL}/messages/conversations/${conversationId1}`, 'DELETE', token);
        console.log(`Delete Response Status: ${deleteRes.status}`);

        const checkConvo = await Conversation.findById(conversationId1);
        console.log(`Is buyer in hiddenFor?`, checkConvo.hiddenFor.map(x => x.toString()).includes(buyer._id.toString()));

        // PING SELLER AGAIN
        console.log(`\n\n--- 3. PINGING SELLER AGAIN ---`);
        const pingRes2 = await request(`${BASE_URL}/messages/start`, 'POST', token, { productId: product._id });
        console.log(`Ping 2 Response Status: ${pingRes2.status}`);

        const conversationId2 = pingRes2.data.data._id;
        console.log(`Ping 2 returned Convo ID: ${conversationId2}`);

        if (conversationId1 === conversationId2) {
            console.log("PASS: Same conversation reused.");
        } else {
            console.log("FAIL: New conversation created.");
            process.exit(1);
        }

        const checkConvo2 = await Conversation.findById(conversationId2);
        const isHidden2 = checkConvo2.hiddenFor.map(x => x.toString()).includes(buyer._id.toString());
        console.log(`Is buyer in hiddenFor after Ping 2?`, isHidden2);

        if (!isHidden2) {
            console.log("PASS: Buyer removed from hiddenFor.");
        } else {
            console.log("FAIL: Buyer still hidden.");
            process.exit(1);
        }

        // Fetch Conversations
        const convRes = await request(`${BASE_URL}/messages/conversations`, 'GET', token);
        const conversations = convRes.data.data;
        const matched = conversations.find(c => c._id === conversationId2);

        if (matched) {
            console.log("PASS: Conversation appeared perfectly in GET /messages/conversations");
        } else {
            console.log("FAIL: Not returned in GET /messages/conversations");
            process.exit(1);
        }

        console.log("\n\nALL E2E TESTS PASSED FLAWLESSLY.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testFlow();
