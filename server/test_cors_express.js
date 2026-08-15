const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
    'https://campus-x-marketplace-asrh.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/test', (req, res) => res.json({ msg: 'ok' }));

const server = app.listen(3031, async () => {
    console.log('Test CORS on 3031');
    const fetch = require('node-fetch'); // Assuming we can use node-fetch or native fetch in node 20+
});
