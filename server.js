const path = require('path');
const fs = require('fs');
const os = require('os');

// exe ile çalışırken .env ve config exe'nin olduğu klasörden okunur
const APP_ROOT = process.pkg ? path.dirname(process.execPath) : __dirname;
require('dotenv').config({ path: path.join(APP_ROOT, '.env') });

const express = require('express');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const LOGIN_USERNAME = process.env.LOGIN_USERNAME;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

// Paylaşım klasörü: önce config.json, yoksa .env SHARED_FOLDER, yoksa 'shared'
let SHARED_FOLDER;
try {
  const configPath = path.join(APP_ROOT, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const folder = config.sharedFolder;
    if (folder) {
      SHARED_FOLDER = path.isAbsolute(folder) ? folder : path.resolve(APP_ROOT, folder);
    }
  }
} catch (_) {}
if (!SHARED_FOLDER) {
  SHARED_FOLDER = path.resolve(APP_ROOT, process.env.SHARED_FOLDER || 'shared');
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'lan-share-secret-change-in-production';

app.use(express.json());
// exe içinde public gömülü (pkg snapshot); normal çalışmada proje klasörü
const PUBLIC_ROOT = process.pkg ? __dirname : APP_ROOT;
app.use(express.static(path.join(PUBLIC_ROOT, 'public')));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

if (!fs.existsSync(SHARED_FOLDER)) {
  fs.mkdirSync(SHARED_FOLDER, { recursive: true });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Oturum gerekli' });
}

function getFileSize(filePath) {
  try {
    const bytes = fs.statSync(filePath).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } catch {
    return '-';
  }
}

// ——— API ———

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Kullanıcı adı veya şifre hatalı.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/files', requireAuth, (req, res) => {
  let files = [];
  try {
    const entries = fs.readdirSync(SHARED_FOLDER, { withFileTypes: true });
    files = entries
      .filter(e => e.isFile())
      .map(e => ({ name: e.name, size: getFileSize(path.join(SHARED_FOLDER, e.name)) }));
  } catch (err) {
    console.error('Klasör okunamadı:', err.message);
  }
  res.json({ files });
});

app.get('/api/download/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!filename) return res.status(400).json({ error: 'Geçersiz dosya.' });
  const filePath = path.join(SHARED_FOLDER, filename);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: 'Dosya bulunamadı.' });
  }
  res.download(filePath, filename);
});

// SPA: tüm sayfa isteklerinde index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  let ip = 'localhost';
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name]) {
      if (n.family === 'IPv4' && !n.internal) { ip = n.address; break; }
    }
    if (ip !== 'localhost') break;
  }
  const url = 'http://' + ip + ':' + PORT;
  console.log('');
  console.log('  LAN Dosya Paylaşım sunucusu çalışıyor.');
  console.log('  Yerel:    http://localhost:' + PORT);
  console.log('  Ağ (LAN): ' + url);
  console.log('  Paylaşım klasörü: ' + SHARED_FOLDER);
  console.log('');
  try {
    require('qrcode-terminal').generate(url, { small: true });
  } catch (_) {}
  console.log('');
});
