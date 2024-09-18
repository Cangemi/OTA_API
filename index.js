
const express = require('express');
const app = express();
const path = require('path');

app.get('/', (req, res) => {
  res.send('<p>hello from express</p>');
});

app.get('/update', (req, res) => {
  const firmware = path.join(__dirname, 'firmware', 'firmware.bin');
  res.download(firmware);
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});