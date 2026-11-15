import React, { useState } from 'react';
import { AppSettings, Category } from '../../types/finance';
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
  authEmail: string | null;
  authProvider: string | null;
  profileName: string;

  onLogout: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  onUpdateSettings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onClearAllData,
  authEmail,
  authProvider,
  profileName,
  onLogout,
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  // Cloud sync settings

  const colors = [
    '#731331', '#EA580C', '#0284C7', '#16A34A', '#8B5CF6', '#F59E0B', '#EC4899', '#64748B', '#0066AE', '#003876'
  ];

  const icons = [
    'Utensils', 'Car', 'ShoppingBag', 'Receipt', 'Gamepad2', 'HeartPulse',
    'GraduationCap', 'MoreHorizontal', 'Briefcase', 'Laptop', 'Store',
    'TrendingUp', 'Gift', 'PlusCircle', 'Coffee', 'Film', 'Plane', 'Home'
  ];

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

      {/* 4. Account details */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#731331]" />
          <span>Akun Dompetin</span>
        </h2>
        <div className="grid gap-2 text-sm">
          <div><span className="text-slate-500">Nama pengguna: </span><strong className="text-slate-900 dark:text-white">{profileName || '—'}</strong></div>
          <div><span className="text-slate-500">Email: </span><strong className="text-slate-900 dark:text-white">{authEmail || '—'}</strong></div>
          <div><span className="text-slate-500">Metode login: </span><strong className="text-slate-900 dark:text-white capitalize">{authProvider || '—'}</strong></div>
        </div>
        <button type="button" disabled={logoutBusy} onClick={async () => { setLogoutError(''); setLogoutBusy(true); try { await onLogout(); } catch (error: any) { setLogoutError(error?.message || 'Gagal keluar dari akun.'); setLogoutBusy(false); } }} className="rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30">{logoutBusy ? 'Keluar...' : 'Logout'}</button>
        {logoutError && <div className="text-xs text-rose-600">{logoutError}</div>}
      </div>

      {/* 5. Supabase Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Pengelolaan Data</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Data Dompetin disimpan di akun Supabase Anda.</p>
        </div>
        <div className="flex justify-end">
          <button onClick={() => setShowClearConfirm(true)} className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" /><span>Kosongkan Semua Data</span>
          </button>
        </div>
      </div>

      {/* 6. Cloud Database (Supabase) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-sky-600" />
          <span>Database Cloud Supabase</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Data Dompetin disimpan langsung di Supabase. Koneksi diatur melalui Environment Variables project, bukan dari halaman pengaturan ini.
        </p>
      </div>

      {/* 7. Application Info */}
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
              Versi 1.0.0 · Database Supabase
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
              Seluruh dompet, transaksi, kategori, anggaran, dan impian tabungan akan dihapus permanen dari akun Supabase Anda.
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
