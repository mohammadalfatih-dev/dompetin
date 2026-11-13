import React, { useState } from 'react';
import { AppSettings, Category } from '../../types/finance';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
} from '../../database/db';
import {
  Sun,
  Moon,
  Laptop,
  Coins,
  Calendar,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  Edit2,
  Shield,
  Info,
  Check,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { CategoryIcon } from '../../components/CategoryIcon';

interface SettingsViewProps {
  settings?: AppSettings;
  categories: Category[];
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  onAddCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<any>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<any>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  onUpdateSettings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onClearAllData,
}) => {
  // Category management states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catColor, setCatColor] = useState('#731331');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catError, setCatError] = useState('');

  // Backup / Restore states
  const [backupMessage, setBackupMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Cloud sync settings
  const [supabaseUrl, setSupabaseUrl] = useState(settings?.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings?.supabaseAnonKey || '');
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(settings?.cloudSyncEnabled || false);
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [syncSavedMessage, setSyncSavedMessage] = useState('');

  const colors = [
    '#731331', '#EA580C', '#0284C7', '#16A34A', '#8B5CF6', '#F59E0B', '#EC4899', '#64748B', '#0066AE', '#003876'
  ];

  const icons = [
    'Utensils', 'Car', 'ShoppingBag', 'Receipt', 'Gamepad2', 'HeartPulse',
    'GraduationCap', 'MoreHorizontal', 'Briefcase', 'Laptop', 'Store',
    'TrendingUp', 'Gift', 'PlusCircle', 'Coffee', 'Film', 'Plane', 'Home'
  ];

  const handleExport = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dompetin_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupMessage('File backup berhasil diekspor.');
      setTimeout(() => setBackupMessage(''), 4000);
    } catch (err: any) {
      setBackupMessage('Gagal mengekspor data backup: ' + err.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          await importDatabaseBackup(content);
          setBackupMessage('Data backup berhasil dipulihkan!');
          setTimeout(() => setBackupMessage(''), 4000);
        } catch (err: any) {
          setBackupMessage('Format file tidak valid atau rusak: ' + err.message);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setBackupMessage('Gagal membaca file: ' + err.message);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType('expense');
    setCatColor('#731331');
    setCatIcon('Tag');
    setCatError('');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    if (!catName.trim()) {
      setCatError('Nama kategori wajib diisi.');
      return;
    }

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: catName.trim(),
          type: catType,
          color: catColor,
          icon: catIcon,
        });
      } else {
        await onAddCategory({
          name: catName.trim(),
          type: catType,
          color: catColor,
          icon: catIcon,
        });
      }
      setIsCatModalOpen(false);
    } catch (err: any) {
      setCatError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  const copyDeviceId = () => {
    if (settings?.deviceId) {
      navigator.clipboard.writeText(settings.deviceId);
      setCopiedDeviceId(true);
      setTimeout(() => setCopiedDeviceId(false), 2000);
    }
  };

  const handleSaveCloudSync = async () => {
    await onUpdateSettings({
      cloudSyncEnabled,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    setSyncSavedMessage('Pengaturan sinkronisasi cloud berhasil disimpan.');
    setTimeout(() => setSyncSavedMessage(''), 3000);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Aplikasi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sesuaikan tema visual, kelola kategori, dan cadangkan data lokal Anda
        </p>
      </div>

      {backupMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-xs flex items-center justify-between">
          <span>{backupMessage}</span>
          <button onClick={() => setBackupMessage('')} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Appearance & Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#731331]" />
          <span>Tema & Tampilan</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pilih tema Light Mode atau Dark Mode sesuai kenyamanan mata Anda
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
          {[
            { id: 'light', label: 'Terang (Light)', icon: Sun },
            { id: 'dark', label: 'Gelap (Dark)', icon: Moon },
            { id: 'system', label: 'Sistem Otomatis', icon: Laptop },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = settings?.theme === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onUpdateSettings({ theme: mode.id as any })}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-[#731331] bg-rose-50/40 dark:bg-rose-950/30 text-[#731331] dark:text-rose-300 ring-2 ring-[#731331]/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Currency & Format Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#EA580C]" />
          <span>Preferensi Mata Uang & Format Tanggal</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mata Uang Utama
            </label>
            <select
              value={settings?.currency || 'IDR'}
              onChange={(e) => onUpdateSettings({ currency: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#731331]"
            >
              <option value="IDR">Indonesian Rupiah (Rp) — Format Rp1.500.000</option>
              <option value="USD">US Dollar ($) — Format $1,500.00</option>
              <option value="EUR">Euro (€) — Format €1.500,00</option>
              <option value="SGD">Singapore Dollar (S$) — Format S$1,500.00</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Format Penulisan Tanggal
            </label>
            <select
              value={settings?.dateFormat || 'DD/MM/YYYY'}
              onChange={(e) => onUpdateSettings({ dateFormat: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#731331]"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Standar Indonesia)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Standar ISO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Category Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manajemen Kategori
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuaikan kategori pengeluaran dan pemasukan sesuai gaya hidup Anda
            </p>
          </div>

          <button
            onClick={openAddCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategori Baru</span>
          </button>
        </div>

        {/* Categories list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className="p-2 rounded-xl text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-4 h-4 text-white" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {cat.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditCategory(cat)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Hapus"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Local-First Database & Backup / Restore */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Cadangan Data & Pemulihan (Backup & Restore)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Data Dompetin tersimpan 100% lokal di browser Anda via IndexedDB. Ekspor cadangan file
            JSON untuk dipindahkan ke perangkat lain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export button */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ekspor File Cadangan JSON
            </h3>
            <p className="text-[11px] text-slate-400">
              Unduh seluruh histori transaksi, dompet, anggaran, dan tabungan dalam file aman.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#731331]" />
              <span>Unduh Cadangan (.json)</span>
            </button>
          </div>

          {/* Import file */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pulihkan Data dari File Cadangan
            </h3>
            <p className="text-[11px] text-slate-400">
              Pilih file cadangan JSON Dompetin untuk memulihkan seluruh data sebelumnya.
            </p>
            <label className="w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Pilih File Backup (.json)</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Clear data action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Kosongkan Semua Data</span>
          </button>
        </div>
      </div>

      {/* 5. Cloud Database Synchronization (Supabase PostgreSQL) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>Sinkronisasi Cloud (Supabase PostgreSQL)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Arsitektur hybrid: Transaksi disimpan secara lokal di browser terlebih dahulu
            (local-first), kemudian otomatis disinkronkan ke Supabase jika terhubung.
          </p>
        </div>

        {syncSavedMessage && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl">
            {syncSavedMessage}
          </div>
        )}

        <div className="space-y-3 pt-2 text-xs">
          {/* Device ID */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Identitas Perangkat Unik (Device ID)
              </span>
              <button
                onClick={copyDeviceId}
                className="text-[11px] font-semibold text-[#731331] dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                {copiedDeviceId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDeviceId ? 'Tersalin' : 'Salin ID'}</span>
              </button>
            </div>
            <div className="font-mono text-slate-500 text-[11px] break-all">
              {settings?.deviceId || 'Belum dibuat'}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cloudSyncEnable"
              checked={cloudSyncEnabled}
              onChange={(e) => setCloudSyncEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#731331] focus:ring-[#731331]"
            />
            <label
              htmlFor="cloudSyncEnable"
              className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Aktifkan Sinkronisasi Cloud Otomatis
            </label>
          </div>

          {cloudSyncEnabled && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#731331]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#731331] font-mono text-[11px]"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCloudSync}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
              >
                Simpan Konfigurasi Cloud
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Application Info */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/Rupiah_Finance_Calculator_Badge_426ea12d.png"
            alt="Dompetin Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Dompetin — Platform Finansial Personal
            </div>
            <div className="text-[11px] text-slate-400">
              Versi 1.0.0 · Terinspirasi oleh Moni.id · Local-First Privacy
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal (Add / Edit) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {catError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                  {catError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Kopi & Nongkrong, Langganan Streaming..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipe Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatType('expense')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      catType === 'expense'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('income')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      catType === 'income'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Label
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        catColor === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Ikon
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                  {icons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setCatIcon(ic)}
                      className={`p-2 rounded-xl border ${
                        catIcon === ic
                          ? 'border-[#731331] bg-rose-50 text-[#731331]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
                >
                  {editingCategory ? 'Simpan Kategori' : 'Buat Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kosongkan Seluruh Data?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Seluruh dompet, transaksi, anggaran, dan impian tabungan akan dihapus
              permanen dari browser ini, sedangkan kategori bawaan tetap tersedia.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onClearAllData();
                  setShowClearConfirm(false);
                  setBackupMessage('Seluruh data berhasil dikosongkan.');
                  setTimeout(() => setBackupMessage(''), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Kosongkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
