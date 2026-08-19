// Test if express.json works with the installed version
const express = require('express');
const http = require('http');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/test', (req, res) => {
  console.log('Body received:', JSON.stringify(req.body));
  res.json({ ok: true, body: req.body });
});

const server = app.listen(9999, () => {
  const data = JSON.stringify({ customerName: 'Test', customerPhone: '0912345678' });
  const options = {
    hostname: 'localhost', port: 9999, path: '/test', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  };
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => { console.log('Response:', body); server.close(); process.exit(0); });
  });
  req.write(data);
  req.end();
});
