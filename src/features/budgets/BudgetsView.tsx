import React, { useState } from 'react';
import { Budget, Category, Transaction } from '../../types/finance';
import { calculateBudgetStatus, formatCurrency } from '../../utils/finance';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { CategoryIcon } from '../../components/CategoryIcon';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onAddBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => Promise<any>;
  onDeleteBudget: (id: string) => Promise<any>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  transactions,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimitStr, setMonthlyLimitStr] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('0.8');
  const [formError, setFormError] = useState('');
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate budget statuses for selected month
  const budgetStatuses = calculateBudgetStatus(
    budgets.filter((b) => !b.month || b.month === selectedMonth),
    transactions,
    categories,
    selectedMonth
  );

  const totalBudgetLimit = budgetStatuses.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalBudgetSpent = budgetStatuses.reduce((acc, b) => acc + b.spent, 0);
  const totalRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const overallPercentage = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId(expenseCategories[0]?.id || '');
    setMonthlyLimitStr('1000000');
    setAlertThreshold('0.8');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.categoryId);
    setMonthlyLimitStr(b.monthlyLimit.toString());
    setAlertThreshold((b.alertThreshold || 0.8).toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!categoryId) {
      setFormError('Pilih kategori pengeluaran.');
      return;
    }

    const limitNum = parseFloat(monthlyLimitStr.replace(/[^0-9]/g, '')) || 0;
    if (limitNum <= 0) {
      setFormError('Nominal batas anggaran harus lebih besar dari 0.');
      return;
    }

    try {
      if (editingBudget) {
        await onUpdateBudget(editingBudget.id, {
          categoryId,
          monthlyLimit: limitNum,
          month: selectedMonth,
          alertThreshold: parseFloat(alertThreshold) || 0.8,
        });
      } else {
        await onAddBudget({
          categoryId,
          monthlyLimit: limitNum,
          month: selectedMonth,
          alertThreshold: parseFloat(alertThreshold) || 0.8,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan anggaran.');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Anggaran Bulanan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kendalikan pengeluaran dengan menetapkan batas limit per kategori
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month input selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Anggaran</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Batas Limit</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalBudgetLimit, 'IDR')}
            </div>
            <p className="text-[11px] text-slate-500">Total pagu anggaran bulan ini</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Terpakai</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalBudgetSpent, 'IDR')}
            </div>
            <p className="text-[11px] text-slate-500">
              {overallPercentage.toFixed(0)}% dari seluruh total limit
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Sisa Pagu Aman</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalRemaining, 'IDR')}
            </div>
            <p className="text-[11px] text-slate-500">Dapat dibelanjakan hingga akhir bulan</p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallPercentage > 100
                  ? 'bg-rose-600'
                  : overallPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-[#731331]'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      {budgetStatuses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgetStatuses.map((b) => {
            return (
              <div
                key={b.budgetId}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-xs flex flex-col justify-between transition-all ${
                  b.isOverBudget
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : b.isWarning
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: b.color }}
                      >
                        <CategoryIcon name={b.icon} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {b.categoryName}
                        </h3>
                        <div className="text-xs text-slate-400">Batas Bulanan</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const original = budgets.find((item) => item.id === b.budgetId);
                          if (original) openEditModal(original);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Anggaran"
                        aria-label="Edit Anggaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const original = budgets.find((item) => item.id === b.budgetId);
                          if (original) setBudgetToDelete(original);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus Anggaran"
                        aria-label="Hapus Anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-5 space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Terpakai:</span>
                      <span className="font-extrabold text-base text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(b.spent, 'IDR')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-slate-500">
                      <span>Batas Limit:</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(b.monthlyLimit, 'IDR')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          b.isOverBudget
                            ? 'text-rose-600 dark:text-rose-400'
                            : b.isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {b.isOverBudget ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Kelebihan {formatCurrency(b.spent - b.monthlyLimit, 'IDR')}</span>
                          </>
                        ) : b.isWarning ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Peringatan ({(b.percentage).toFixed(0)}%)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Sisa {formatCurrency(b.remaining, 'IDR')}</span>
                          </>
                        )}
                      </span>
                      <span className="text-slate-400 tabular-nums">{b.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Anggaran untuk Periode Ini
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buat pagu pengeluaran untuk membatasi belanja makanan, tagihan, atau hiburan bulanan.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
          >
            + Buat Anggaran Pertama
          </button>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingBudget ? 'Edit Anggaran Kategori' : 'Pasang Anggaran Baru'}
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
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batas Maksimal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={monthlyLimitStr}
                  onChange={(e) => setMonthlyLimitStr(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batas Peringatan Waspada (%)
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                >
                  <option value="0.7">70% dari limit</option>
                  <option value="0.8">80% dari limit (Rekomendasi)</option>
                  <option value="0.9">90% dari limit</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
                >
                  {editingBudget ? 'Simpan Anggaran' : 'Pasang Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Anggaran Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pagu anggaran ini akan dihapus. Transaksi yang ada tidak akan terpengaruh.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBudgetToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onDeleteBudget(budgetToDelete.id);
                  setBudgetToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus Anggaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
