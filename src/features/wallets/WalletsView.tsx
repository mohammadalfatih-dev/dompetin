import React, { useState } from 'react';
import { Wallet, Transaction, WalletType } from '../../types/finance';
import { formatCurrency, formatDateIndonesian } from '../../utils/finance';
import {
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Building2,
  Smartphone,
  Wallet as WalletIconLucide,
  Banknote,
  CreditCard,
  PiggyBank,
  Check,
  X,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { WalletIcon } from '../../components/WalletIcon';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  walletBalances: Record<string, number>;
  onAddWallet: (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateWallet: (id: string, updates: Partial<Wallet>) => Promise<any>;
  onDeleteWallet: (id: string) => Promise<any>;
  onOpenTransferModal: (fromWalletId?: string) => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  walletBalances,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onOpenTransferModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#0066AE');
  const [icon, setIcon] = useState('Building2');
  const [formError, setFormError] = useState('');

  // Selected wallet for transaction history view
  const [historyWallet, setHistoryWallet] = useState<Wallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  const colors = [
    '#0066AE', // BCA blue
    '#003876', // Mandiri blue
    '#00AED6', // GoPay cyan
    '#4C3494', // OVO purple
    '#16A34A', // Cash green
    '#731331', // Burgundy Dompetin
    '#EA580C', // Orange
    '#0284C7', // Sky
    '#D97706', // Amber
    '#475569', // Slate
  ];

  const icons = [
    { id: 'Building2', label: 'Bank Umum' },
    { id: 'Landmark', label: 'Institusi' },
    { id: 'Smartphone', label: 'E-Wallet' },
    { id: 'Wallet', label: 'Dompet' },
    { id: 'Banknote', label: 'Tunai' },
    { id: 'CreditCard', label: 'Kartu Kredit' },
    { id: 'PiggyBank', label: 'Celengan' },
  ];

  const openAddModal = () => {
    setEditingWallet(null);
    setName('');
    setType('bank');
    setInitialBalance('0');
    setAccountNumber('');
    setColor('#0066AE');
    setIcon('Building2');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setInitialBalance(w.initialBalance.toString());
    setAccountNumber(w.accountNumber || '');
    setColor(w.color);
    setIcon(w.icon || 'Building2');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama dompet/rekening wajib diisi.');
      return;
    }

    const initAmt = parseFloat(initialBalance.replace(/[^0-9]/g, '')) || 0;

    try {
      if (editingWallet) {
        await onUpdateWallet(editingWallet.id, {
          name: name.trim(),
          type,
          initialBalance: initAmt,
          accountNumber: accountNumber.trim(),
          color,
          icon,
        });
      } else {
        await onAddWallet({
          name: name.trim(),
          type,
          initialBalance: initAmt,
          accountNumber: accountNumber.trim(),
          color,
          icon,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan dompet.');
    }
  };

  const totalAllWallets = wallets.reduce((acc, w) => acc + (walletBalances[w.id] || 0), 0);

  // Filter transactions for history modal
  const historyTransactions = historyWallet
    ? transactions.filter(
        (tx) => tx.fromWalletId === historyWallet.id || tx.toWalletId === historyWallet.id
      )
    : [];

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kelola Dompet & Rekening
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Atur rekening bank, saldo e-wallet, dan uang tunai Anda di satu tempat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTransferModal()}
            disabled={wallets.length < 2}
            title={wallets.length < 2 ? 'Minimal 2 dompet untuk melakukan transfer' : 'Transfer Antar Dompet'}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
            <span>Transfer Antar Dompet</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Total Aset Likuid Finansial
          </span>
          <div className="text-3xl font-extrabold mt-1 tabular-nums">
            {formatCurrency(totalAllWallets, 'IDR')}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {wallets.length > 0
              ? `Tersebar di ${wallets.length} dompet aktif (Bank, E-Wallet, dan Kas Tunai)`
              : 'Belum ada dompet yang ditambahkan. Tambahkan dompet pertamamu sekarang.'}
          </p>
        </div>

        {wallets.length >= 2 ? (
          <button
            onClick={() => onOpenTransferModal()}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            Kirim / Pindah Saldo
          </button>
        ) : (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Dompet</span>
          </button>
        )}
      </div>

      {/* Wallets Grid */}
      {wallets.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((wallet) => {
          const balance = walletBalances[wallet.id] || 0;
          return (
            <div
              key={wallet.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Top Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: wallet.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: wallet.color }}
                    >
                      <WalletIcon iconName={wallet.icon} type={wallet.type} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {wallet.name}
                      </h3>
                      <div className="text-xs text-slate-400 capitalize">
                        {wallet.type === 'bank'
                          ? 'Rekening Bank'
                          : wallet.type === 'ewallet'
                          ? 'Dompet Digital'
                          : wallet.type === 'cash'
                          ? 'Uang Tunai'
                          : wallet.type === 'savings'
                          ? 'Tabungan'
                          : 'Kartu Kredit'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(wallet)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Dompet"
                      aria-label="Edit Dompet"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setWalletToDelete(wallet)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus Dompet"
                      aria-label="Hapus Dompet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Saldo Saat Ini
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatCurrency(balance, 'IDR')}
                  </div>
                  {wallet.accountNumber && (
                    <div className="text-xs text-slate-500 font-mono">
                      No. Rek: {wallet.accountNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setHistoryWallet(wallet)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#731331] dark:hover:text-white transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Histori Mutasi</span>
                </button>

                <button
                  onClick={() => onOpenTransferModal(wallet.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <WalletIconLucide className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Dompet & Rekening
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Tambahkan rekening bank, saldo e-wallet, atau dompet tunai pertamamu untuk mulai mencatat saldo dan transaksi secara akurat.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet Pertama</span>
          </button>
        </div>
      )}

      {/* Wallet Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingWallet ? 'Edit Dompet / Rekening' : 'Tambah Dompet Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Dompet / Bank <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank BCA, GoPay, Dompet Saku..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipe Akun
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WalletType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet (GoPay, OVO)</option>
                    <option value="cash">Uang Tunai / Cash</option>
                    <option value="savings">Akun Tabungan</option>
                    <option value="credit">Kartu Kredit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="text"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Rekening / Akun (Opsional)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 123-456-7890"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Identitas Dompet
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ikon
                </label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id)}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                        icon === ic.id
                          ? 'border-[#731331] bg-rose-50/50 text-[#731331] dark:bg-rose-950/40 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <WalletIcon iconName={ic.id} className="w-4 h-4" />
                      <span>{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
                >
                  {editingWallet ? 'Simpan Perubahan' : 'Buat Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet History Modal */}
      {historyWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl text-white flex items-center justify-center"
                  style={{ backgroundColor: historyWallet.color }}
                >
                  <WalletIcon iconName={historyWallet.icon} type={historyWallet.type} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Histori: {historyWallet.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-semibold tabular-nums">
                    Saldo: {formatCurrency(walletBalances[historyWallet.id] || 0, 'IDR')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setHistoryWallet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                aria-label="Tutup Histori Dompet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {historyTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isOutgoingTransfer = tx.type === 'transfer' && tx.fromWalletId === historyWallet.id;
                    const isIncomingTransfer = tx.type === 'transfer' && tx.toWalletId === historyWallet.id;

                    return (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.description}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatDateIndonesian(tx.date)} {tx.time || ''}
                          </div>
                        </div>

                        <div className="text-right font-bold tabular-nums">
                          <span
                            className={
                              isIncome || isIncomingTransfer
                                ? 'text-emerald-600'
                                : 'text-[#731331] dark:text-rose-400'
                            }
                          >
                            {isIncome || isIncomingTransfer ? '+' : '-'}
                            {formatCurrency(tx.amount, 'IDR')}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {isIncomingTransfer
                              ? 'Transfer Masuk'
                              : isOutgoingTransfer
                              ? 'Transfer Keluar'
                              : isIncome
                              ? 'Pemasukan'
                              : 'Pengeluaran'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada catatan mutasi pada dompet ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Wallet Confirmation */}
      {walletToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Dompet Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Menghapus dompet <strong>"{walletToDelete.name}"</strong> akan menghapus seluruh data
              mutasi dan histori yang tertaut dengan dompet ini. Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setWalletToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onDeleteWallet(walletToDelete.id);
                  setWalletToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus Dompet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
