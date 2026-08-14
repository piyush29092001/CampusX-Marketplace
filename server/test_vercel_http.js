const http = require('http');
const handler = require('./api/index.js');

const server = http.createServer((req, res) => {
    console.log('Incoming:', req.method, req.url);
    try {
        const result = handler(req, res);
        if (result && result.catch) {
            result.catch(err => {
                console.error('\n--- HANDLER PROMISE REJECTION ---');
                console.error(err);
                res.statusCode = 500;
                res.end(err.toString());
            });
        }
    } catch (e) {
        console.error('\n--- HANDLER SYNCHRONOUS CRASH ---');
        console.error(e);
        res.statusCode = 500;
        res.end(e.toString());
    }
});

server.listen(3030, async () => {
    console.log('Test server on 3030');
    try {
        const fetch = (await import('node-fetch')).default || globalThis.fetch;
        const res = await fetch('http://localhost:3030/');
        const text = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Body:', text);
    } catch (e) {
        console.error('Fetch error:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
