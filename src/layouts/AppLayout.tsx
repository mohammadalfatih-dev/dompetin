import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet as WalletIcon,
  PieChart,
  Target,
  BarChart3,
  Settings,
  Plus,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  CheckCircle,
} from 'lucide-react';
import { SyncStatus, cloudSync } from '../services/cloudSync';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  totalBalance: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
  isDarkMode,
  onToggleTheme,
  children,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloudSync.getStatus());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const unsub = cloudSync.subscribe((status) => {
      setSyncStatus(status);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
    { id: 'wallets', label: 'Dompet', icon: WalletIcon },
    { id: 'budgets', label: 'Anggaran', icon: PieChart },
    { id: 'savings', label: 'Tabungan', icon: Target },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Desktop & Tablet Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark with Official Uploaded Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
          >
            <img
              src="/assets/aistudio/Rupiah_Finance_Calculator_Badge_426ea12d.png"
              alt="Dompetin Logo"
              className="w-9 h-9 object-contain drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#731331] dark:text-rose-400">
                Dompetin
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-[#731331] dark:text-rose-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Sync Indicator, Theme Toggle, & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sync status chip */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title={
                !isOnline
                  ? 'Offline: Data aman di IndexedDB lokal'
                  : syncStatus === 'synced'
                  ? 'Tersinkronisasi dengan Cloud Supabase'
                  : syncStatus === 'syncing'
                  ? 'Sedang menyinkronkan data...'
                  : 'Mode Lokal Terlindungi (IndexedDB)'
              }
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px]">Lokal Offline</span>
                </>
              ) : syncStatus === 'synced' ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px]">Cloud Sinkron</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <Cloud className="w-3 h-3 text-sky-500 animate-spin" />
                  <span className="text-[10px]">Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px]">Lokal IndexedDB</span>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddTransaction}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-lg"
      >
        {showMoreMenu && (
          <div className="absolute bottom-full right-3 mb-2 w-52 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
            {[
              { id: 'budgets', label: 'Anggaran', icon: PieChart },
              { id: 'savings', label: 'Tabungan', icon: Target },
              { id: 'reports', label: 'Laporan', icon: BarChart3 },
              { id: 'settings', label: 'Pengaturan', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setShowMoreMenu(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    currentTab === item.id
                      ? 'bg-rose-50 text-[#731331] dark:bg-rose-950/40 dark:text-rose-300'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* 1. Dashboard */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors ${
              currentTab === 'dashboard'
                ? 'text-[#731331] dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ringkasan</span>
          </button>

          {/* 2. Transactions */}
          <button
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors ${
              currentTab === 'transactions'
                ? 'text-[#731331] dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Transaksi</span>
          </button>

          {/* 3. Prominent Add Transaction Button (+) */}
          <div className="flex items-center justify-center">
            <button
              onClick={onOpenAddTransaction}
              className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-[#731331] to-[#EA580C] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              aria-label="Catat Transaksi Baru"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* 4. Wallets */}
          <button
            onClick={() => onSelectTab('wallets')}
            className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors ${
              currentTab === 'wallets'
                ? 'text-[#731331] dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <WalletIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dompet</span>
          </button>

          {/* 5. More menu: budgets, savings, reports, and settings */}
          <button
            onClick={() => setShowMoreMenu((open) => !open)}
            aria-expanded={showMoreMenu}
            aria-label="Buka menu lainnya"
            className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors ${
              showMoreMenu || ['budgets', 'savings', 'reports', 'settings'].includes(currentTab)
                ? 'text-[#731331] dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Lainnya</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
