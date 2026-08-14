const app = require('../app');
const connectDB = require('../config/db');

// Ensure database connection is alive before serving route in serverless environment
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

module.exports = app;
