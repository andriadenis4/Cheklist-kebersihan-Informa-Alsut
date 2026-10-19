import type { ChecklistItem, DayChecklist, PetugasShift } from '../types/checklist.ts';

export const MANAGERS_DATABASE = [
  { nip: '111711', dob: '28071989', name: 'ABDUL HAKIM', role: 'manager' as const },
  { nip: '114802', dob: '10041987', name: 'ANGGA FARAMOUR PUTRA', role: 'manager' as const },
  { nip: '166874', dob: '21111999', name: 'AURELIO ADOLF KOMUNA', role: 'manager' as const },
  { nip: '193053', dob: '09012002', name: 'DENIS ANDRIA JAYA', role: 'manager' as const },
  { nip: '113128', dob: '29011995', name: 'DWI ARISANDI', role: 'manager' as const },
  { nip: '094756', dob: '14011989', name: 'FAHMI UTOMO WIDODO.', role: 'manager' as const },
  { nip: '094628', dob: '14121989', name: 'IDRUS AL MASYHUR.', role: 'manager' as const },
  { nip: '138977', dob: '22051995', name: 'MEYLINDA LELIANA BR SARAGIH', role: 'manager' as const },
  { nip: '096849', dob: '03071985', name: 'OKY OKTAVIANUS', role: 'manager' as const },
  { nip: '107797', dob: '09011990', name: 'ROFIYANDI.', role: 'manager' as const },
  { nip: '137141', dob: '07011995', name: 'SEPTIAN DWI YOGA', role: 'manager' as const },
  { nip: '128038', dob: '19061989', name: 'VIVIN CHRISWARDANI', role: 'manager' as const },
];

export const DEFAULT_USERS_DATABASE = [
  { nip: 'E01358', password: '24031990', name: 'AHMAD WANOZHA', role: 'user' as const },
  { nip: 'E03638', password: '13041981', name: 'ALEK VANLENDER', role: 'user' as const },
  { nip: 'E04823', password: '17112004', name: 'FERDY SYAWAL', role: 'user' as const },
  { nip: 'E02878', password: '04121991', name: 'IMAN CAHYA NUGRAHA', role: 'user' as const },
  { nip: 'E01357', password: '06071997', name: 'JAENUDIN FIJAY', role: 'user' as const },
  { nip: 'E03064', password: '11071977', name: 'LANGGENG WIDODO.', role: 'user' as const },
  { nip: 'E04814', password: '07111999', name: 'SUKOHARJO', role: 'user' as const },
  { nip: 'E03063', password: '10101987', name: 'SYARIFUDIN.', role: 'user' as const },
  { nip: '123456', password: '123456', name: 'PETUGAS OB', role: 'user' as const },
];

export const INFORMA_ALAM_SUTERA_COORDS = {
  lat: -6.22384,
  lng: 106.64917,
  name: 'Informa Mall @ Alam Sutera / Living World Alam Sutera, Tangerang'
};

export const INITIAL_CHECKLIST_ITEMS_TEMPLATE: Omit<ChecklistItem, 'pagi' | 'siang' | 'sore' | 'malam'>[] = [
  { id: 1, item: 'Meja pingpong', standar: 'Bersih, bebas debu', keterangan: '' },
  { id: 2, item: 'Permukaan meja', standar: 'Tidak ada noda/cairan', keterangan: '' },
  { id: 3, item: 'Net pingpong', standar: 'Terpasang rapi', keterangan: '' },
  { id: 4, item: 'Bet & bola pingpong', standar: 'Lengkap & tersimpan', keterangan: '' },
  { id: 5, item: 'Rak/perlengkapan', standar: 'Bersih & tertata', keterangan: '' },
  { id: 6, item: 'Lantai area', standar: 'Disapu & dipel', keterangan: '' },
  { id: 7, item: 'Tidak ada sampah', standar: 'Area bersih', keterangan: '' },
  { id: 8, item: 'Tempat sampah', standar: 'Tidak penuh', keterangan: '' },
  { id: 9, item: 'Dinding/Kaca', standar: 'Bersih', keterangan: '' },
  { id: 10, item: 'Pencahayaan', standar: 'Normal', keterangan: '' },
  { id: 11, item: 'Aroma ruangan', standar: 'Segar', keterangan: '' },
  { id: 12, item: 'Area siap digunakan', standar: 'Bersih & aman', keterangan: '' }
];

export function getTodayDateString(d: Date = new Date()): string {
  // Return YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthYearString(d: Date = new Date()): string {
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function createCleanDayChecklist(dateStr: string = getTodayDateString()): DayChecklist {
  const items: ChecklistItem[] = INITIAL_CHECKLIST_ITEMS_TEMPLATE.map(t => ({
    ...t,
    keterangan: '',
    pagi: null,
    siang: null,
    sore: null,
    malam: null
  }));

  const petugas: PetugasShift[] = [
    { shift: 'Pagi', namaPetugas: '', jam: '', paraf: '' },
    { shift: 'Siang', namaPetugas: '', jam: '', paraf: '' },
    { shift: 'Sore', namaPetugas: '', jam: '', paraf: '' },
    { shift: 'Malam', namaPetugas: '', jam: '', paraf: '' },
  ];

  return {
    date: dateStr,
    location: 'Informa Alam Sutera',
    bulan: getMonthYearString(),
    items,
    petugas,
    temuan: [],
    lastUpdated: new Date().toISOString()
  };
}
