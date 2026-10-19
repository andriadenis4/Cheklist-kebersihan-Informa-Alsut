import React from 'react';
import { X, MapPin, ExternalLink, Calendar, Clock, User, ShieldCheck, FileText } from 'lucide-react';
import { ShiftRecord, ShiftType } from '../types/checklist';

interface PhotoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ShiftRecord | null;
  itemNumber: number;
  itemName: string;
  itemStandar: string;
  shift: ShiftType;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  itemNumber,
  itemName,
  itemStandar,
  shift,
}) => {
  if (!isOpen || !record) return null;

  const googleMapsUrl = record.gps
    ? `https://www.google.com/maps?q=${record.gps.latitude},${record.gps.longitude}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0f4372] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f6b742] text-[#0f4372] font-extrabold flex items-center justify-center text-sm shadow">
              {itemNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold bg-[#e55541] text-white px-2 py-0.5 rounded-full">
                  Shift {shift}
                </span>
                <span className="text-xs text-blue-200">Bukti Verifikasi Lapangan</span>
              </div>
              <h3 className="font-bold text-base leading-snug line-clamp-1">{itemName}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Photo with watermark */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md">
            <img
              src={record.photoUrl}
              alt={`Dokumentasi ${itemName}`}
              className="w-full max-h-[420px] object-contain mx-auto"
            />
          </div>

          {/* Inspection Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Petugas & Waktu */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#0f4372]">
                <User className="w-4 h-4 text-[#e55541]" />
                Petugas Pelaksana
              </div>
              <div className="pl-6 space-y-1 text-slate-700">
                <div className="font-bold text-slate-900">{record.petugasName || 'Petugas OB'}</div>
                <div className="text-slate-500 font-mono">NIP: {record.petugasNip || '-'}</div>
                <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{record.formattedTime || new Date(record.timestamp).toLocaleTimeString('id-ID')} WIB</span>
                </div>
              </div>
            </div>

            {/* GPS & Validasi */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#0f4372]">
                  <MapPin className="w-4 h-4 text-[#83baa3]" />
                  Lokasi GPS Realtime
                </div>
                {record.gps?.isAlamSuteraNearby && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Valid Toko
                  </span>
                )}
              </div>
              <div className="pl-6 space-y-1 text-slate-700">
                {record.gps ? (
                  <>
                    <div className="font-mono text-[11px] text-slate-800">
                      {record.gps.latitude.toFixed(6)}, {record.gps.longitude.toFixed(6)}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Akurasi: ±{record.gps.accuracy} meter
                    </div>
                    {record.gps.address && (
                      <div className="text-[11px] text-slate-600 pt-0.5 line-clamp-1">
                        {record.gps.address}
                      </div>
                    )}
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f4372] hover:underline pt-1"
                      >
                        Lihat di Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400 italic">Data GPS tidak terekam</div>
                )}
              </div>
            </div>

          </div>

          {/* Standar & Keterangan */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#0f4372]">
              <FileText className="w-4 h-4" />
              Keterangan & Standar
            </div>
            <div className="space-y-1.5 pl-6 text-slate-700">
              <div>
                <span className="font-medium text-slate-900">Standar Pemeriksaan:</span> {itemStandar}
              </div>
              <div>
                <span className="font-medium text-slate-900">Catatan Petugas:</span>{' '}
                {record.keterangan ? (
                  <span className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {record.keterangan}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Tidak ada catatan tambahan (opsional)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f4372] hover:bg-[#0c365c] text-white text-xs font-semibold rounded-xl shadow transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
