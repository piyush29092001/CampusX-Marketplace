const app = require('../app');
const connectDB = require('../config/db');

// Ensure database connection is alive before serving route in serverless environment
connectDB(); // Execute immediately, Vercel caches this

module.exports = (req, res) => {
    return app(req, res); // Forward request synchronously into the Express logic
};
