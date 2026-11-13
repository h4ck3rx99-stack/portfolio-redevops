// Adapter: lib/check.js is a Node (req, res) handler with its own SSRF guards.
import handler from '@/lib/check';

export async function GET(request) {
    const headers = {};
    let body = '';
    const res = { statusCode: 200, setHeader: (k, v) => { headers[k] = v; }, end: (b) => { body = b || ''; } };
    await handler({ method: 'GET', url: request.url }, res);
    return new Response(body, { status: res.statusCode, headers });
}
