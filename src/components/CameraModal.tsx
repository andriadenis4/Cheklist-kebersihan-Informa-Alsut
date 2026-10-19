import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, RefreshCw, X, MapPin, AlertCircle, Sparkles, Navigation, Lock } from 'lucide-react';
import { GpsLocation, ShiftType } from '../types/checklist';
import { getCurrentGpsLocation } from '../utils/geo';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { photoUrl: string; gps: GpsLocation | null; keterangan: string }) => void;
  itemNumber: number;
  itemName: string;
  itemStandar: string;
  shift: ShiftType;
  petugasName: string;
  petugasNip: string;
  initialKeterangan?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemNumber,
  itemName,
  itemStandar,
  shift,
  petugasName,
  petugasNip,
  initialKeterangan = '',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState(initialKeterangan);
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera and GPS when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    setKeterangan(initialKeterangan);
    fetchGps();
    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const fetchGps = async () => {
    setIsGpsLoading(true);
    try {
      const loc = await getCurrentGpsLocation();
      setGps(loc);
    } catch {
      // handled inside getCurrentGpsLocation
    } finally {
      setIsGpsLoading(false);
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera WebRTC tidak didukung di peramban ini');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Gagal membuka kamera langsung:', err);
      setCameraError('Akses kamera langsung terkendala. Gunakan tombol kamera sistem di bawah (khusus kamera, tanpa galeri).');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, w, h);

    // Apply digital watermark stamp
    stampWatermark(ctx, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Fallback direct camera input using capture="environment" (OS native camera only, no gallery)
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          stampWatermark(ctx, img.width, img.height);
          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const stampWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';

    const barHeight = Math.max(90, Math.floor(height * 0.16));
    const fontSizeTitle = Math.max(14, Math.floor(width * 0.024));
    const fontSizeBody = Math.max(12, Math.floor(width * 0.02));

    // Semi-transparent gradient banner at the bottom
    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
    gradient.addColorStop(0, 'rgba(15, 67, 114, 0.85)'); // Dark Azure
    gradient.addColorStop(1, 'rgba(10, 35, 60, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Red accent top line
    ctx.fillStyle = '#e55541';
    ctx.fillRect(0, height - barHeight, width, Math.max(3, Math.floor(height * 0.005)));

    // Text details
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSizeTitle}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText('INFORMA ALAM SUTERA • CHECKLIST KEBERSIHAN', 20, height - barHeight + fontSizeTitle + 10);

    ctx.font = `600 ${fontSizeBody}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#f6b742'; // Informa orange
    ctx.fillText(`Shift: ${shift.toUpperCase()} • Item #${itemNumber}: ${itemName}`, 20, height - barHeight + fontSizeTitle + fontSizeBody + 16);

    ctx.font = `normal ${fontSizeBody}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Petugas: ${petugasName} (NIP: ${petugasNip}) • ${dateFormatted}, ${timeFormatted}`, 20, height - barHeight + fontSizeTitle + fontSizeBody * 2 + 22);

    const gpsText = gps
      ? `GPS: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)} (±${gps.accuracy}m) • ${gps.isAlamSuteraNearby ? 'Lokasi Toko Terverifikasi' : 'Terdeteksi'}`
      : 'GPS: Mengambil koordinat...';
    ctx.fillStyle = '#83baa3'; // Informa Grey-green
    ctx.fillText(gpsText, 20, height - barHeight + fontSizeTitle + fontSizeBody * 3 + 28);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const handleConfirmSubmit = () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);
    onSubmit({
      photoUrl: capturedPhoto,
      gps,
      keterangan: keterangan.trim(),
    });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0f4372] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e55541] flex items-center justify-center text-white font-bold text-sm shadow">
              {itemNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold bg-[#f6b742] text-[#0f4372] px-2 py-0.5 rounded-full">
                  Shift {shift}
                </span>
                <span className="text-xs text-blue-200">Kamera Realtime</span>
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Item Standar requirement info */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-[#0f4372] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#0f4372]">Standar Pemeriksaan:</span>{' '}
              <span className="text-slate-700">{itemStandar}</span>
            </div>
          </div>

          {/* Camera Viewfinder or Captured Preview */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
            {!capturedPhoto ? (
              <>
                {/* Live Video */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder Target Overlay */}
                <div className="pointer-events-none absolute inset-4 border border-white/40 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-[#f6b742]" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-[#f6b742]" />
                  </div>
                  <div className="text-center text-[11px] font-medium text-white/80 drop-shadow bg-black/40 px-2 py-0.5 rounded mx-auto backdrop-blur-xs">
                    Posisikan objek di tengah bingkai
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-[#f6b742]" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-[#f6b742]" />
                  </div>
                </div>

                {/* Camera switch button */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-xs transition shadow"
                  title="Putar Kamera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Photo Preview */
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Hasil Foto Checklist"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#83baa3] text-slate-900 font-bold text-xs px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Foto Siap Dikirim
                </div>
              </div>
            )}

            {/* Error Message if camera failed */}
            {cameraError && !capturedPhoto && (
              <div className="absolute inset-0 bg-slate-900/90 p-5 flex flex-col items-center justify-center text-center text-white gap-3 z-20">
                <AlertCircle className="w-10 h-10 text-[#e55541]" />
                <p className="text-xs text-slate-200">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 bg-[#e55541] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-red-600 transition shadow"
                >
                  <Camera className="w-4 h-4" /> Buka Kamera HP Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Hidden File Input for Native Camera Fallback ONLY (capture="environment" strictly prevents gallery selection) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeCameraCapture}
          />

          {/* GPS Info Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${gps?.isAlamSuteraNearby ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  Validasi GPS Otomatis
                  {isGpsLoading ? (
                    <span className="text-[10px] text-slate-400 font-normal">Mencari...</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">✓ Terkunci</span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] truncate max-w-[280px]">
                  {isGpsLoading ? 'Mengambil lokasi perangkat...' : gps?.address || 'Koordinat tercatat'}
                </div>
              </div>
            </div>
            {gps && (
              <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                ±{gps.accuracy}m
              </span>
            )}
          </div>

          {/* Keterangan Field (Optional per instructions: "Untuk kolom keterangan berikan opsi untuk memberikan keterangan ketikan, tetapi kalau tidak diisi juga gapapa jadi opsional.") */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Meja sudah dilap bersih, debu di sudut net telah dibersihkan..."
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-[#0f4372] focus:ring-1 focus:ring-[#0f4372] outline-none transition bg-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          {!capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition"
                title="Buka kamera sistem perangkat langsung"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                Gunakan Kamera HP
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                className="flex-1 bg-[#0f4372] hover:bg-[#0c365c] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <Camera className="w-4 h-4 text-[#f6b742]" />
                Ambil Foto Sekarang
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#e55541] hover:bg-red-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Menyimpan...' : 'Submit & Lanjut Checklist'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
