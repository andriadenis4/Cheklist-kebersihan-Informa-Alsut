import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ExternalLink,
  User,
  Check,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  AuthUser,
  ChecklistItem,
  DayChecklist,
  PetugasShift,
  ShiftRecord,
  ShiftType,
  TemuanPerbaikan,
} from '../types/checklist';
import { PhotoDetailModal } from './PhotoDetailModal';
import { fetchChecklistByDate, submitTemuan, resetToday } from '../services/checklistApi';

interface ManagerDashboardViewProps {
  user: AuthUser;
  checklist: DayChecklist;
  onChecklistUpdated: (updated: DayChecklist) => void;
  availableDates: string[];
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
  user,
  checklist,
  onChecklistUpdated,
  availableDates,
}) => {
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'All' | ShiftType>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePhotoDetail, setActivePhotoDetail] = useState<{
    record: ShiftRecord;
    item: ChecklistItem;
    shift: ShiftType;
  } | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // Compute shift statistics
  const shiftStats: Record<ShiftType, { done: number; total: number }> = {
    Pagi: { done: 0, total: checklist.items.length },
    Siang: { done: 0, total: checklist.items.length },
    Sore: { done: 0, total: checklist.items.length },
    Malam: { done: 0, total: checklist.items.length },
  };

  checklist.items.forEach((item) => {
    if (item.pagi?.completed) shiftStats.Pagi.done++;
    if (item.siang?.completed) shiftStats.Siang.done++;
    if (item.sore?.completed) shiftStats.Sore.done++;
    if (item.malam?.completed) shiftStats.Malam.done++;
  });

  const totalPossible = checklist.items.length * 4;
  const totalCompleted =
    shiftStats.Pagi.done + shiftStats.Siang.done + shiftStats.Sore.done + shiftStats.Malam.done;
  const totalPercentage = Math.round((totalCompleted / totalPossible) * 100);

  // Filter items based on search and shift
  const filteredItems = checklist.items.filter((item) => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.standar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedShiftFilter === 'All') return true;

    const shiftKey = selectedShiftFilter.toLowerCase() as 'pagi' | 'siang' | 'sore' | 'malam';
    return item[shiftKey] !== null;
  });

  const handleDateChange = async (dateStr: string) => {
    setIsLoadingDate(true);
    try {
      const data = await fetchChecklistByDate(dateStr);
      onChecklistUpdated(data);
    } finally {
      setIsLoadingDate(false);
    }
  };

  const handleUpdateTemuanStatus = async (item: TemuanPerbaikan, newStatus: 'Open' | 'Progress' | 'Selesai') => {
    const updated = await submitTemuan({ ...item, status: newStatus }, checklist.date);
    onChecklistUpdated(updated);
  };

  const handleResetToday = async () => {
    const clean = await resetToday();
    onChecklistUpdated(clean);
    setIsResetConfirmOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Manager Banner & Date Controller */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e55541] text-white text-[11px] font-extrabold uppercase tracking-wide">
                Monitoring Manager
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Pemeriksaan Realtime Seluruh Shift
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0f4372] mt-1">
              {checklist.location}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dipantau oleh: <strong className="text-slate-800">{user.name}</strong> (NIP: {user.nip})
            </p>
          </div>

          {/* Action buttons & Date archive picker */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Archive Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Calendar className="w-4 h-4 text-[#0f4372]" />
              <span className="font-semibold text-slate-700">Tanggal:</span>
              <select
                value={checklist.date}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isLoadingDate}
                className="bg-transparent font-bold text-[#0f4372] outline-none cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d} {d === checklist.date ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#0f4372] hover:bg-[#0c365c] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Cetak format fisik dokumen PDF"
            >
              <Printer className="w-4 h-4 text-[#f6b742]" />
              Cetak / Unduh PDF
            </button>

            {/* Reset Today (Optional manager control) */}
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 border border-slate-200 transition"
              title="Reset data hari ini (Manual)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* KPI Cards: Completion Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Progress */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-gradient-to-br from-[#0f4372] to-[#0a2c4c] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Total Selesai
            </span>
            <span className="text-xs font-extrabold bg-[#f6b742] text-[#0f4372] px-2 py-0.5 rounded-full">
              {totalPercentage}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold tracking-tight">
              {totalCompleted} <span className="text-sm font-normal text-blue-200">/ {totalPossible}</span>
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">
              Total titik pemeriksaan
            </div>
          </div>
          <div className="w-full bg-blue-900/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#83baa3] h-full rounded-full transition-all duration-500"
              style={{ width: `${totalPercentage}%` }}
            />
          </div>
        </div>

        {/* Shift Pagi */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Shift Pagi</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">
              {shiftStats.Pagi.done} <span className="text-xs font-normal text-slate-400">/ 12</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {Math.round((shiftStats.Pagi.done / 12) * 100)}% selesai
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${(shiftStats.Pagi.done / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Shift Siang */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Shift Siang</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">
              {shiftStats.Siang.done} <span className="text-xs font-normal text-slate-400">/ 12</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {Math.round((shiftStats.Siang.done / 12) * 100)}% selesai
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${(shiftStats.Siang.done / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Shift Sore */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Shift Sore</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">
              {shiftStats.Sore.done} <span className="text-xs font-normal text-slate-400">/ 12</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {Math.round((shiftStats.Sore.done / 12) * 100)}% selesai
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full"
              style={{ width: `${(shiftStats.Sore.done / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Shift Malam */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Shift Malam</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">
              {shiftStats.Malam.done} <span className="text-xs font-normal text-slate-400">/ 12</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {Math.round((shiftStats.Malam.done / 12) * 100)}% selesai
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${(shiftStats.Malam.done / 12) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* Live Photo Gallery Feed (Latest Submissions) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#e55541]" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
              Galeri Bukti Foto Lapangan Hari Ini
            </h3>
          </div>
          
          {/* Shift Filter Pill Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
            {(['All', 'Pagi', 'Siang', 'Sore', 'Malam'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedShiftFilter(filter)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedShiftFilter === filter
                    ? 'bg-white text-[#0f4372] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'All' ? 'Semua Shift' : `Shift ${filter}`}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {renderPhotoGallery()}
      </div>

      {/* Main 12-Item Checklist Table (Exact PDF layout for Manager) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Top Bar */}
        <div className="bg-[#0f4372] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
              Tabel Lembar Pemeriksaan (12 Item Sesuai PDF)
            </h3>
            <span className="text-xs text-blue-200">
              Klik pada kotak shift yang telah selesai untuk memeriksa foto asli dan verifikasi GPS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari item..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-white/10 text-white placeholder-blue-200 focus:bg-white focus:text-slate-900 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4 w-44">Item Pemeriksaan</th>
                <th className="py-3 px-4 w-48">Standar</th>
                <th className="py-3 px-3 text-center w-28 bg-blue-50/50">Pagi</th>
                <th className="py-3 px-3 text-center w-28 bg-amber-50/50">Siang</th>
                <th className="py-3 px-3 text-center w-28 bg-orange-50/50">Sore</th>
                <th className="py-3 px-3 text-center w-28 bg-slate-50">Malam</th>
                <th className="py-3 px-4 min-w-[140px]">Ket.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-500">
                    <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-slate-700 leading-6 text-[11px]">
                      {item.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.item}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[11px] block">
                      {item.standar}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center bg-blue-50/20">
                    {renderManagerShiftCell(item, 'Pagi', item.pagi)}
                  </td>
                  <td className="py-2.5 px-2 text-center bg-amber-50/20">
                    {renderManagerShiftCell(item, 'Siang', item.siang)}
                  </td>
                  <td className="py-2.5 px-2 text-center bg-orange-50/20">
                    {renderManagerShiftCell(item, 'Sore', item.sore)}
                  </td>
                  <td className="py-2.5 px-2 text-center bg-slate-50/30">
                    {renderManagerShiftCell(item, 'Malam', item.malam)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.keterangan ? (
                      <span className="text-[11px] bg-slate-100 p-1.5 rounded block text-slate-800">
                        {item.keterangan}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Pengisian Petugas (Manager View) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0f4372] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#f6b742]" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Pengisian Petugas (Paraf & Shift)
            </h3>
          </div>
          <span className="text-xs text-blue-200">
            {checklist.petugas.filter((p) => p.namaPetugas).length} / 4 Shift Terisi
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4 w-32">Shift</th>
                  <th className="py-2.5 px-4">Nama Petugas</th>
                  <th className="py-2.5 px-4 w-40">Jam</th>
                  <th className="py-2.5 px-4 w-48">Paraf / NIP</th>
                  <th className="py-2.5 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {checklist.petugas.map((p) => (
                  <tr key={p.shift} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-[#0f4372]">Shift {p.shift}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.namaPetugas || <span className="text-slate-400 italic">Belum diisi</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {p.jam || <span className="text-slate-400 italic">-</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {p.paraf ? (
                        <span className="bg-blue-50 text-[#0f4372] px-2 py-0.5 rounded font-bold border border-blue-200">
                          NIP: {p.paraf}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.namaPetugas ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION: Temuan & Tindakan Perbaikan (Manager Management) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0f4372] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#e55541]" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Temuan & Tindakan Perbaikan
            </h3>
          </div>
          <span className="text-xs bg-[#e55541] text-white font-bold px-2 py-0.5 rounded-full">
            {checklist.temuan.length} Catatan
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {checklist.temuan.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
              Tidak ada temuan atau kendala kebersihan yang dilaporkan untuk tanggal ini. Kondisi baik.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4 w-28">Tanggal</th>
                    <th className="py-2.5 px-4">Temuan Petugas</th>
                    <th className="py-2.5 px-4">Tindakan Perbaikan</th>
                    <th className="py-2.5 px-4 w-32">PIC</th>
                    <th className="py-2.5 px-4 w-36">Status Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {checklist.temuan.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{t.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.temuan}</td>
                      <td className="py-3 px-4 text-slate-700">{t.tindakan}</td>
                      <td className="py-3 px-4 text-slate-600">{t.pic}</td>
                      <td className="py-3 px-4">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTemuanStatus(t, e.target.value as any)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            t.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : t.status === 'Progress'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="Progress">Progress</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Reset Data Hari Ini?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Aplikasi dirancang otomatis mereset setiap pukul 00:00 (12 malam). Tindakan ini akan mengosongkan seluruh checklist hari ini secara manual. Yakin ingin melanjutkan?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToday}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e55541] hover:bg-red-600 text-white shadow"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Inspection Detail Modal */}
      {activePhotoDetail && (
        <PhotoDetailModal
          isOpen={true}
          onClose={() => setActivePhotoDetail(null)}
          record={activePhotoDetail.record}
          itemNumber={activePhotoDetail.item.id}
          itemName={activePhotoDetail.item.item}
          itemStandar={activePhotoDetail.item.standar}
          shift={activePhotoDetail.shift}
        />
      )}

    </div>
  );

  function renderPhotoGallery() {
    // Collect all submitted photos from the checklist
    const completedList: {
      item: ChecklistItem;
      shift: ShiftType;
      record: ShiftRecord;
    }[] = [];

    checklist.items.forEach((item) => {
      (['pagi', 'siang', 'sore', 'malam'] as const).forEach((shiftKey) => {
        const shiftCapitalized = (shiftKey.charAt(0).toUpperCase() + shiftKey.slice(1)) as ShiftType;
        if (selectedShiftFilter !== 'All' && selectedShiftFilter !== shiftCapitalized) return;
        const rec = item[shiftKey];
        if (rec?.completed && rec.photoUrl) {
          completedList.push({
            item,
            shift: shiftCapitalized,
            record: rec,
          });
        }
      });
    });

    if (completedList.length === 0) {
      return (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-xs font-semibold text-slate-600">
            Belum ada dokumentasi foto untuk {selectedShiftFilter === 'All' ? 'hari ini' : `Shift ${selectedShiftFilter}`}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Foto yang diambil oleh Petugas OB melalui kamera langsung akan tampil di sini secara realtime.
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {completedList.map((entry, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActivePhotoDetail(entry)}
            className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-left aspect-square hover:shadow-md transition-all cursor-pointer"
          >
            <img
              src={entry.record.photoUrl}
              alt={entry.item.item}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Shift Badge */}
            <div className="absolute top-1.5 left-1.5 bg-[#0f4372]/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              Shift {entry.shift}
            </div>

            {/* Bottom Info Gradient */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-white">
              <div className="text-[11px] font-bold line-clamp-1 leading-tight">
                #{entry.item.id} {entry.item.item}
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5">
                <span>{entry.record.formattedTime}</span>
                <span className="text-[#83baa3] font-bold">✓ Terverifikasi</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  function renderManagerShiftCell(item: ChecklistItem, shiftName: ShiftType, record: ShiftRecord | null) {
    if (record?.completed) {
      return (
        <button
          type="button"
          onClick={() => setActivePhotoDetail({ record, item, shift: shiftName })}
          className="group relative w-full flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 transition-all shadow-xs"
          title="Klik untuk membuka detail foto & GPS"
        >
          <div className="relative w-12 h-9 rounded-md overflow-hidden bg-slate-900 mb-1 border border-emerald-400">
            <img
              src={record.photoUrl}
              alt="Bukti Foto"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-0.5 right-0.5 bg-emerald-600 text-white rounded-full p-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-900 line-clamp-1">
            {record.formattedTime || 'Selesai'}
          </span>
          <span className="text-[9px] text-emerald-600 font-mono">
            {record.gps ? '📍 GPS Valid' : 'Selesai'}
          </span>
        </button>
      );
    }

    return (
      <div className="py-2.5 text-center text-slate-300 text-[11px] font-medium italic">
        Belum dicek
      </div>
    );
  }
};
