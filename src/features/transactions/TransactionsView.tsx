import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Transaction,
  Category,
  TransactionType,
  DateFilterType,
} from '../../types/finance';
import {
  formatCurrency,
  formatDateIndonesian,
  filterTransactionsByDateRange,
} from '../../utils/finance';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  SlidersHorizontal,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { CategoryIcon } from '../../components/CategoryIcon';

interface TransactionsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  walletBalances: Record<string, number>;
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  selectedTxForDetail?: Transaction | null;
  onCloseDetailModal?: () => void;
  onOpenDetailModal?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  wallets,
  categories,
  onOpenAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  selectedTxForDetail,
  onCloseDetailModal,
  onOpenDetailModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('all');
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  // Active detail modal target
  const activeDetail = selectedTxForDetail || detailTx;

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const walletMap = useMemo(() => {
    const map = new Map<string, Wallet>();
    for (const w of wallets) map.set(w.id, w);
    return map;
  }, [wallets]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = filterTransactionsByDateRange(transactions, selectedDateFilter);

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter((tx) => tx.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((tx) => tx.categoryId === selectedCategory);
    }

    // Wallet filter
    if (selectedWallet !== 'all') {
      result = result.filter(
        (tx) => tx.fromWalletId === selectedWallet || tx.toWalletId === selectedWallet
      );
    }

    // Sort
    return result.sort((a, b) => {
      if (sortOption === 'date_desc') {
        return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
      }
      if (sortOption === 'date_asc') {
        return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
      }
      if (sortOption === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortOption === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [transactions, selectedDateFilter, searchQuery, selectedType, selectedCategory, selectedWallet, sortOption]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    for (const tx of filteredTransactions) {
      if (!dateMap.has(tx.date)) {
        dateMap.set(tx.date, []);
      }
      dateMap.get(tx.date)!.push(tx);
    }

    dateMap.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups;
  }, [filteredTransactions]);

  const confirmDelete = async () => {
    if (txToDelete) {
      await onDeleteTransaction(txToDelete.id);
      setTxToDelete(null);
      if (activeDetail?.id === txToDelete.id) {
        if (onCloseDetailModal) onCloseDetailModal();
        setDetailTx(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola seluruh mutasi pengeluaran, pemasukan, dan transfer dompet
          </p>
        </div>

        <button
          onClick={onOpenAddTransaction}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search input + Type tabs */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan nama atau catatan..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Tipe' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'transfer', label: 'Transfer' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  selectedType === tab.id
                    ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row: Category, Wallet, Date, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#731331]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
              </option>
            ))}
          </select>

          {/* Wallet Dropdown */}
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#731331]"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value as DateFilterType)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#731331]"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
          </select>

          {/* Sort Option */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#731331]"
          >
            <option value="date_desc">Tanggal (Terbaru)</option>
            <option value="date_asc">Tanggal (Terlama)</option>
            <option value="amount_desc">Nominal (Terbesar)</option>
            <option value="amount_asc">Nominal (Terkecil)</option>
          </select>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {groupedByDate.length > 0 ? (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            // Group total net amount
            let groupNet = 0;
            for (const tx of group.items) {
              if (tx.type === 'income') groupNet += tx.amount;
              else if (tx.type === 'expense') groupNet -= tx.amount;
            }

            return (
              <div
                key={group.date}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs"
              >
                {/* Date Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#731331] dark:text-rose-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDateIndonesian(group.date, true)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({group.items.length} transaksi)
                    </span>
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-slate-500">
                    Net: {formatCurrency(groupNet, 'IDR')}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId || '');
                    const fromW = walletMap.get(tx.fromWalletId);
                    const toW = walletMap.get(tx.toWalletId || '');
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                      >
                        {/* Left: Icon & Info */}
                        <div
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            if (onOpenDetailModal) onOpenDetailModal(tx);
                            else setDetailTx(tx);
                          }}
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : isTransfer
                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}
                          >
                            {isTransfer ? (
                              <ArrowRightLeft className="w-4 h-4" />
                            ) : (
                              <CategoryIcon
                                name={cat?.icon || 'Tag'}
                                className="w-4 h-4"
                                color="currentColor"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {tx.description}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {tx.time && <span>{tx.time}</span>}
                              {tx.time && <span>·</span>}
                              <span className="truncate">
                                {isTransfer
                                  ? `${fromW?.name || 'Dompet'} → ${toW?.name || 'Dompet'}`
                                  : `${fromW?.name || 'Dompet'} · ${cat?.name || 'Umum'}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-sm font-extrabold tabular-nums ${
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isTransfer
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : 'text-[#731331] dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : isTransfer ? '' : '-'}
                              {formatCurrency(tx.amount, 'IDR')}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">
                              {isIncome ? 'Pemasukan' : isTransfer ? 'Transfer' : 'Pengeluaran'}
                            </div>
                          </div>

                          {/* Quick Edit & Delete icons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Transaksi"
                              aria-label="Edit Transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Transaksi"
                              aria-label="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Tidak Ada Transaksi Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Coba sesuaikan filter pencarian atau tanggal Anda, atau catat transaksi baru.
            </p>
          </div>
          <button
            onClick={onOpenAddTransaction}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
          >
            + Catat Transaksi Baru
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Transaksi?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus transaksi{' '}
              <strong className="text-slate-900 dark:text-white">
                "{txToDelete.description}"
              </strong>{' '}
              sebesar {formatCurrency(txToDelete.amount, 'IDR')}? Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rincian Transaksi
              </h3>
              <button
                onClick={() => {
                  if (onCloseDetailModal) onCloseDetailModal();
                  setDetailTx(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center py-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">
                  Nominal Transaksi
                </div>
                <div
                  className={`text-2xl font-extrabold mt-1 tabular-nums ${
                    activeDetail.type === 'income'
                      ? 'text-emerald-600'
                      : activeDetail.type === 'transfer'
                      ? 'text-sky-600'
                      : 'text-[#731331] dark:text-rose-400'
                  }`}
                >
                  {activeDetail.type === 'income' ? '+' : activeDetail.type === 'transfer' ? '' : '-'}
                  {formatCurrency(activeDetail.amount, 'IDR')}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {activeDetail.description}
                </div>
              </div>

              <div className="space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-400">Tipe Transaksi</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {activeDetail.type}
                  </span>
                </div>
                {activeDetail.categoryId && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-slate-400">Kategori</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {categoryMap.get(activeDetail.categoryId)?.name || 'Kategori'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-400">
                    {activeDetail.type === 'transfer' ? 'Dari Dompet' : 'Dompet Sumber'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {walletMap.get(activeDetail.fromWalletId)?.name || 'Dompet'}
                  </span>
                </div>
                {activeDetail.toWalletId && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-slate-400">Ke Dompet Tujuan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {walletMap.get(activeDetail.toWalletId)?.name || 'Dompet'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-slate-400">Tanggal & Waktu</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateIndonesian(activeDetail.date, true)} {activeDetail.time || ''}
                  </span>
                </div>
                {activeDetail.notes && (
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Catatan:</span>
                    <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                      {activeDetail.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setTxToDelete(activeDetail);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = activeDetail;
                    if (onCloseDetailModal) onCloseDetailModal();
                    setDetailTx(null);
                    onEditTransaction(toEdit);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Transaksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
