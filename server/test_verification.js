const http = require('http');
const app = require('./app');
const db = require('./config/db');

require('dotenv').config();

const server = http.createServer(app);

async function testEndpoints() {
    await db();

    server.listen(4005, async () => {
        console.log("Test server listening on 4005");

        try {
            const rootRes = await fetch('http://localhost:4005/');
            const rootData = await rootRes.json();
            console.log("GET /:", rootData);

            const productsRes = await fetch('http://localhost:4005/api/products');
            console.log("GET /api/products:", productsRes.status);

            const optionsRes = await fetch('http://localhost:4005/api/auth/me', {
                method: 'OPTIONS'
            });
            console.log("OPTIONS /api/auth/me:", optionsRes.status);

            console.log("ALL TESTS PASSED SUCCESSFULLY.");
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
testEndpoints();
