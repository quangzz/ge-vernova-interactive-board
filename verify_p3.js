const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:8080');

        console.log('--- Navigating to Page 2 ---');
        await page.click('body');
        await new Promise(r => setTimeout(r, 800));

        console.log('--- Navigating to Page 3 ---');
        await page.click('#page-wheel-intro');
        await new Promise(r => setTimeout(r, 800));

        const p3html = await page.$eval('#page-findout', el => el.innerHTML);
        console.log('Page 3 InnerHTML length:', p3html.length);

        const p3style = await page.evaluate(() => {
            const el = document.getElementById('page-findout');
            const style = window.getComputedStyle(el);
            return {
                visibility: style.visibility,
                opacity: style.opacity,
                rect: el.getBoundingClientRect()
            };
        });
        console.log('Page 3 Container Style:', p3style);

        const titleStyle = await page.evaluate(() => {
            const el = document.querySelector('.findout-title-bold');
            if (!el) return null;
            const style = window.getComputedStyle(el);
            return {
                visibility: style.visibility,
                opacity: style.opacity,
                color: style.color,
                rect: el.getBoundingClientRect()
            };
        });
        console.log('Page 3 Title Style:', titleStyle);

        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
