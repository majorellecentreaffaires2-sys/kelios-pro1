const dns = require('dns');
dns.lookup('localhost', { family: 4 }, (err, res) => {
  console.log('IPv4 lookup:', res);
});

dns.lookup('localhost', { family: 6 }, (err, res) => {
  console.log('IPv6 lookup:', res);
});

dns.lookup('localhost', (err, res) => {
  console.log('Default lookup:', res);
});
