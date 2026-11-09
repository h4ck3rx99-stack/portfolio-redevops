import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

process.chdir(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:'));
const base = 'http://localhost:5510';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const pages = ['/', '/nfc.html', '/privacy.html', '/404.html', '/work/the-ferment-formula.html', '/work/proposalforge.html', '/work/siteaudit-pro.html', '/work/brandkit-studio.html', '/work/dashboard-studio.html', '/blog/cloud-cost-optimization.html', '/blog/nextjs-seo-2026.html', '/blog/ai-features-no-data-science.html'];
const sizes = [[360,640],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[390,568],[844,390]];
await mkdir('tools/qa/screenshots', {recursive:true});
await mkdir('tools/qa/reports', {recursive:true});
const results = [];
const errors = [];
const context = await browser.newContext({reducedMotion:'reduce'});
// The consent banner waits until the visitor has scrolled; nudge a scroll after each load.
const settleAfterLoad = (pg) => {
    for (const m of ['goto', 'reload']) {
        const orig = pg[m].bind(pg);
        pg[m] = async (...args) => { const r = await orig(...args); await pg.evaluate(() => scrollBy(0, 1)); await pg.waitForTimeout(700); return r; };
    }
    return pg;
};
const page = settleAfterLoad(await context.newPage());
page.on('pageerror', error => errors.push(error.message));
const requests = [];
page.on('request', req => requests.push(req.url()));
for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    for (const route of pages) {
        await page.goto(base+route);
        await page.evaluate(() => document.fonts.ready);
        for (const img of await page.locator('main img').all()) {
            await img.scrollIntoViewIfNeeded();
            await img.evaluate(el => el.decode());
        }
        const audit = await page.evaluate(() => {
            const visible = el => el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden';
            return {
                overflow:document.documentElement.scrollWidth > innerWidth,
                h1:document.querySelectorAll('h1').length,
                images:[...document.querySelectorAll('main img')].every(img => visible(img) && img.naturalWidth && img.hasAttribute('alt')),
                brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash),
                clipped:[...document.querySelectorAll('h1,h2,h3,input,textarea')].filter(visible).filter(el => {const r=el.getBoundingClientRect();return r.right>innerWidth+1 || r.left < -1;}).map(el => el.textContent.slice(0,50)),
            };
        });
        results.push({route,width,height,...audit});
        assert.equal(audit.overflow,false,`${route} overflow ${width}`);
        assert.equal(audit.h1,1,`${route} H1`);
        assert.equal(audit.images,true,`${route} images ${width}`);
        assert.deepEqual(audit.brokenAnchors,[],`${route} anchors`);
        assert.deepEqual(audit.clipped,[],`${route} clipping ${width}`);
        if ([390,1440].includes(width) && height !== 568) {
            if (await page.locator('.consent-banner').isVisible()) await page.locator('.consent-banner [data-reject]').click();
            await page.evaluate(()=>scrollTo(0,0));
            await page.screenshot({path:`tools/qa/screenshots/editorial-${route==='/'?'home':route.replaceAll('/','-').replace('.html','')}-${width}.png`,fullPage:true});
        }
    }
}
assert.deepEqual(errors,[],'Console exceptions');
assert.equal(requests.some(url=>/clarity\.ms|calendly\.com|fonts\.google/.test(url)),false,'No optional third-party requests before consent');

