// 极简静态文件服务器：node serve.js [端口]
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'public');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };
http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('Not Found'); return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
}).listen(process.argv[2] || 8080, () => console.log('Serving public/ at http://localhost:' + (process.argv[2] || 8080)));
