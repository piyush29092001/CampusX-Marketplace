const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-marketplace')
    .then(async () => {
        const prod = await Product.find().limit(3);
        console.log(JSON.stringify(prod, null, 2));
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
