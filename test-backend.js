const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/user/login?username=admin&password=admin',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.log('Error:', e.message);
});

req.end();