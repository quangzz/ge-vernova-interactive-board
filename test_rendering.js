const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');

    // Go to Page 2
    await page.click('body');
    await new Promise(r => setTimeout(r, 800)); // wait for transition

    // Go to Page 3
    await page.click('#page-wheel-intro');
    await new Promise(r => setTimeout(r, 800)); // wait for transition

    // Inspect Page 3
    const findoutHeader = await page.evaluate(() => {
        const el = document.querySelector('.corner-header');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
            rect: rect,
            opacity: style.opacity,
            visibility: style.visibility,
            zIndex: style.zIndex,
            display: style.display,
            innerHTML: el.innerHTML.substring(0, 50) + '...'
        };
    });
    console.log('Page 3 corner-header:', findoutHeader);

    const findoutTitle = await page.evaluate(() => {
        const el = document.querySelector('.findout-title');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
            rect: rect,
            opacity: style.opacity,
            visibility: style.visibility,
            color: style.color,
            fontSize: style.fontSize,
            innerHTML: el.innerHTML.trim().substring(0, 40) + '...'
        };
    });
    console.log('Page 3 findout-title:', findoutTitle);

    // Go to Page 4
    await page.click('#page-findout');
    await new Promise(r => setTimeout(r, 1000));

    // Inspect Page 4
    const homeLayout = await page.evaluate(() => {
        const el = document.querySelector('.home-master-layout');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const children = el.children.length;
        return {
            rect: rect,
            opacity: style.opacity,
            visibility: style.visibility,
            zIndex: style.zIndex,
            display: style.display,
            childrenCount: children
        };
    });
    console.log('Page 4 home-master-layout:', homeLayout);

    const masterBg = await page.evaluate(() => {
        const el = document.querySelector('.master-bg');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
            rect: rect,
            opacity: style.opacity,
            visibility: style.visibility,
            zIndex: style.zIndex,
            src: el.src
        };
    });
    console.log('Page 4 master-bg:', masterBg);

    await browser.close();
})();
