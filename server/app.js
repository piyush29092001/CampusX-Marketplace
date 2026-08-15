const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

// 1. Conditionally apply universally-permissive CORS strictly for origin mirroring.
// This guarantees that if Vercel crashes with a 500 downstream, the browser STILL sees the CORS headers!
app.use(cors({
    origin: (origin, callback) => {
        // ALWAYS echo the requested origin if present, or fallback to '*' so browser allows it.
        // This stops `cors` package from throwing strict Errors and dropping headers.
        callback(null, origin || '*');
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Strict whitelist enforcement downstream
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Origin not allowed by CORS whitelist' });
    }
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Basic route
app.get('/', (req, res) => {
    res.json({ success: true, service: "CampusX API" });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);

// Setup basic error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
