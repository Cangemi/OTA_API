const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const md5 = require("md5-file");
var router = express.Router();

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, 'media');
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
app.get('/firmware', function(req, res, next) {
    console.log(req.headers);
  const filePath = path.join(uploadDir, 'firmware.bin');

  const options = {
    headers: {
     "x-MD5":  md5.sync(filePath)
    }
   }

  // Verifica se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Arquivo de firmware não encontrado');
  }

  // Obtém o tamanho do arquivo
  const stat = fs.statSync(filePath);

  // Configura os cabeçalhos adequados
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'attachment; filename="firmware.bin"');

  // Envia o arquivo como resposta
  res.sendFile(file, function (err) {
    if (err) {
     next(err)
    } else {
     console.log('Sent:', file)
    }
   });
});

// Endpoint para exibir o formulário de upload
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para fazer upload do arquivo
app.post('/upload', upload.single('firmware'), (req, res) => {
  res.send('Arquivo enviado com sucesso!');
});

app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
