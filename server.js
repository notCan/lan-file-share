const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const APP_ROOT = process.pkg ? path.dirname(process.execPath) : __dirname;
require('dotenv').config({ path: path.join(APP_ROOT, '.env') });
const express = require('express');

const DATA_DIR = path.join(APP_ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'lan-share-jwt-secret-change-in-production';
const COOKIE_NAME = 'token';
const REMEMBER_ME_DAYS = 30;

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    fs.accessSync(USERS_FILE);
  } catch {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsers() {
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function authFromCookie(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3336;

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

const PUBLIC_ROOT = process.pkg ? __dirname : APP_ROOT;
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(PUBLIC_ROOT, 'public')));

if (!fs.existsSync(SHARED_FOLDER)) {
  fs.mkdirSync(SHARED_FOLDER, { recursive: true });
}

function requireAuth(req, res, next) {
  const user = authFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Oturum gerekli' });
  req.user = user;
  next();
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

// ——— Auth API (lan-notes ile aynı) ———

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    const trimmed = String(username).trim().toLowerCase();
    if (trimmed.length < 2) return res.status(400).json({ error: 'Kullanıcı adı en az 2 karakter olmalı' });
    const data = readUsers();
    if (data.users.some(u => u.username.toLowerCase() === trimmed)) return res.status(400).json({ error: 'Bu kullanıcı adı alınmış' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), username: trimmed, passwordHash: hash };
    data.users.push(user);
    writeUsers(data);
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: REMEMBER_ME_DAYS + 'd' });
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayıt olunamadı' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    const data = readUsers();
    const user = data.users.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    const maxAge = rememberMe ? REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: rememberMe ? REMEMBER_ME_DAYS + 'd' : '1d' });
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge });
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).end();
});

app.get('/api/auth/me', (req, res) => {
  const user = authFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  res.json({ user: { id: user.id, username: user.username } });
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
  ensureDirs();
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
