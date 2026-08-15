const app = require('../app');
const connectDB = require('../config/db');

// Vercel Serverless Entry Point
module.exports = async (req, res) => {
    // We await connectDB inside the route resolution safely without crashing outer scopes.
    // If it fails, Express won't handle it... wait! We can just call it and catch it!
    try {
        await connectDB();
    } catch (e) {
        console.error("Vercel DB Connection Error:", e);
    }

    return app(req, res); // Forward request synchronously into the Express logic
};
