require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Product = require('./models/Product');
const User = require('./models/User');

const messageController = require('./controllers/messageController');

async function runTest() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const product = await Product.findOne();
    if (!product) throw new Error('No product found to test with.');

    const buyer = await User.findOne({ _id: { $ne: product.seller } });
    const seller = await User.findById(product.seller);

    console.log(`Buyer: ${buyer._id}`);
    console.log(`Seller: ${seller._id}`);

    let req1 = {
        user: { id: buyer._id.toString() },
        body: { productId: product._id },
        app: { get: () => null }
    };

    let resData = null;
    const res = {
        status: function (code) {
            return {
                json: function (data) {
                    resData = data;
                    if (!data.success) {
                        console.error('API Error:', data.error);
                    }
                    return data;
                }
            };
        }
    };

    console.log('\n--- 1. PINGING SELLER FOR PRODUCT A ---');
    await messageController.startConversation(req1, res, null);
    if (!resData || !resData.success) throw new Error('startConversation failed: ' + (resData?.error || 'unknown'));
    const convo1Id = resData.data._id;
    console.log(`Created Conversation ID: ${convo1Id}`);

    console.log('\n--- 2. PINGING SELLER FOR PRODUCT B ---');
    const productB = await Product.create({
        seller: seller._id,
        title: 'Laptop B',
        description: 'B',
        price: 50,
        images: ['img'],
        category: 'ELECTRONICS',
        condition: 'Good',
        college: 'Test'
    });
    let req2 = {
        user: { id: buyer._id.toString() },
        body: { productId: productB._id },
        app: { get: () => null }
    };
    await messageController.startConversation(req2, res, null);
    const convo2Id = resData.data._id;
    console.log(`Returned Conversation ID: ${convo2Id}`);

    if (convo1Id.toString() === convo2Id.toString()) {
        console.log('✅ PASS: SAME CONVERSATION ID RETURNED FOR DIFFERENT PRODUCTS');
    } else {
        console.log('❌ FAIL: CREATED NEW CONVERSATION ID FOR DIFFERENT PRODUCT');
    }

    console.log('\n--- 3. DELETING CONVERSATION ---');
    let reqDelete = {
        user: { id: buyer._id.toString() },
        params: { conversationId: convo1Id }
    };
    await messageController.deleteConversation(reqDelete, res, null);
    console.log(`Buyer deleted Conversation ${convo1Id}`);
    const deletedConvo = await Conversation.findById(convo1Id);
    console.log(`Verification: hiddenFor array contains: ${deletedConvo.hiddenFor}`);

    console.log('\n--- 4. PINGING SELLER AFTER DELETION ---');
    await messageController.startConversation(req1, res, null);
    const convo3Id = resData.data._id;
    console.log(`Returned Conversation ID: ${convo3Id}`);

    if (convo1Id.toString() === convo3Id.toString()) {
        console.log('✅ PASS: OLD THREAD REACTIVATED (SOFT DELETE SUCCESS)');
    } else {
        console.log('❌ FAIL: A NEW CONVERSATION WAS CREATED AFTER DELETION.');
    }

    console.log('\n--- CLEANUP ---');
    await Conversation.deleteMany({ _id: { $in: [convo1Id, convo2Id, convo3Id] } });
    await Product.findByIdAndDelete(productB._id);
    mongoose.disconnect();
}

runTest().catch(console.error);
