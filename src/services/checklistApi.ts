import { AuthUser, DayChecklist, PetugasShift, ShiftRecord, ShiftType, TemuanPerbaikan } from '../types/checklist';
import { createCleanDayChecklist, getTodayDateString, MANAGERS_DATABASE, DEFAULT_USERS_DATABASE } from '../data/defaultChecklist';

const STORAGE_KEY_AUTH = 'informa_as_auth_user';
const STORAGE_KEY_PREFIX = 'informa_as_checklist_';

export async function loginUser(username: string, password: string, customName?: string): Promise<AuthUser> {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword, customName })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
      return data.user;
    } else {
      const err = await res.json().catch(() => ({ error: 'Login gagal' }));
      throw new Error(err.error || 'Login gagal');
    }
  } catch (apiErr: any) {
    // If backend endpoint is unreachable, fallback to client-side credential verification
    console.warn('Backend login unavailable, fallback to client verification:', apiErr.message);
    
    // Check Manager
    const manager = MANAGERS_DATABASE.find(
      m => m.nip.toUpperCase() === cleanUsername.toUpperCase() && m.dob === cleanPassword
    );
    if (manager) {
      const user: AuthUser = {
        nip: manager.nip,
        name: manager.name,
        role: 'manager',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      return user;
    }

    // Check User Petugas OB
    const obUser = DEFAULT_USERS_DATABASE.find(
      u => u.nip.toUpperCase() === cleanUsername.toUpperCase() && u.password === cleanPassword
    );
    if (obUser) {
      const user: AuthUser = {
        nip: obUser.nip,
        name: obUser.name,
        role: 'user',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      return user;
    }

    throw new Error(apiErr.message || 'NIP atau Password salah. Silakan periksa kembali.');
  }
}

export function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

// Local storage backup helpers
function getLocalDayChecklist(date: string): DayChecklist {
  const key = `${STORAGE_KEY_PREFIX}${date}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  const clean = createCleanDayChecklist(date);
  localStorage.setItem(key, JSON.stringify(clean));
  return clean;
}

function saveLocalDayChecklist(checklist: DayChecklist): void {
  const key = `${STORAGE_KEY_PREFIX}${checklist.date}`;
  localStorage.setItem(key, JSON.stringify(checklist));
}

export async function fetchTodayChecklist(): Promise<DayChecklist> {
  const today = getTodayDateString();
  try {
    const res = await fetch('/api/checklist/today');
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Using local storage for today checklist:', err);
  }
  return getLocalDayChecklist(today);
}

export async function fetchChecklistByDate(date: string): Promise<DayChecklist> {
  try {
    const res = await fetch(`/api/checklist/date/${date}`);
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Using local storage for date checklist:', err);
  }
  return getLocalDayChecklist(date);
}

export async function submitChecklistItem(
  itemId: number,
  shift: ShiftType,
  record: ShiftRecord,
  keterangan?: string,
  date?: string
): Promise<DayChecklist> {
  const targetDate = date || getTodayDateString();

  try {
    const res = await fetch('/api/checklist/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: targetDate, itemId, shift, record, keterangan })
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Fallback to local storage item update:', err);
  }

  // Fallback local update
  const local = getLocalDayChecklist(targetDate);
  const idx = local.items.findIndex(it => it.id === itemId);
  if (idx !== -1) {
    const shiftKey = shift.toLowerCase() as 'pagi' | 'siang' | 'sore' | 'malam';
    local.items[idx][shiftKey] = record;
    if (keterangan !== undefined) {
      local.items[idx].keterangan = keterangan;
    }
    local.lastUpdated = new Date().toISOString();
    saveLocalDayChecklist(local);
  }
  return local;
}

export async function submitPetugasUpdate(petugasList: PetugasShift[], date?: string): Promise<DayChecklist> {
  const targetDate = date || getTodayDateString();

  try {
    const res = await fetch('/api/checklist/petugas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: targetDate, petugasList })
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Fallback to local storage petugas update:', err);
  }

  const local = getLocalDayChecklist(targetDate);
  local.petugas = petugasList;
  local.lastUpdated = new Date().toISOString();
  saveLocalDayChecklist(local);
  return local;
}

export async function submitTemuan(temuan: TemuanPerbaikan, date?: string): Promise<DayChecklist> {
  const targetDate = date || getTodayDateString();

  try {
    const res = await fetch('/api/checklist/temuan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: targetDate, temuan })
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Fallback to local storage temuan update:', err);
  }

  const local = getLocalDayChecklist(targetDate);
  const idx = local.temuan.findIndex(t => t.id === temuan.id);
  if (idx >= 0) {
    local.temuan[idx] = temuan;
  } else {
    local.temuan.push(temuan);
  }
  local.lastUpdated = new Date().toISOString();
  saveLocalDayChecklist(local);
  return local;
}

export async function deleteTemuanItem(id: string, date?: string): Promise<DayChecklist> {
  const targetDate = date || getTodayDateString();

  try {
    const res = await fetch(`/api/checklist/temuan/${id}?date=${targetDate}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Fallback to local storage temuan delete:', err);
  }

  const local = getLocalDayChecklist(targetDate);
  local.temuan = local.temuan.filter(t => t.id !== id);
  local.lastUpdated = new Date().toISOString();
  saveLocalDayChecklist(local);
  return local;
}

export async function resetToday(): Promise<DayChecklist> {
  const today = getTodayDateString();
  try {
    const res = await fetch('/api/checklist/reset-today', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      saveLocalDayChecklist(data.checklist);
      return data.checklist;
    }
  } catch (err) {
    console.warn('Fallback to local storage reset:', err);
  }

  const clean = createCleanDayChecklist(today);
  saveLocalDayChecklist(clean);
  return clean;
}

export async function fetchHistoryList(): Promise<any[]> {
  try {
    const res = await fetch('/api/checklist/history');
    if (res.ok) {
      const data = await res.json();
      return data.history;
    }
  } catch (err) {
    console.warn('Fallback history scan');
  }

  // Scan localStorage for stored dates
  const dates: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      dates.push(key.replace(STORAGE_KEY_PREFIX, ''));
    }
  }
  return dates.sort().reverse().map(date => {
    const item = getLocalDayChecklist(date);
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
}
