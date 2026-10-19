import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MANAGERS_DATABASE, DEFAULT_USERS_DATABASE, createCleanDayChecklist, getTodayDateString } from './src/data/defaultChecklist.ts';
import { DayChecklist, ShiftRecord, ShiftType } from './src/types/checklist.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Allow json bodies up to 25MB for realtime camera captures
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Persistence directory
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'checklists.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + file sync
let store: Record<string, DayChecklist> = {};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load store from disk:', err);
    store = {};
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to disk:', err);
  }
}

loadStore();

// Helper to get or initialize today's checklist
function getDayChecklist(dateStr: string): DayChecklist {
  if (!store[dateStr]) {
    store[dateStr] = createCleanDayChecklist(dateStr);
    saveStore();
  }
  return store[dateStr];
}

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password, customName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const cleanUsername = String(username).trim();
  const cleanPassword = String(password).trim();

  // Check Manager
  const managerMatch = MANAGERS_DATABASE.find(
    m => m.nip.toUpperCase() === cleanUsername.toUpperCase() && m.dob === cleanPassword
  );

  if (managerMatch) {
    return res.json({
      success: true,
      user: {
        nip: managerMatch.nip,
        name: managerMatch.name,
        role: 'manager',
        loginTime: new Date().toISOString()
      }
    });
  }

  // Check User (Petugas OB)
  const defaultUser = DEFAULT_USERS_DATABASE.find(
    u => u.nip.toUpperCase() === cleanUsername.toUpperCase() && u.password === cleanPassword
  );

  if (defaultUser) {
    return res.json({
      success: true,
      user: {
        nip: defaultUser.nip,
        name: defaultUser.name,
        role: 'user',
        loginTime: new Date().toISOString()
      }
    });
  }

  return res.status(401).json({ error: 'NIP atau Password salah. Silakan periksa kembali.' });
});

// GET today's checklist (resets automatically at midnight because date changes)
app.get('/api/checklist/today', (_req, res) => {
  const today = getTodayDateString();
  const data = getDayChecklist(today);
  res.json({
    date: today,
    checklist: data,
    serverTime: new Date().toISOString()
  });
});

// GET specific date checklist
app.get('/api/checklist/date/:date', (req, res) => {
  const dateStr = req.params.date;
  const data = getDayChecklist(dateStr);
  res.json({
    date: dateStr,
    checklist: data,
    serverTime: new Date().toISOString()
  });
});

// GET all dates history
app.get('/api/checklist/history', (_req, res) => {
  const dates = Object.keys(store).sort().reverse();
  const history = dates.map(date => {
    const item = store[date];
    let totalChecks = 0;
    let completedChecks = 0;
    item.items.forEach(it => {
      (['pagi', 'siang', 'sore', 'malam'] as const).forEach(shift => {
        totalChecks++;
        if (it[shift]?.completed) completedChecks++;
      });
    });

    return {
      date,
      location: item.location,
      totalChecks,
      completedChecks,
      percentage: Math.round((completedChecks / totalChecks) * 100),
      petugasCount: item.petugas.filter(p => p.namaPetugas).length,
      temuanCount: item.temuan.length,
      lastUpdated: item.lastUpdated
    };
  });

  res.json({ history });
});

// POST submit / update checklist item
app.post('/api/checklist/item', (req, res) => {
  const { date, itemId, shift, record, keterangan } = req.body as {
    date?: string;
    itemId: number;
    shift: ShiftType;
    record: ShiftRecord;
    keterangan?: string;
  };

  const targetDate = date || getTodayDateString();
  const dayData = getDayChecklist(targetDate);

  const itemIndex = dayData.items.findIndex(it => it.id === Number(itemId));
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item checklist tidak ditemukan' });
  }

  const shiftKey = shift.toLowerCase() as 'pagi' | 'siang' | 'sore' | 'malam';
  dayData.items[itemIndex][shiftKey] = record;

  if (keterangan !== undefined) {
    dayData.items[itemIndex].keterangan = keterangan;
  }

  dayData.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, checklist: dayData });
});

// POST update petugas shift table
app.post('/api/checklist/petugas', (req, res) => {
  const { date, petugasList } = req.body;
  const targetDate = date || getTodayDateString();
  const dayData = getDayChecklist(targetDate);

  if (Array.isArray(petugasList)) {
    dayData.petugas = petugasList;
    dayData.lastUpdated = new Date().toISOString();
    saveStore();
  }

  res.json({ success: true, checklist: dayData });
});

// POST add/update temuan
app.post('/api/checklist/temuan', (req, res) => {
  const { date, temuan } = req.body;
  const targetDate = date || getTodayDateString();
  const dayData = getDayChecklist(targetDate);

  if (!temuan) {
    return res.status(400).json({ error: 'Data temuan tidak valid' });
  }

  const existingIndex = dayData.temuan.findIndex(t => t.id === temuan.id);
  if (existingIndex >= 0) {
    dayData.temuan[existingIndex] = temuan;
  } else {
    dayData.temuan.push(temuan);
  }

  dayData.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, checklist: dayData });
});

// DELETE temuan
app.delete('/api/checklist/temuan/:id', (req, res) => {
  const { id } = req.params;
  const { date } = req.query as { date?: string };
  const targetDate = date || getTodayDateString();
  const dayData = getDayChecklist(targetDate);

  dayData.temuan = dayData.temuan.filter(t => t.id !== id);
  dayData.lastUpdated = new Date().toISOString();
  saveStore();

  res.json({ success: true, checklist: dayData });
});

// POST manual reset for today (optional manager feature)
app.post('/api/checklist/reset-today', (req, res) => {
  const today = getTodayDateString();
  store[today] = createCleanDayChecklist(today);
  saveStore();
  res.json({ success: true, checklist: store[today] });
});

// Setup Vite or Static Serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
