const express = require('express');
const fs = require('fs');
const { networkInterfaces } = require('os');
const path = require('path');
const multer = require('multer');

const app = express();
const nets = networkInterfaces();

const PORT = 3000;


function deleteFirmwareFile(uploadDir) {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Erro ao ler o diretório de firmware:', err);
      return;
    }

    // Filtrar e deletar arquivos que começam com 'firmware_'
    files.forEach(file => {
      if (file.startsWith('firmware_')) {
        const filePath = path.join(uploadDir, file);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Erro ao apagar o arquivo:', unlinkErr);
          } else {
            console.log(`Arquivo ${file} deletado com sucesso.`);
          }
        });
      }
    });
  });
}

const uploadDir = path.join(__dirname, 'firmware');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware para processar campos de texto do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Diretório onde o arquivo será salvo
  },
  filename: (req, file, cb) => {
    deleteFirmwareFile(uploadDir);
    const version = req.body.version;
    const key = req.body.key;
    console.log(`key: ${key}`);
    console.log(`version: ${version}`);
    const newFileName = `firmware_key.${key}_version_${version}.bin`; // Concatena a versão com o nome do arquivo
    cb(null, newFileName); // Renomeia o arquivo
  }
});

const upload = multer({ storage });


// Endpoint para fornecer o arquivo .bin com a versão fornecida
app.get('/firmware/:version', (req, res) => {
  const oldVersion = req.params.version;
  const apiKey = req.query.key;
  const files = fs.readdirSync(uploadDir);

  console.log(`key: ${apiKey}`);
  
  // Filtra os arquivos que seguem o padrão firmware_version_*.bin
  const firmwareFiles = files.filter(file => file.startsWith(`firmware_key.${apiKey}_version_`) && file.endsWith('.bin'));
  console.log(`ERRO 404: ${firmwareFiles.length}`);
  if (firmwareFiles.length === 0) {
    console.log(`ERRO 404 dentro: ${firmwareFiles.length}`);
    return res.status(404).send('Nenhum firmware encontrado.');
  }

  let latestVersion = '';
  let filePath = '';

  // Encontra a versão mais recente
  firmwareFiles.forEach(file => {
    const versionMatch = file.match(new RegExp(`firmware_key\\.${apiKey}_version_(.+)\\.bin`));
    if (versionMatch) {
      const version = versionMatch[1];
      if (version > latestVersion) {
        latestVersion = version;
        filePath = path.join(uploadDir, file);
      }
    }
  });

  // Compara a versão mais recente com a oldVersion
  if (latestVersion === oldVersion) {
    return res.status(304).send('Firmware já está atualizado.');
  }

  // Se a versão for diferente, envia o arquivo
  if (filePath) {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    return res.sendFile(filePath);
  } else {
    return res.status(404).send('Firmware não encontrado.');
  }
});

// Endpoint para exibir o formulário de upload
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para fazer upload do arquivo
app.post('/upload', upload.single('firmware'), (req, res) => {
  const version = req.body.version; // Agora `req.body.version` está disponível


  if (version) {
    res.send(`Arquivo firmware_${version}.bin enviado com sucesso!`);
  } else {
    res.status(400).send('Versão do firmware não especificada.');
  }
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
