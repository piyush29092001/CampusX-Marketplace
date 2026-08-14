const handler = require('./api/index.js');
const req = { method: 'GET', url: '/', headers: {} };
const res = {
    status: (code) => { console.log('Status:', code); return res; },
    json: (data) => console.log('JSON:', data),
    send: (data) => console.log('SEND:', data),
    end: () => console.log('END')
};
console.log('Running handler...');
handler(req, res).then(() => console.log('Handler finished')).catch(e => console.error('Handler error:', e));
