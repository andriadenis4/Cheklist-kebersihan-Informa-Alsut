import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AuthUser } from '../types/checklist';
import { loginUser } from '../services/checklistApi';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = useState<'manager' | 'user'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleTabChange = (role: 'manager' | 'user') => {
    setRoleTab(role);
    setErrorMsg(null);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await loginUser(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali NIP dan Password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,67,114,0.45),rgba(255,255,255,0))] flex flex-col justify-center items-center p-3 sm:p-6 text-slate-800">
      
      {/* Decorative Informa Color Strip at Top */}
      <div className="fixed top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0f4372] via-[#83baa3] via-[#f6b742] to-[#e55541] z-50" />

      {/* Main Split Showcase Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 my-auto">
        
        {/* Left Side: Brand Showcase & Operational Highlights */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#0f4372] via-[#0b3357] to-[#072138] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f6b742]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e55541]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          {/* Top Brand Mark */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center border-2 border-[#f6b742] shrink-0">
                <Building2 className="w-7 h-7 text-[#0f4372]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[#f6b742] uppercase block">
                  INFORMA FURNISHINGS
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  Toko Informa Alam Sutera
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Cheklist Kebersihan
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-2 font-normal leading-relaxed">
              Sistem operasional harian terintegrasi untuk verifikasi kebersihan toko, dokumentasi kamera langsung, dan pemantauan manajemen.
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#f6b742]/20 flex items-center justify-center text-[#f6b742] shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Kamera Realtime Lapangan</div>
                  <div className="text-[11px] text-blue-200">Pengambilan foto langsung dari kamera HP tanpa opsi galeri untuk validasi asli.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#83baa3]/20 flex items-center justify-center text-[#83baa3] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Verifikasi GPS Otomatis</div>
                  <div className="text-[11px] text-blue-200">Validasi otomatis koordinat posisi di area Informa Alam Sutera.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#e55541]/20 flex items-center justify-center text-[#e55541] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Monitoring Shift Terpadu</div>
                  <div className="text-[11px] text-blue-200">Shift Pagi, Siang, Sore, Malam termonitor langsung oleh Duty Manager.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Store Status Pill */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Operasional Aktif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0f4372] border border-white/30" />
              <span className="w-2 h-2 rounded-full bg-[#e55541]" />
              <span className="w-2 h-2 rounded-full bg-[#83baa3]" />
              <span className="w-2 h-2 rounded-full bg-[#f6b742]" />
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Login Card */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
          
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan pilih peran dan masukkan kredensial Anda untuk masuk.
              </p>
            </div>

            {/* Role Switcher Pills */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleRoleTabChange('user')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  roleTab === 'user'
                    ? 'bg-white text-[#0f4372] shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${roleTab === 'user' ? 'text-[#0f4372]' : 'text-slate-400'}`} />
                Petugas
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('manager')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  roleTab === 'manager'
                    ? 'bg-white text-[#0f4372] shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${roleTab === 'manager' ? 'text-[#e55541]' : 'text-slate-400'}`} />
                Manager
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#e55541] rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan NIP..."
                    className="w-full text-xs font-semibold pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#0f4372] focus:ring-2 focus:ring-[#0f4372]/20 outline-none transition bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password..."
                    className="w-full text-xs font-semibold pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:border-[#0f4372] focus:ring-2 focus:ring-[#0f4372]/20 outline-none transition bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0f4372] hover:bg-[#0c365c] text-white py-3.5 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition active:scale-98 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <span>Memverifikasi Akses...</span>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          </div>

          {/* Security & Store Footer Note */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#83baa3]" />
            <span>Sistem Otentikasi Internal • Informa Alam Sutera</span>
          </div>

        </div>

      </div>

    </div>
  );
};
