/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Clock,
  LogOut,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { AuthUser, DayChecklist } from './types/checklist';
import {
  fetchTodayChecklist,
  getStoredUser,
  logoutUser,
  fetchHistoryList
} from './services/checklistApi';
import { getTodayDateString } from './data/defaultChecklist';
import { LoginView } from './components/LoginView';
import { UserChecklistView } from './components/UserChecklistView';
import { ManagerDashboardView } from './components/ManagerDashboardView';
import { PrintReportView } from './components/PrintReportView';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checklist, setChecklist] = useState<DayChecklist | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([getTodayDateString()]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'checklist' | 'dashboard'>('checklist');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check stored user on launch
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      if (stored.role === 'manager') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('checklist');
      }
    }
  }, []);

  // Realtime clock (updates every second) & auto midnight-reset detection
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate time until next midnight (00:00)
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(`${diffHours}j ${diffMinutes}m ${diffSeconds}s`);

      // Check if day changed while app is open
      const todayStr = getTodayDateString(now);
      if (checklist && checklist.date !== todayStr) {
        console.log('Hari berganti, mereset checklist untuk tanggal baru:', todayStr);
        loadChecklist();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [checklist]);

  // Load checklist data
  const loadChecklist = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchTodayChecklist();
      setChecklist(data);

      const history = await fetchHistoryList();
      const dates = Array.from(new Set([getTodayDateString(), ...history.map((h) => h.date)]));
      setAvailableDates(dates);
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadChecklist();
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'manager') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('checklist');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  // If not authenticated, render Login View
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Format date and time for header
  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedClock = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#0f4372] selection:text-white">
      
      {/* Informa Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0f4372] via-[#83baa3] via-[#f6b742] to-[#e55541] no-print" />

      {/* Main App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Logo and Big Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0f4372] text-white flex items-center justify-center shadow-md border-2 border-[#f6b742]">
                <Building2 className="w-6 h-6 text-[#f6b742]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0f4372] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    INFORMA ALAM SUTERA
                  </span>
                </div>
                {/* Judul Besar Sesuai Request */}
                <h1 className="text-lg sm:text-xl font-extrabold text-[#0f4372] tracking-tight leading-tight">
                  Cheklist Kebersihan Informa Alam Sutera
                </h1>
              </div>
            </div>

            {/* Realtime Clock & User Profile */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Realtime Date & Time Indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
                <Clock className="w-4 h-4 text-[#0f4372] animate-pulse" />
                <div className="text-left">
                  <div className="text-[11px] font-bold text-slate-800 leading-none">
                    {formattedClock}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {formattedDate}
                  </div>
                </div>
              </div>

              {/* User Profile Badge */}
              <div className="flex items-center gap-2 bg-slate-100/90 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-lg bg-[#0f4372] text-white flex items-center justify-center font-bold text-xs">
                  {user.role === 'manager' ? (
                    <ShieldCheck className="w-4 h-4 text-[#f6b742]" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-[#83baa3]" />
                  )}
                </div>
                <div className="text-left pr-1">
                  <div className="font-bold text-slate-900 text-xs line-clamp-1 max-w-[130px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {user.role === 'manager' ? 'Manager' : 'User OB'} • NIP: {user.nip}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#e55541] hover:bg-white transition-colors"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Manager / User Navigation Bar */}
        {user.role === 'manager' && (
          <div className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#0f4372] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#f6b742]" />
                  Dashboard Monitoring Manager
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('checklist')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'checklist'
                      ? 'bg-[#0f4372] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#83baa3]" />
                  Tampilan Checklist Petugas OB
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <button
                  type="button"
                  onClick={loadChecklist}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 hover:text-[#0f4372] p-1 rounded transition"
                  title="Segarkan data sekarang"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0f4372]' : ''}`} />
                  <span className="hidden sm:inline">Segarkan Data</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-print">
        {checklist ? (
          activeTab === 'dashboard' && user.role === 'manager' ? (
            <ManagerDashboardView
              user={user}
              checklist={checklist}
              onChecklistUpdated={setChecklist}
              availableDates={availableDates}
            />
          ) : (
            <UserChecklistView
              user={user}
              checklist={checklist}
              onChecklistUpdated={setChecklist}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <RefreshCw className="w-8 h-8 text-[#0f4372] animate-spin mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Memuat Checklist Kebersihan...</h3>
            <p className="text-xs text-slate-500 mt-1">Mengambil data Informa Alam Sutera</p>
          </div>
        )}
      </main>

      {/* Print-Only Layout matching PDF */}
      {checklist && <PrintReportView checklist={checklist} />}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#e55541]" />
            Cheklist Kebersihan Informa Alam Sutera
          </div>
          <div className="text-[11px] text-slate-400">
            Kamera Realtime & Validasi GPS Otomatis • Reset Harian 00:00 WIB
          </div>
        </div>
      </footer>

    </div>
  );
}
