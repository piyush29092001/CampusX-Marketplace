const cors = require('cors');

const allowedOrigins = ['https://campus-x-marketplace-asrh.vercel.app'];

const middleware = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

const req = {
    headers: { origin: 'https://campus-x-marketplace-asrh.vercel.app' },
    method: 'OPTIONS'
};

const res = {
    setHeader: (k, v) => console.log('Set:', k, v),
    end: () => console.log('End'),
    statusCode: 200
};

middleware(req, res, (err) => {
    if (err) console.log('Error:', err.message);
    else console.log('Next called');
});
