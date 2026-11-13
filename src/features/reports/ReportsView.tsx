import React, { useState } from 'react';
import {
  Wallet,
  Transaction,
  Category,
  DateFilterType,
  DateRange,
} from '../../types/finance';
import {
  formatCurrency,
  filterTransactionsByDateRange,
  calculateCategoryBreakdown,
  generateMonthlyCashFlow,
  formatDateIndonesian,
} from '../../utils/finance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Wallet as WalletLucide,
} from 'lucide-react';
import { WalletIcon } from '../../components/WalletIcon';

interface ReportsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  walletBalances: Record<string, number>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  wallets,
  categories,
  walletBalances,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [activeTab, setActiveTab] = useState<'cashflow' | 'expense' | 'income' | 'wallets'>('cashflow');

  const filteredTransactions = filterTransactionsByDateRange(transactions, dateFilter);

  // Financial totals for the period
  let periodIncome = 0;
  let periodExpense = 0;
  for (const tx of filteredTransactions) {
    if (tx.type === 'income') periodIncome += tx.amount;
    else if (tx.type === 'expense') periodExpense += tx.amount;
  }
  const periodNet = periodIncome - periodExpense;
  const savingsRate = periodIncome > 0 ? Math.max(0, (periodNet / periodIncome) * 100) : 0;

  // Category breakdowns
  const expenseBreakdown = calculateCategoryBreakdown(filteredTransactions, categories, 'expense');
  const incomeBreakdown = calculateCategoryBreakdown(filteredTransactions, categories, 'income');

  // Cash flow trend for the last 6 months
  const cashFlowTrend = generateMonthlyCashFlow(transactions, 6);
  const hasCashFlowData = cashFlowTrend.some((m) => m.income > 0 || m.expense > 0);

  // Export report to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Dompet', 'Catatan'];
    const rows = filteredTransactions.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const w = wallets.find((item) => item.id === tx.fromWalletId);
      return [
        tx.id,
        tx.date,
        tx.time || '',
        tx.type,
        cat?.name || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.amount,
        w?.name || '',
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_Dompetin_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan & Analitik Keuangan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis arus kas, distribusi pengeluaran, rasio tabungan, dan ekspor data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date filter dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#731331]"
          >
            <option value="today">Hari Ini</option>
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
            <option value="all">Semua Data</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Total Pemasukan</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(periodIncome, 'IDR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Periode yang dipilih</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Total Pengeluaran</span>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#731331] dark:text-rose-400 mt-2 tabular-nums">
            {formatCurrency(periodExpense, 'IDR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Periode yang dipilih</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Arus Kas Bersih</span>
            <span className="p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-lg">
              <BarChart3 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold mt-2 tabular-nums ${
              periodNet >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
            }`}
          >
            {formatCurrency(periodNet, 'IDR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {periodNet >= 0 ? 'Arus kas positif' : 'Defisit (pengeluaran > pemasukan)'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Rasio Tabungan</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
              <PieIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-2 tabular-nums">
            {savingsRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Persentase sisa penghasilan</p>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto w-fit">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'cashflow'
              ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Perbandingan Bulanan
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Kategori Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'income'
              ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Kategori Pemasukan
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'wallets'
              ? 'bg-white dark:bg-slate-700 text-[#731331] dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Distribusi Dompet
        </button>
      </div>

      {/* Tab 1: Monthly Cashflow Comparison */}
      {activeTab === 'cashflow' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Histori Arus Kas 6 Bulan Terakhir
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbandingan nominal pemasukan, pengeluaran, dan net surplus bulanan
            </p>
          </div>

          {hasCashFlowData ? (
            <>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
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
                    />
                    <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="expense" fill="#731331" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Bulan</th>
                      <th className="py-2.5 px-4 text-right">Pemasukan</th>
                      <th className="py-2.5 px-4 text-right">Pengeluaran</th>
                      <th className="py-2.5 px-4 text-right">Arus Kas Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cashFlowTrend.map((row) => (
                      <tr key={row.monthKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.label}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(row.income, 'IDR')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#731331] dark:text-rose-400 tabular-nums">
                          {formatCurrency(row.expense, 'IDR')}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold tabular-nums ${
                            row.net >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(row.net, 'IDR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-14 px-6 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-slate-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Belum ada data laporan arus kas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Mulai catat pemasukan dan pengeluaran pertamamu untuk melihat perbandingan bulanan dan grafik analitik.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Expense Category Breakdown */}
      {activeTab === 'expense' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Proporsi Pengeluaran
            </h3>
            {expenseBreakdown.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {expenseBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0, 'IDR'), 'Nominal']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-xs text-slate-400">Tidak ada pengeluaran pada periode ini.</div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Rincian Kategori Pengeluaran
            </h3>
            {expenseBreakdown.length > 0 ? (
              <div className="space-y-3">
                {expenseBreakdown.map((item) => (
                  <div key={item.categoryId} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-900 dark:text-white">{item.categoryName}</span>
                      </div>
                      <div className="tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, 'IDR')}{' '}
                        <span className="text-slate-400 font-normal">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada rincian pengeluaran untuk periode ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Income Category Breakdown */}
      {activeTab === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Sumber Pemasukan
            </h3>
            {incomeBreakdown.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeBreakdown}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {incomeBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0, 'IDR'), 'Nominal']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-xs text-slate-400">Tidak ada pemasukan pada periode ini.</div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Rincian Kategori Pemasukan
            </h3>
            {incomeBreakdown.length > 0 ? (
              <div className="space-y-3">
                {incomeBreakdown.map((item) => (
                  <div key={item.categoryId} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-900 dark:text-white">{item.categoryName}</span>
                      </div>
                      <div className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.amount, 'IDR')}{' '}
                        <span className="text-slate-400 font-normal">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada rincian pemasukan untuk periode ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Wallet Distribution */}
      {activeTab === 'wallets' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ringkasan Saldo dan Alokasi Dompet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi saldo pada setiap akun finansial Anda
            </p>
          </div>

          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((w) => {
                const bal = walletBalances[w.id] || 0;
                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-xl text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: w.color }}
                      >
                        <WalletIcon iconName={w.icon} type={w.type} className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</div>
                        <div className="text-[11px] text-slate-400">{w.type.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(bal, 'IDR')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-slate-400">
                <WalletLucide className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Belum ada dompet yang terdaftar
              </p>
              <p className="text-[11px] text-slate-400">
                Tambahkan dompet di menu Dompet untuk melihat alokasi saldo di laporan ini.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
