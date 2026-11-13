import { chromium } from 'playwright-core';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../..',import.meta.url)));
await mkdir('tools/qa/reports',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--remote-debugging-port=9223']});
const results=[];
const base=process.env.BASE||'http://localhost:3200';
for(const route of ['/','/work/the-ferment-formula.html']) for(const mode of ['mobile','desktop']) {
 const result=await lighthouse(base+route,{port:9223,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']},mode==='desktop'?desktopConfig:undefined);
 const r=result.lhr;
 results.push({route,mode,scores:Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,v.score*100])),LCP:r.audits['largest-contentful-paint'].displayValue,CLS:r.audits['cumulative-layout-shift'].displayValue,TBT:r.audits['total-blocking-time'].displayValue,bytes:r.audits['total-byte-weight'].numericValue,failures:Object.values(r.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,details:a.details}))});
 await writeFile(`tools/qa/reports/lighthouse-${route.replace(/\W+/g,'-')}-${mode}.json`,JSON.stringify(r,null,2));
}
await writeFile('tools/qa/reports/performance.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({failures,...rest})=>({...rest,failed:failures.map(f=>f.id)})),null,1));
await browser.close();
