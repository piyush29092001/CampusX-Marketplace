const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestUser() {
    try {
        await connectDB();

        const testEmail = 'test@lumina.local';

        const existing = await mongoose.connection.collection('users').findOne({ email: testEmail });
        if (existing) {
            console.log("User already exists. Deleting it first...");
            await mongoose.connection.collection('users').deleteOne({ email: testEmail });
        }

        console.log("Creating new test user (bypassing strict schema logic)...");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("12434@P", salt);

        const result = await mongoose.connection.collection('users').insertOne({
            name: "Test User",
            email: testEmail,
            password: hashedPassword,
            college: "Lumina University",
            department: "Testing",
            year: "1",
            emailVerified: true,
            isVerified: true,
            role: "user",
            avatar: "default.png",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("TEST USER CREATED SUCCESSFULLY!");
        console.log("- Email:", testEmail);
        console.log("- ID:", result.insertedId);

    } catch (e) {
        console.log("Error creating test user:", e);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

createTestUser();
