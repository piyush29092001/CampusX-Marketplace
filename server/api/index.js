const app = require('../app');
const connectDB = require('../config/db');

// Ensure database connection is alive before serving route in serverless environment
module.exports = async (req, res) => {
    await connectDB(); // Resolves caching natively
    return app(req, res); // Forward request synchronously into the Express logic
};
