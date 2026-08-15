const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
        page.on('requestfailed', request =>
            console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
        );

        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log('Page loaded successfully');

        const bodyHandle = await page.$('body');
        const html = await page.evaluate(body => body.innerHTML, bodyHandle);
        console.log('Body HTML length:', html.length);
        if (html.length < 500) {
            console.log('HTML CONTENT:', html);
        }

        await browser.close();
    } catch (e) {
        console.error('Puppeteer Error:', e);
    }
})();
