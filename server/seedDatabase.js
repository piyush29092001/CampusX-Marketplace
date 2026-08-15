const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User'); // If User is needed for ref

dotenv.config();

const mockProducts = [
    { title: 'HP Pavilion 14 - 11th Gen Core i5', price: 32000, condition: 'Good', category: 'ELECTRONICS', college: 'IIT BHU', description: 'Great condition laptop', images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80'] },
    { title: 'Engineering Mathematics (Kreyszig)', price: 450, condition: 'Like New', category: 'STUDY & ACADEMICS', college: 'IIT BHU', description: 'Unused book.', images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80'] },
    { title: 'Firefox Geared Cycle', price: 4500, condition: 'Fair', category: 'VEHICLES & MOBILITY', college: 'IIT BHU', description: 'Used cycle', images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&q=80'] },
    { title: 'Casio Scientific Calculator fx-991EX', price: 800, condition: 'Good', category: 'ELECTRONICS', college: 'IIT BHU', description: 'Works well', images: ['https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?w=500&q=80'] },
    { title: 'Physics Hand Written Notes', price: 150, condition: 'Good', category: 'STUDY & ACADEMICS', college: 'IIT BHU', description: 'Very helpful notes', images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=80'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-marketplace');
        console.log('MongoDB connected');

        // Find a dummy user or create one
        let user = await User.findOne();
        if (!user) {
            user = await User.create({
                name: 'Test Setup User',
                email: 'test@example.com',
                password: 'password123',
                college: 'IIT BHU',
                year: '3rd Year',
                department: 'Computer Science',
                isVerified: true
            });
            console.log('Created dummy user');
        }

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Add seller reference to all products
        const productsToInsert = mockProducts.map(p => ({ ...p, seller: user._id }));

        // Insert
        await Product.insertMany(productsToInsert);
        console.log('Seeded products into database! Run your React app now.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
