import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  AlertCircle,
  Wallet as WalletLucide,
  Plus,
} from 'lucide-react';
import { Transaction, TransactionType, Wallet, WalletType, Category } from '../../types/finance';
import { formatCurrency, parseAmount } from '../../utils/finance';
import { CategoryIcon } from '../../components/CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    type: TransactionType;
    categoryId?: string;
    fromWalletId: string;
    toWalletId?: string;
    date: string;
    time?: string;
    description: string;
    notes?: string;
  }) => Promise<any>;
  onAddWallet?: (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Wallet>;
  onNavigateToWallets?: () => void;
  initialTransaction?: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  walletBalances: Record<string, number>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddWallet,
  onNavigateToWallets,
  initialTransaction,
  wallets,
  categories,
  walletBalances,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick wallet creation state when no wallets exist
  const [quickWalletName, setQuickWalletName] = useState('');
  const [quickWalletType, setQuickWalletType] = useState<WalletType>('cash');
  const [quickWalletBalance, setQuickWalletBalance] = useState('0');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(initialTransaction.amount.toString());
        setCategoryId(initialTransaction.categoryId || '');
        setFromWalletId(initialTransaction.fromWalletId);
        setToWalletId(initialTransaction.toWalletId || '');
        setDate(initialTransaction.date);
        setTime(initialTransaction.time || '12:00');
        setDescription(initialTransaction.description);
        setNotes(initialTransaction.notes || '');
      } else {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        setType('expense');
        setAmountStr('');
        const firstExp = categories.find((c) => c.type === 'expense');
        setCategoryId(firstExp ? firstExp.id : '');
        setFromWalletId(wallets[0]?.id || '');
        setToWalletId(wallets[1]?.id || '');
        setDate(`${y}-${m}-${d}`);
        setTime(now.toTimeString().slice(0, 5));
        setDescription('');
        setNotes('');
      }
      setError('');
      setQuickWalletName('');
      setQuickWalletType('cash');
      setQuickWalletBalance('0');
    }
    // Only reset form when modal opens or editing target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTransaction]);

  useEffect(() => {
    if (!isOpen || initialTransaction) return;
    if (!fromWalletId && wallets.length > 0) {
      setFromWalletId(wallets[0].id);
    }
    if (!toWalletId && wallets.length > 1) {
      setToWalletId(wallets[1].id);
    }
    if (!categoryId && type !== 'transfer') {
      const firstCat = categories.find((c) => c.type === type);
      if (firstCat) setCategoryId(firstCat.id);
    }
  }, [isOpen, initialTransaction, wallets, categories, fromWalletId, toWalletId, categoryId, type]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseAmount(raw);
    setAmountStr(num === 0 ? '' : num.toString());
  };

  const handleQuickAdd = (addition: number) => {
    const current = parseAmount(amountStr);
    setAmountStr((current + addition).toString());
  };

  const handleQuickCreateWallet = async () => {
    if (!onAddWallet) return;
    if (!quickWalletName.trim()) {
      setError('Masukkan nama dompet terlebih dahulu.');
      return;
    }

    try {
      setIsCreatingWallet(true);
      setError('');
      const created = await onAddWallet({
        name: quickWalletName.trim(),
        type: quickWalletType,
        initialBalance: parseAmount(quickWalletBalance),
        color: quickWalletType === 'bank' ? '#0066AE' : quickWalletType === 'ewallet' ? '#00AED6' : '#16A34A',
        icon: quickWalletType === 'bank' ? 'Building2' : quickWalletType === 'ewallet' ? 'Smartphone' : 'Banknote',
      });
      setFromWalletId(created.id);
      setQuickWalletName('');
      setQuickWalletBalance('0');
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat dompet.');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseAmount(amountStr);
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (!fromWalletId) {
      setError('Pilih dompet sumber.');
      return;
    }

    if (type === 'transfer') {
      if (!toWalletId) {
        setError('Pilih dompet tujuan transfer.');
        return;
      }
      if (fromWalletId === toWalletId) {
        setError('Dompet sumber dan dompet tujuan tidak boleh sama.');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Pilih kategori transaksi.');
        return;
      }
    }

    if (!description.trim()) {
      setError('Keterangan atau nama transaksi wajib diisi.');
      return;
    }

    if (!date) {
      setError('Pilih tanggal transaksi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        amount: numAmount,
        type,
        categoryId: type === 'transfer' ? undefined : categoryId,
        fromWalletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        date,
        time,
        description: description.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catat pengeluaran, pemasukan, atau transfer antar rekening
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Segmented Control */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const first = categories.find((c) => c.type === 'expense');
                if (first) setCategoryId(first.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const first = categories.find((c) => c.type === 'income');
                if (first) setCategoryId(first.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Display & Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nominal ({type === 'expense' ? 'Pengeluaran' : type === 'income' ? 'Pemasukan' : 'Transfer'})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 dark:text-slate-500">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountStr ? formatCurrency(parseAmount(amountStr), 'IDR', false) : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] focus:border-transparent tabular-nums"
                autoFocus
              />
            </div>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10000, 25000, 50000, 100000, 500000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleQuickAdd(quick)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors tabular-nums"
                >
                  +{formatCurrency(quick, 'IDR')}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keterangan Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'expense'
                    ? 'Contoh: Makan Siang Nasi Padang, Belanja Mingguan...'
                    : type === 'income'
                    ? 'Contoh: Gaji Pokok, Fee Project UI/UX...'
                    : 'Contoh: Top Up Saldo GoPay dari BCA...'
                }
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
              />
            </div>
          </div>

          {/* Category Picker (if not transfer) */}
          {type !== 'transfer' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategori
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
                {filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-[#731331] text-white font-semibold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className="w-4 h-4"
                        color={isSelected ? '#ffffff' : cat.color}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallets */}
          {wallets.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                  <WalletLucide className="w-4 h-4 shrink-0" />
                  <span>Belum ada dompet. Buat dompet pertamamu untuk mencatat transaksi:</span>
                </div>
                {onNavigateToWallets && (
                  <button
                    type="button"
                    onClick={onNavigateToWallets}
                    className="text-[11px] font-semibold text-[#731331] dark:text-rose-400 hover:underline shrink-0"
                  >
                    Buka Menu Dompet
                  </button>
                )}
              </div>

              {onAddWallet && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={quickWalletName}
                    onChange={(e) => setQuickWalletName(e.target.value)}
                    placeholder="Nama dompet (mis. Tunai / BCA)"
                    className="sm:col-span-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                  />
                  <select
                    value={quickWalletType}
                    onChange={(e) => setQuickWalletType(e.target.value as WalletType)}
                    className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                  >
                    <option value="cash">Uang Tunai</option>
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="savings">Tabungan</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleQuickCreateWallet}
                    disabled={isCreatingWallet}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] disabled:opacity-50 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingWallet ? 'Membuat...' : 'Buat Dompet'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : type === 'transfer' ? (
            wallets.length < 2 ? (
              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 flex items-center justify-between gap-3 text-xs text-sky-900 dark:text-sky-300">
                <span>Transfer antar dompet membutuhkan minimal 2 dompet aktif.</span>
                {onNavigateToWallets && (
                  <button
                    type="button"
                    onClick={onNavigateToWallets}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shrink-0"
                  >
                    + Tambah Dompet
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dari Dompet
                  </label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(walletBalances[w.id] || 0, 'IDR')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ke Dompet Tujuan
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(walletBalances[w.id] || 0, 'IDR')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dompet / Rekening
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(walletBalances[w.id] || 0, 'IDR')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Waktu
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan struk, nomor referensi, atau detail lain..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
            />
          </div>
        </form>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#731331] hover:bg-[#560e25] disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            {isSubmitting ? 'Menyimpan...' : initialTransaction ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
};
