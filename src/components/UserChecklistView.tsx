import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  Save,
  FileCheck,
  AlertTriangle,
  Info,
  Calendar,
  PenTool
} from 'lucide-react';
import {
  AuthUser,
  ChecklistItem,
  DayChecklist,
  GpsLocation,
  PetugasShift,
  ShiftRecord,
  ShiftType,
  TemuanPerbaikan,
} from '../types/checklist';
import { CameraModal } from './CameraModal';
import { PhotoDetailModal } from './PhotoDetailModal';
import { submitChecklistItem, submitPetugasUpdate, submitTemuan, deleteTemuanItem } from '../services/checklistApi';

interface UserChecklistViewProps {
  user: AuthUser;
  checklist: DayChecklist;
  onChecklistUpdated: (updated: DayChecklist) => void;
}

export const UserChecklistView: React.FC<UserChecklistViewProps> = ({
  user,
  checklist,
  onChecklistUpdated,
}) => {
  // Active camera modal state
  const [activeCamera, setActiveCamera] = useState<{
    item: ChecklistItem;
    shift: ShiftType;
  } | null>(null);

  // Active photo detail inspection modal state
  const [activePhotoDetail, setActivePhotoDetail] = useState<{
    record: ShiftRecord;
    item: ChecklistItem;
    shift: ShiftType;
  } | null>(null);

  // Editable Petugas state
  const [petugasState, setPetugasState] = useState<PetugasShift[]>(checklist.petugas);
  const [isPetugasSaving, setIsPetugasSaving] = useState(false);
  const [petugasSavedMsg, setPetugasSavedMsg] = useState(false);

  // New Temuan form state
  const [newTemuan, setNewTemuan] = useState({
    temuan: '',
    tindakan: '',
    pic: user.name,
    status: 'Open' as 'Open' | 'Progress' | 'Selesai',
  });
  const [showAddTemuan, setShowAddTemuan] = useState(false);
  const [isTemuanSaving, setIsTemuanSaving] = useState(false);

  // Sync petugas state if checklist changes externally
  React.useEffect(() => {
    setPetugasState(checklist.petugas);
  }, [checklist.petugas]);

  // Open Camera for specific item & shift
  const handleOpenCapture = (item: ChecklistItem, shift: ShiftType) => {
    setActiveCamera({ item, shift });
  };

  // Submit from CameraModal
  const handleCameraSubmit = async (data: {
    photoUrl: string;
    gps: GpsLocation | null;
    keterangan: string;
  }) => {
    if (!activeCamera) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const record: ShiftRecord = {
      completed: true,
      photoUrl: data.photoUrl,
      timestamp: now.toISOString(),
      formattedTime,
      petugasName: user.name,
      petugasNip: user.nip,
      gps: data.gps,
      keterangan: data.keterangan,
    };

    const updated = await submitChecklistItem(
      activeCamera.item.id,
      activeCamera.shift,
      record,
      data.keterangan || activeCamera.item.keterangan,
      checklist.date
    );

    onChecklistUpdated(updated);
    setActiveCamera(null);

    // Auto update shift petugas jam & nama if currently empty
    const currentShift = activeCamera.shift;
    const petugasIdx = petugasState.findIndex((p) => p.shift === currentShift);
    if (petugasIdx !== -1 && !petugasState[petugasIdx].namaPetugas) {
      const updatedPetugas = [...petugasState];
      updatedPetugas[petugasIdx] = {
        ...updatedPetugas[petugasIdx],
        namaPetugas: user.name,
        jam: formattedTime,
        paraf: user.nip,
      };
      setPetugasState(updatedPetugas);
      submitPetugasUpdate(updatedPetugas, checklist.date);
    }
  };

  // Save Petugas Table
  const handleSavePetugas = async () => {
    setIsPetugasSaving(true);
    const updated = await submitPetugasUpdate(petugasState, checklist.date);
    onChecklistUpdated(updated);
    setIsPetugasSaving(false);
    setPetugasSavedMsg(true);
    setTimeout(() => setPetugasSavedMsg(false), 3000);
  };

  const handleQuickSignShift = (shiftName: ShiftType) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const updated = petugasState.map((p) => {
      if (p.shift === shiftName) {
        return {
          ...p,
          namaPetugas: user.name,
          jam: timeStr,
          paraf: user.nip,
        };
      }
      return p;
    });
    setPetugasState(updated);
  };

  // Save Temuan
  const handleAddTemuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemuan.temuan.trim()) return;

    setIsTemuanSaving(true);
    const item: TemuanPerbaikan = {
      id: 'tmn_' + Date.now(),
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      temuan: newTemuan.temuan.trim(),
      tindakan: newTemuan.tindakan.trim() || 'Dalam penanganan',
      pic: newTemuan.pic.trim() || user.name,
      status: newTemuan.status,
    };

    const updated = await submitTemuan(item, checklist.date);
    onChecklistUpdated(updated);
    setIsTemuanSaving(false);
    setShowAddTemuan(false);
    setNewTemuan({
      temuan: '',
      tindakan: '',
      pic: user.name,
      status: 'Open',
    });
  };

  const handleDeleteTemuan = async (id: string) => {
    const updated = await deleteTemuanItem(id, checklist.date);
    onChecklistUpdated(updated);
  };

  const handleKeteranganChange = (itemId: number, text: string) => {
    const updatedItems = checklist.items.map((it) =>
      it.id === itemId ? { ...it, keterangan: text } : it
    );
    onChecklistUpdated({ ...checklist, items: updatedItems });
  };

  const handleKeteranganBlur = async (itemId: number, text: string) => {
    const it = checklist.items.find((i) => i.id === itemId);
    if (!it) return;
    const defaultShift = it.pagi?.completed
      ? 'Pagi'
      : it.siang?.completed
      ? 'Siang'
      : it.sore?.completed
      ? 'Sore'
      : it.malam?.completed
      ? 'Malam'
      : 'Pagi';
    const existingRecord: ShiftRecord = it.pagi || it.siang || it.sore || it.malam || {
      completed: false,
      photoUrl: '',
      timestamp: new Date().toISOString(),
      formattedTime: '',
      petugasName: user.name,
      petugasNip: user.nip,
      gps: null,
      keterangan: text,
    };
    await submitChecklistItem(itemId, defaultShift, existingRecord, text, checklist.date);
  };

  // Calculate stats
  let totalDone = 0;
  checklist.items.forEach((it) => {
    if (it.pagi?.completed) totalDone++;
    if (it.siang?.completed) totalDone++;
    if (it.sore?.completed) totalDone++;
    if (it.malam?.completed) totalDone++;
  });
  const totalSlots = checklist.items.length * 4;
  const progressPercent = Math.round((totalDone / totalSlots) * 100);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Progress & Instruction Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#83baa3] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f4372]">
                Checklist Harian Petugas OB
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">
              Informa Alam Sutera
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ambil foto langsung dari kamera HP dan validasi GPS otomatis untuk setiap giliran shift.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-[#0f4372] text-white flex flex-col items-center justify-center font-bold">
              <span className="text-sm leading-none">{totalDone}</span>
              <span className="text-[9px] text-blue-200 font-normal">/ {totalSlots}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Progress Hari Ini</span>
                <span className="text-[#0f4372]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0f4372] via-[#83baa3] to-[#f6b742] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Matching PDF Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="bg-[#0f4372] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#f6b742]" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
              12 Point Pemeriksaan Kebersihan
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-200">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#83baa3]" /> Kamera Aktif
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f6b742]" /> GPS Terkunci
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-bold border-b border-slate-200">
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
              {checklist.items.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* No */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-slate-700 leading-6 text-[11px]">
                        {item.id}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.item}
                    </td>

                    {/* Standar */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md text-[11px] block">
                        {item.standar}
                      </span>
                    </td>

                    {/* Pagi Shift */}
                    <td className="py-2.5 px-2 text-center bg-blue-50/20">
                      {renderShiftCell(item, 'Pagi', item.pagi)}
                    </td>

                    {/* Siang Shift */}
                    <td className="py-2.5 px-2 text-center bg-amber-50/20">
                      {renderShiftCell(item, 'Siang', item.siang)}
                    </td>

                    {/* Sore Shift */}
                    <td className="py-2.5 px-2 text-center bg-orange-50/20">
                      {renderShiftCell(item, 'Sore', item.sore)}
                    </td>

                    {/* Malam Shift */}
                    <td className="py-2.5 px-2 text-center bg-slate-50/30">
                      {renderShiftCell(item, 'Malam', item.malam)}
                    </td>

                    {/* Keterangan */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={(e) => handleKeteranganChange(item.id, e.target.value)}
                        onBlur={(e) => handleKeteranganBlur(item.id, e.target.value)}
                        placeholder="Ketik keterangan..."
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0f4372] focus:ring-1 focus:ring-[#0f4372]/30 outline-none bg-white transition text-slate-800 placeholder:text-slate-400"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Pengisian Petugas (Matches PDF) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0f4372] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#f6b742]" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Pengisian Petugas (Sesuai PDF)
            </h3>
          </div>
          {petugasSavedMsg && (
            <span className="text-xs bg-[#83baa3] text-slate-900 font-bold px-2 py-0.5 rounded animate-fade-in">
              ✓ Tersimpan
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-3">
            Isi identitas petugas yang bertanggung jawab pada tiap shift. Anda dapat menekan tombol <strong>Tanda Tangan NIP</strong> untuk pengisian cepat.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4 w-28">Shift</th>
                  <th className="py-2.5 px-4">Nama Petugas</th>
                  <th className="py-2.5 px-4 w-36">Jam</th>
                  <th className="py-2.5 px-4 w-44">Paraf / NIP</th>
                  <th className="py-2.5 px-3 w-28 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {petugasState.map((petugas, index) => (
                  <tr key={petugas.shift} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-[#0f4372]">
                      Shift {petugas.shift}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={petugas.namaPetugas}
                        onChange={(e) => {
                          const updated = [...petugasState];
                          updated[index].namaPetugas = e.target.value;
                          setPetugasState(updated);
                        }}
                        placeholder="Nama Petugas..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={petugas.jam}
                        onChange={(e) => {
                          const updated = [...petugasState];
                          updated[index].jam = e.target.value;
                          setPetugasState(updated);
                        }}
                        placeholder="Contoh: 08:30 WIB"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={petugas.paraf}
                        onChange={(e) => {
                          const updated = [...petugasState];
                          updated[index].paraf = e.target.value;
                          setPetugasState(updated);
                        }}
                        placeholder="NIP: 123456"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickSignShift(petugas.shift)}
                        className="text-[11px] font-semibold text-[#0f4372] hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                        title="Isi otomatis dengan data login saya"
                      >
                        Paraf Saya
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSavePetugas}
              disabled={isPetugasSaving}
              className="bg-[#0f4372] hover:bg-[#0c365c] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Save className="w-3.5 h-3.5 text-[#f6b742]" />
              {isPetugasSaving ? 'Menyimpan...' : 'Simpan Data Petugas'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Temuan & Tindakan Perbaikan (Matches PDF) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0f4372] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f6b742]" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Temuan & Tindakan Perbaikan
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTemuan(!showAddTemuan)}
            className="text-xs bg-[#e55541] hover:bg-red-600 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Temuan
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-3">
            Catat temuan kerusakan, kekurangan perlengkapan, atau perbaikan yang diperlukan (Opsional jika ada temuan).
          </p>

          {/* New Temuan Form Toggle */}
          {showAddTemuan && (
            <form onSubmit={handleAddTemuan} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="font-bold text-xs text-[#0f4372]">Input Temuan Baru:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temuan</label>
                  <input
                    type="text"
                    required
                    value={newTemuan.temuan}
                    onChange={(e) => setNewTemuan({ ...newTemuan, temuan: e.target.value })}
                    placeholder="Contoh: Net pingpong kendor / Bola retak..."
                    className="w-full p-2 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tindakan</label>
                  <input
                    type="text"
                    value={newTemuan.tindakan}
                    onChange={(e) => setNewTemuan({ ...newTemuan, tindakan: e.target.value })}
                    placeholder="Contoh: Dikencangkan kembali / Diganti baru..."
                    className="w-full p-2 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC (Penanggung Jawab)</label>
                  <input
                    type="text"
                    value={newTemuan.pic}
                    onChange={(e) => setNewTemuan({ ...newTemuan, pic: e.target.value })}
                    placeholder="Nama PIC"
                    className="w-full p-2 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newTemuan.status}
                    onChange={(e) => setNewTemuan({ ...newTemuan, status: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:border-[#0f4372] outline-none bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Progress">Progress</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTemuan(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isTemuanSaving}
                  className="px-4 py-1.5 rounded-lg bg-[#e55541] text-white text-xs font-bold hover:bg-red-600 shadow"
                >
                  {isTemuanSaving ? 'Menyimpan...' : 'Simpan Temuan'}
                </button>
              </div>
            </form>
          )}

          {/* Temuan List Table */}
          {checklist.temuan.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
              Belum ada temuan atau tindakan perbaikan yang dicatat hari ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4 w-28">Tanggal</th>
                    <th className="py-2.5 px-4">Temuan</th>
                    <th className="py-2.5 px-4">Tindakan</th>
                    <th className="py-2.5 px-4 w-32">PIC</th>
                    <th className="py-2.5 px-4 w-28">Status</th>
                    <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {checklist.temuan.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{t.tanggal}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{t.temuan}</td>
                      <td className="py-2.5 px-4 text-slate-700">{t.tindakan}</td>
                      <td className="py-2.5 px-4 text-slate-600">{t.pic}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTemuan(t.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                          title="Hapus Temuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Render Helper for Shift Cell */}
      {/* Modals */}
      {activeCamera && (
        <CameraModal
          isOpen={true}
          onClose={() => setActiveCamera(null)}
          onSubmit={handleCameraSubmit}
          itemNumber={activeCamera.item.id}
          itemName={activeCamera.item.item}
          itemStandar={activeCamera.item.standar}
          shift={activeCamera.shift}
          petugasName={user.name}
          petugasNip={user.nip}
          initialKeterangan={activeCamera.item.keterangan}
        />
      )}

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

  function renderShiftCell(item: ChecklistItem, shiftName: ShiftType, record: ShiftRecord | null) {
    if (record?.completed) {
      return (
        <button
          type="button"
          onClick={() => setActivePhotoDetail({ record, item, shift: shiftName })}
          className="group relative w-full flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 transition-all shadow-xs"
          title="Klik untuk melihat bukti foto & GPS"
        >
          {/* Mini photo thumbnail */}
          <div className="relative w-12 h-9 rounded-md overflow-hidden bg-slate-900 mb-1 border border-emerald-400">
            <img
              src={record.photoUrl}
              alt="Foto Selesai"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-0.5 right-0.5 bg-emerald-600 text-white rounded-full p-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 line-clamp-1">
            {record.formattedTime || 'Selesai'}
          </span>
          <span className="text-[9px] text-emerald-600 font-mono">
            {record.gps ? '📍 GPS OK' : 'Selesai'}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleOpenCapture(item, shiftName)}
        className="w-full py-2 px-1.5 rounded-xl bg-white hover:bg-[#0f4372] text-[#0f4372] hover:text-white border border-[#0f4372]/30 hover:border-[#0f4372] font-semibold text-[11px] flex flex-col items-center justify-center gap-0.5 transition-all shadow-xs active:scale-95 group"
      >
        <Camera className="w-4 h-4 text-[#e55541] group-hover:text-[#f6b742] transition-colors" />
        <span className="tracking-tight text-[10px] font-bold">+ Kamera</span>
      </button>
    );
  }
};
