const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: (origin, callback) => callback(new Error('Not allowed by CORS')),
    credentials: true,
}));

app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

app.get('/test', (req, res) => res.json({ msg: 'ok' }));

const server = app.listen(3032, async () => {
    console.log('Test CORS rejection');
});