const checks = [];
async function test(name, run) { await run(); checks.push(name); console.log('PASS',name); }
await page.setViewportSize({width:390,height:844});
await page.goto(base);
await test('Menu: expanded state, inert background, focus containment, Escape and anchor focus',async()=>{
    await page.locator('.menu-toggle').first().click();
    assert.equal(await page.locator('.menu-toggle').first().getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
    for(let i=0;i<25;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#site-menu')),true);}
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.menu-toggle').first().getAttribute('aria-expanded'),'false');
    await page.locator('.menu-toggle').first().click();
    await page.locator('#site-menu a[href="#work"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'work');
    assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
});
await test('FAQ native disclosure opens and closes',async()=>{
    const item=page.locator('#faq .faq__item').first();await item.locator('summary').click();assert.equal(await item.evaluate(el=>el.open),true);await item.locator('summary').click();assert.equal(await item.evaluate(el=>el.open),false);
});
await test('Form validation, pending guard, mocked failure keeps input, genuine success state',async()=>{
    await page.locator('#contactForm button[type="submit"]').click();
    assert.equal(await page.locator('#formName').getAttribute('aria-invalid'),'true');
    await page.locator('#formName').fill('QA Person');await page.locator('#formEmail').fill('qa@example.com');await page.locator('#formMessage').fill('Mock enquiry only');
    await page.evaluate(()=>{window.calls=0;window.sendLead=()=>{window.calls++;return new Promise(resolve=>window.finishLead=resolve);};});
    await page.waitForTimeout(3100);
    await page.locator('#contactForm button[type="submit"]').click();
    await page.evaluate(()=>document.querySelector('#contactForm').requestSubmit());
    assert.equal(await page.evaluate(()=>window.calls),1);
    assert.equal(await page.locator('#contactForm button[type="submit"]').isDisabled(),true);
    await page.evaluate(()=>window.finishLead({ok:false,error:'Mock delivery failure'}));
    await page.waitForFunction(()=>!document.querySelector('#contactForm button[type="submit"]').disabled);
    assert.equal(await page.locator('#formMessage').inputValue(),'Mock enquiry only');
    assert.equal(await page.locator('#formError').textContent(),'Mock delivery failure');
    await page.evaluate(()=>window.sendLead=async()=>({ok:true}));
    await page.locator('#contactForm button[type="submit"]').click();
    await page.locator('.form-success').waitFor();
});
await test('Booking requires explicit activation; external fallback remains available',async()=>{
    await page.locator('[data-calendly]').first().click();
    assert.equal(await page.locator('.booking-dialog').evaluate(el=>el.open),true);
    assert.equal(await page.locator('.booking-dialog iframe').count(),0);
    assert.equal(await page.locator('.booking-dialog a').getAttribute('href'),'https://calendly.com/redevops3/30min');
    await page.route('https://calendly.com/**', route=>route.fulfill({body:'<html><body>Mock booking calendar</body></html>',contentType:'text/html'}));
    await page.locator('[data-load-booking]').click();
    assert.equal(await page.locator('.booking-dialog iframe').count(),1);
    await page.keyboard.press('Escape');
});

await test('Fresh visit, reject and reload: no tracker requests or optional storage',async()=>{
    await page.evaluate(()=>localStorage.clear());await page.reload();requests.length=0;
    await page.waitForTimeout(300);
    assert.equal(await page.locator('script[data-analytics]').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.length),0);
    assert.equal((await context.cookies()).length,0);
    await page.locator('.consent-banner [data-reject]').click();await page.reload();
    assert.equal(await page.locator('script[data-analytics]').count(),0);
    assert.equal(await page.locator('.consent-banner').isVisible(),false);
});
await test('Accept once, saved consent, withdrawal API and reload stop tracker',async()=>{
    let loads=0;
    await page.route('https://www.clarity.ms/**', route=>{loads++;return route.fulfill({body:'window.trackerLoaded=true;',contentType:'text/javascript'});});
    await page.locator('footer [data-cookie-settings]').click();
    assert.equal(await page.locator('#analytics-choice').isChecked(),false);
    await page.locator('dialog [data-accept]').click();
    await page.waitForFunction(()=>window.trackerLoaded);
    assert.equal(loads,1);
    await page.locator('footer [data-cookie-settings]').click();await page.locator('dialog [data-accept]').click();assert.equal(loads,1);
    assert.deepEqual(await page.evaluate(()=>window.clarity.q[0]),['consentv2',{analytics_Storage:'granted',ad_Storage:'denied'}]);
    await page.reload();await page.waitForFunction(()=>window.trackerLoaded);assert.equal(loads,2);
    await context.addCookies([{name:'_clck',value:'mock',url:base},{name:'_clsk',value:'mock',url:base}]);
    await page.locator('footer [data-cookie-settings]').click();
    await Promise.all([page.waitForEvent('load'),page.locator('dialog [data-reject]').click()]);
    assert.equal(loads,2);
    assert.equal(await page.locator('script[data-analytics]').count(),0);
    assert.equal((await context.cookies()).some(c=>['_clck','_clsk'].includes(c.name)),false);
});
await test('Malformed, expired, incompatible and future records default off',async()=>{
    for(const value of ['{bad',JSON.stringify({version:1,necessary:true,analytics:true,timestamp:1,expires:2}),JSON.stringify({version:99,necessary:true,analytics:true,timestamp:Date.now(),expires:Date.now()+10000}),JSON.stringify({version:1,necessary:true,analytics:true,timestamp:Date.now()+10000,expires:Date.now()+20000})]) {
        await page.evaluate(v=>localStorage.setItem('redevops-consent',v),value);await page.reload();
        assert.equal(await page.locator('script[data-analytics]').count(),0);assert.equal(await page.locator('.consent-banner').isVisible(),true);
    }
});
await test('Preferences: Escape preserves choice, switch unselected, native focus containment',async()=>{
    await page.locator('.consent-banner [data-cookie-settings]').click();
    assert.equal(await page.locator('#analytics-choice').isChecked(),false);
    await page.locator('#analytics-choice').check();
    for(let i=0;i<15;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog')),true);}
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('script[data-analytics]').count(),0);
    assert.equal(await page.locator('.consent-banner').isVisible(),true);
});
await test('Unavailable storage fails closed without exceptions',async()=>{
    const blocked=await browser.newContext({reducedMotion:'reduce'});await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});
    const p=settleAfterLoad(await blocked.newPage());const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto(base);await p.locator('.consent-banner [data-accept]').click();
    assert.equal(await p.locator('script[data-analytics]').count(),0);assert.deepEqual(e,[]);assert.match(await p.locator('.consent-banner .dialog-status').textContent(),/cannot save/);await blocked.close();
});
await test('Reduced motion and enlarged text keep content visible',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);
    await page.addStyleTag({content:'html {font-size:200%}'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('h1').isVisible(),true);
    await page.screenshot({path:'tools/qa/screenshots/editorial-text-200.png',fullPage:true});
});
await test('No-JavaScript core content, links and form fallback remain usable',async()=>{
    const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const p=await c.newPage();await p.goto(base);assert.equal(await p.locator('h1').isVisible(),true);assert.equal(await p.locator('#work img').count(),5);assert.ok(await p.locator('a[href="mailto:hello@redevops.in"]').count());await c.close();
});
await writeFile('tools/qa/reports/editorial-checks.json',JSON.stringify({results,checks,errors},null,2));
console.log(`${results.length} route/viewport checks; ${checks.length} behaviour groups passed.`);
await browser.close();

