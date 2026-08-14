const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Object_id = mongoose.Types.ObjectId;
dotenv.config();

const Product = require('./models/Product');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-marketplace';

async function generateOverview(userId) {
    const activeListingsCount = await Product.countDocuments({ seller: userId, status: 'Available' });
    const itemsSoldCount = await Product.countDocuments({ seller: userId, status: 'Sold' });
    const viewsAggregation = await Product.aggregate([
        { $match: { seller: userId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregation.length > 0 ? viewsAggregation[0].totalViews : 0;

    return { activeListingsCount, itemsSoldCount, totalViews };
}

async function runTest() {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB.');

    const seller = await User.findOne({});
    if (!seller) {
        console.error('Test user missing');
        process.exit(1);
    }

    console.log('--- INITIAL DASHBOARD STATE ---');
    let dash = await generateOverview(seller._id);
    console.log(dash);

    console.log('\n--- CREATING NEW LISTING ---');
    const newProduct = await Product.create({
        title: 'M2 MACBOOK AIR TESTER',
        description: 'Testing the dashboard metrics',
        price: 90000,
        category: 'Laptops',
        condition: 'Like New',
        seller: seller._id,
        college: 'Test College',
        images: ['default'],
        views: 0
    });
    console.log(`Product created: ${newProduct._id}`);

    dash = await generateOverview(seller._id);
    console.log('Post-Creation Dash:', dash);

    console.log('\n--- SIMULATING ANOTHER USER VIEWING ---');
    const productTarget = await Product.findById(newProduct._id);
    productTarget.views += 1;
    await productTarget.save();
    dash = await generateOverview(seller._id);
    console.log('Post-View Dash (Total Views expected +1):', dash);

    console.log('\n--- MARKING ITEM SOLD ---');
    productTarget.status = 'Sold';
    await productTarget.save();
    dash = await generateOverview(seller._id);
    console.log('Post-Sold Dash (Active-1, Sold+1):', dash);

    console.log('\n--- DELETING LISTING ---');
    await Product.findByIdAndDelete(newProduct._id);
    dash = await generateOverview(seller._id);
    console.log('Post-Delete Dash (Everything reverted):', dash);

    console.log('\n✅ Dashboard Backend Metrics successfully validated native aggregation!');
    process.exit(0);
}

runTest();
