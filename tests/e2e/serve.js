// Static server for browser tests — mirrors vercel.json rewrites (path routes → index.html).
// usage: node e2e/serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..');
const port = +process.argv[2] || 5055;
const rewrites = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).rewrites
  .map(r => new RegExp('^' + r.source.replace(/:[a-z]+/g, '[^/]+') + '$'));
const ignored = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8').split(/\r?\n/).filter(Boolean)
  .map(s => s.replace(/\/$/, ''));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || rewrites.some(re => re.test(p))) p = '/index.html';
  const rel = p.replace(/^\/+/, '');
  if (ignored.some(ig => rel === ig || rel.startsWith(ig + '/'))) { res.writeHead(404); return res.end('nf'); }
  const f = path.join(root, rel);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  const type = types[path.extname(f)] || 'application/octet-stream';
  // gzip text like Vercel's CDN does, so Lighthouse numbers are comparable to production.
  const gz = /text|json|javascript|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '');
  res.writeHead(200, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-cache' }, gz ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}));
  const stream = fs.createReadStream(f);
  (gz ? stream.pipe(require('zlib').createGzip()) : stream).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('serving ' + root + ' on http://127.0.0.1:' + port));
