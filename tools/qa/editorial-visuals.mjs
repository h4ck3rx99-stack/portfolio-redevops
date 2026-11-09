import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage();
const out=[];
for(const [width,height] of [[360,640],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[390,400],[844,390]]) {
 await p.setViewportSize({width,height});await p.goto('http://localhost:5510/');await p.evaluate(()=>document.fonts.ready);
 const banner=p.locator('.consent-banner');
 out.push({width,height,banner:await banner.evaluate(e=>({h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width,scrollable:e.scrollHeight>e.clientHeight}))});
 await p.screenshot({path:`tools/qa/screenshots/editorial-banner-${width}-${height}.png`});
 await p.locator('.consent-banner [data-cookie-settings]').click();await p.screenshot({path:`tools/qa/screenshots/editorial-preferences-${width}-${height}.png`});await p.keyboard.press('Escape');
 await p.locator('.consent-banner [data-reject]').click();
 if(width===390||width===1440) {
  await p.screenshot({path:`tools/qa/screenshots/editorial-hero-${width}-${height}.png`});
  for(const id of ['work','team','contact']) {await p.locator('#'+id).scrollIntoViewIfNeeded();await p.screenshot({path:`tools/qa/screenshots/editorial-${id}-${width}-${height}.png`});}
  if(width===390){await p.locator('.menu-toggle').first().click();await p.screenshot({path:`tools/qa/screenshots/editorial-menu-${width}-${height}.png`});await p.keyboard.press('Escape');}
  await p.locator('#contactForm [type=submit]').click();await p.screenshot({path:`tools/qa/screenshots/editorial-form-error-${width}-${height}.png`});
 }
 await p.evaluate(()=>localStorage.clear());
}
await writeFile('tools/qa/reports/editorial-overlay-viewports.json',JSON.stringify(out,null,2));
await b.close();
