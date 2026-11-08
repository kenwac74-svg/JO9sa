'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const file = path.join(__dirname, 'jo9-reference.html');

const server = http.createServer((request, response) => {
  if (request.url !== '/' || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  const page = fs.readFileSync(file);
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': page.length,
  }).end(request.method === 'HEAD' ? undefined : page);
});
server.listen(Number(process.argv[2]) || 0, '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}/`));
