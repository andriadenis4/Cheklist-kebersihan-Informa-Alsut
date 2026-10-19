export type ShiftType = 'Pagi' | 'Siang' | 'Sore' | 'Malam';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  isAlamSuteraNearby?: boolean;
}

export interface ShiftRecord {
  completed: boolean;
  photoUrl: string;
  timestamp: string;
  formattedTime: string;
  petugasName: string;
  petugasNip: string;
  gps: GpsLocation | null;
  keterangan?: string;
}

export interface ChecklistItem {
  id: number;
  item: string;
  standar: string;
  keterangan: string;
  pagi: ShiftRecord | null;
  siang: ShiftRecord | null;
  sore: ShiftRecord | null;
  malam: ShiftRecord | null;
}

export interface PetugasShift {
  shift: ShiftType;
  namaPetugas: string;
  jam: string;
  paraf: string; // NIP atau tanda tangan
}

export interface TemuanPerbaikan {
  id: string;
  tanggal: string;
  temuan: string;
  tindakan: string;
  pic: string;
  status: 'Open' | 'Progress' | 'Selesai';
}

export interface DayChecklist {
  date: string; // YYYY-MM-DD
  location: string;
  bulan: string;
  items: ChecklistItem[];
  petugas: PetugasShift[];
  temuan: TemuanPerbaikan[];
  lastUpdated: string;
}

export interface AuthUser {
  nip: string;
  name: string;
  role: 'manager' | 'user';
  loginTime: string;
}
