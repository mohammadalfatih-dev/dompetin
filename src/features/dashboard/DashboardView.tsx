import React, { useState } from 'react';
import {
  Wallet,
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  DateFilterType,
  DateRange,
} from '../../types/finance';
import {
  formatCurrency,
  filterTransactionsByDateRange,
  calculateCategoryBreakdown,
  calculateBudgetStatus,
  generateMonthlyCashFlow,
  formatDateIndonesian,
} from '../../utils/finance';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertTriangle,
  Target,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CategoryIcon } from '../../components/CategoryIcon';
import { WalletIcon } from '../../components/WalletIcon';

interface DashboardViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  walletBalances: Record<string, number>;
  totalBalance: number;
  onOpenAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: string) => void;
  onOpenDepositSavings: (goal: SavingsGoal) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  wallets,
  categories,
  transactions,
  budgets,
  savingsGoals,
  walletBalances,
  totalBalance,
  onOpenAddTransaction,
  onSelectTransaction,
  onNavigateTab,
  onOpenDepositSavings,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date().toISOString().slice(0, 7) + '-01',
    endDate: new Date().toISOString().slice(0, 10),
  });

  // Filter transactions according to selected date range
  const filteredTransactions = filterTransactionsByDateRange(
    transactions,
    dateFilter,
    dateFilter === 'custom' ? customRange : undefined
  );

  // Totals for the filtered period
  let periodIncome = 0;
  let periodExpense = 0;
  for (const tx of filteredTransactions) {
    if (tx.type === 'income') periodIncome += tx.amount;
    else if (tx.type === 'expense') periodExpense += tx.amount;
  }
  const periodNet = periodIncome - periodExpense;

  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(filteredTransactions, categories, 'expense');

  // Budget status for current month
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const budgetStatuses = calculateBudgetStatus(budgets, transactions, categories, currentMonthKey);

  // Cash flow trend for the last 6 months
  const cashFlowTrend = generateMonthlyCashFlow(transactions, 6);

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const getCategoryInfo = (id?: string) => {
    return categories.find((c) => c.id === id);
  };

  const getWalletInfo = (id?: string) => {
    return wallets.find((w) => w.id === id);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Top Banner: Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pantau arus kas, performa dompet, dan target finansial Anda
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'this_year', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as DateFilterType)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                dateFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Financial Hero Card (Burgundy & Moni.id Inspired) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#680D28] via-[#731331] to-[#400717] text-white p-6 sm:p-8 shadow-xl">
        {/* Subtle decorative background rings */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-48 h-48 rounded-full bg-[#EA580C]/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Total Saldo Bersih
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full font-medium text-white/90">
                Semua Dompet Aktif
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums">
              {formatCurrency(totalBalance, 'IDR')}
            </div>
            <p className="text-xs text-white/75">
              Tercatat pada {wallets.filter((w) => !w.isArchived).length} dompet & rekening bank
            </p>
          </div>

          {/* Quick Metrics in Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Income */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span>Pemasukan</span>
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1 text-white tabular-nums">
                {formatCurrency(periodIncome, 'IDR')}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">Periode Terpilih</div>
            </div>

            {/* Expense */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Pengeluaran</span>
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1 text-white tabular-nums">
                {formatCurrency(periodExpense, 'IDR')}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">Periode Terpilih</div>
            </div>

            {/* Net Flow */}
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Arus Kas Bersih</span>
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1 text-white tabular-nums">
                {formatCurrency(periodNet, 'IDR')}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {periodNet >= 0 ? 'Surplus Finansial' : 'Defisit Anggaran'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Button within Hero for Desktop */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Penyimpanan lokal aman aktif (IndexedDB)</span>
          </div>
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white text-[#731331] hover:bg-slate-100 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#731331]" />
            <span>Catat Transaksi Sekarang</span>
          </button>
        </div>
      </div>

      {/* Grid: Charts (Cash Flow Bar Chart + Category Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow 6 Months Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tren Pemasukan vs Pengeluaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan histori keuangan selama 6 bulan terakhir
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#731331]" />
                <span className="text-slate-600 dark:text-slate-300">Pengeluaran</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value) || 0, 'IDR'),
                    name === 'income' ? 'Pemasukan' : 'Pengeluaran',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="expense" fill="#731331" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Distribusi Pengeluaran
              </h2>
              <span className="text-xs text-slate-400">Kategori</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Alokasi pengeluaran Anda pada periode ini
            </p>

            {categoryBreakdown.length > 0 ? (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.slice(0, 5)}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {categoryBreakdown.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0, 'IDR'), 'Jumlah']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center">
                Belum ada pengeluaran pada periode ini.
              </div>
            )}
          </div>

          {/* Top 3 categories list */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryBreakdown.slice(0, 3).map((item) => (
              <div key={item.categoryId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                    {item.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(item.amount, 'IDR')}
                  </span>
                  <span className="text-slate-400 text-[11px] tabular-nums">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Wallets Quick Strip + Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallets Card List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Dompet & Rekening</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Saldo aktual per akun</p>
            </div>
            <button
              onClick={() => onNavigateTab('wallets')}
              className="text-xs font-semibold text-[#731331] dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              <span>Kelola</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {wallets.filter((w) => !w.isArchived).map((wallet) => {
              const balance = walletBalances[wallet.id] || 0;
              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: wallet.color }}
                    >
                      <WalletIcon iconName={wallet.icon} type={wallet.type} className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{wallet.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {wallet.accountNumber || (wallet.type === 'cash' ? 'Uang Tunai Fisik' : 'Akun Utama')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(balance, 'IDR')}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Aktif</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Progress Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pantauan Anggaran</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Batas belanja bulan ini</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs font-semibold text-[#731331] dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {budgetStatuses.length > 0 ? (
              budgetStatuses.slice(0, 4).map((b) => (
                <div key={b.budgetId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {b.categoryName}
                      </span>
                    </div>
                    <div className="tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.spent, 'IDR')}
                      </span>
                      <span className="text-slate-400"> / {formatCurrency(b.monthlyLimit, 'IDR')}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.isOverBudget
                          ? 'bg-rose-600'
                          : b.isWarning
                          ? 'bg-amber-500'
                          : 'bg-[#731331]'
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-medium ${
                        b.isOverBudget
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : b.isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {b.isOverBudget
                        ? 'Melebihi Anggaran!'
                        : b.isWarning
                        ? 'Mendekati Batas (80%+)'
                        : 'Sisa ' + formatCurrency(b.remaining, 'IDR')}
                    </span>
                    <span className="text-slate-400 tabular-nums">{b.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada anggaran bulanan yang dibuat.
              </div>
            )}
          </div>
        </div>

        {/* Savings Goals Highlights */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Target Tabungan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rencana masa depan Anda</p>
              </div>
              <button
                onClick={() => onNavigateTab('savings')}
                className="text-xs font-semibold text-[#731331] dark:text-rose-400 hover:underline flex items-center gap-0.5"
              >
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {savingsGoals.slice(0, 2).map((goal) => {
                const percent = Math.min(
                  goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
                  100
                );
                return (
                  <div
                    key={goal.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {goal.name}
                      </div>
                      <button
                        onClick={() => onOpenDepositSavings(goal)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#731331] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        + Setor
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      <span>Terkumpul: {formatCurrency(goal.currentAmount, 'IDR')}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {percent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#731331] to-[#EA580C] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('savings')}
            className="mt-4 w-full py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Target className="w-4 h-4 text-[#731331]" />
            <span>Lihat Semua Impian Tabungan</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histori mutasi pengeluaran, pemasukan, dan transfer
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-[#731331] dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <span>Semua Transaksi ({transactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const cat = getCategoryInfo(tx.categoryId);
              const fromW = getWalletInfo(tx.fromWalletId);
              const toW = getWalletInfo(tx.toWalletId);

              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-3 -mx-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                        <span>{formatDateIndonesian(tx.date)}</span>
                        <span>·</span>
                        <span className="truncate">
                          {isTransfer
                            ? `${fromW?.name || 'Dompet'} → ${toW?.name || 'Dompet'}`
                            : `${fromW?.name || 'Dompet'} · ${cat?.name || 'Umum'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold tabular-nums ${
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
                    {tx.notes && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {tx.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum ada transaksi yang tercatat
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mulai catat transaksi pertama Anda dengan tombol di bawah
              </p>
            </div>
            <button
              onClick={onOpenAddTransaction}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
            >
              + Tambah Transaksi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
