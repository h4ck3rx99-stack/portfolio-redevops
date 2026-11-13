// Self-check for api/check.js — run: node api-check.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const handler = require('../../lib/check.js');
const { isPrivateIp, analyse } = handler._test;

// SSRF guard
for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:127.0.0.1', '100.64.0.1'])
    assert.equal(isPrivateIp(ip), true, ip);
for (const ip of ['8.8.8.8', '76.76.21.21', '2606:4700::1']) assert.equal(isPrivateIp(ip), false, ip);

// Analysis
const good = '<html lang="en"><head><title>Hoppers Brewing — Bengaluru</title><meta name="viewport" content="width=device-width"><meta name="description" content="Craft beer brewed in Bengaluru with seasonal specials and a taproom open daily."><meta property="og:title" content="x"><meta property="og:image" content="y"><link rel="icon" href="/f.ico"></head><body><h1>Hi</h1><img src="a.jpg" alt="a"></body></html>';
const r = analyse(good, 'https://hoppers.example/', good.length);
assert.ok(Object.values(r).flat().every((c) => c.pass), 'good page passes everything');
const bad = analyse('<html><body><img src="http://x/a.jpg"></body></html>', 'https://x.example/', 50);
assert.equal(bad.Mobile[0].pass, false);
assert.equal(bad.Security[1].pass, false);

// Unquoted attributes (valid HTML, e.g. example.com) must be read correctly
const unq = '<!doctype html><html lang=en><head><meta charset=utf-8><link rel=icon href=data:,><meta name=viewport content="width=device-width,initial-scale=1"><title>Example Domain</title></head><body><h1>x</h1></body></html>';
const ur = analyse(unq, 'https://example.com/', unq.length);
assert.equal(ur.Mobile[0].pass, true, 'unquoted viewport');
assert.equal(ur.Accessibility[0].pass, true, 'unquoted lang');
assert.equal(ur.Mobile[1].pass, true, 'unquoted icon rel');

// Handler: refuses private targets and non-http schemes
const call = async (url) => {
    const res = { headers: {}, statusCode: 0, body: '', setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ''; } };
    await handler({ method: 'GET', url: `/api/check?url=${encodeURIComponent(url)}`, query: { url } }, res);
    return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null };
};
assert.equal((await call('http://127.0.0.1/')).status, 422);
assert.equal((await call('http://localhost:8080/')).status, 422);
assert.equal((await call('file:///etc/passwd')).status, 422);

// Live (needs network): a real public page
const live = await call('https://example.com/');
assert.equal(live.status, 200, JSON.stringify(live.json));
assert.ok(live.json.checks.Security[0].pass);
console.log('api/check.js: all assertions passed');
