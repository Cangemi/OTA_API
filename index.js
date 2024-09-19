const express = require('express');
const fs = require('fs');
const { networkInterfaces } = require('os');
const path = require('path');
const multer = require('multer');

const app = express();
const nets = networkInterfaces();

const PORT = 3000;

const uploadDir = path.join(__dirname, 'firmware');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Diretório onde o arquivo será salvo
  },
  filename: (req, file, cb) => {
    const newFileName = 'firmware.bin'; // Nome fixo do arquivo
    cb(null, newFileName); // Renomeia o arquivo
  }
});

const upload = multer({ storage: storage });

// Endpoint para fornecer o arquivo .bin
app.get('/firmware', (req, res) => {
  const filePath = path.join(uploadDir, 'firmware.bin');
  res.setHeader('Content-Disposition', 'attachment; filename="firmware.bin"');
  res.sendFile(filePath);
});

// Endpoint para exibir o formulário de upload
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para fazer upload do arquivo
app.post('/upload', upload.single('firmware'), (req, res) => {
  res.send('Arquivo enviado com sucesso!');
});

app.listen(PORT, () => {
  const results = {}; // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          if (net.family === 'IPv4' && !net.internal) {
              if (!results[name]) {
                  results[name] = [];
              }
              results[name].push(net.address);
          }
      }
  }

  console.log('Listening on port '+PORT+'\n', results)
});
