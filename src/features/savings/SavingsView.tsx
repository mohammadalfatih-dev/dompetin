import React, { useState } from 'react';
import { SavingsGoal, Wallet } from '../../types/finance';
import { formatCurrency, formatDateIndonesian } from '../../utils/finance';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  Palmtree,
  Laptop,
  Home,
  Car,
  Gift,
  Coins,
  AlertCircle,
} from 'lucide-react';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  wallets: Wallet[];
  walletBalances: Record<string, number>;
  onAddSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>) => Promise<any>;
  onUpdateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<any>;
  onDeleteSavingsGoal: (id: string) => Promise<any>;
  onAddContribution: (goalId: string, amount: number, note?: string, walletId?: string) => Promise<any>;
  activeDepositGoal?: SavingsGoal | null;
  onCloseDepositModal?: () => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  wallets,
  walletBalances,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  onAddContribution,
  activeDepositGoal,
  onCloseDepositModal,
}) => {
  const [tab, setTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Deposit modal state
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositWalletId, setDepositWalletId] = useState('');
  const [depositError, setDepositError] = useState('');

  // Form states for Goal
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialDepositStr, setInitialDepositStr] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#731331');
  const [icon, setIcon] = useState('ShieldCheck');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Active deposit target
  const currentDepositTarget = activeDepositGoal || depositGoal;

  const colors = ['#731331', '#EA580C', '#0284C7', '#16A34A', '#8B5CF6', '#F59E0B', '#EC4899'];

  const icons = [
    { id: 'ShieldCheck', label: 'Dana Darurat' },
    { id: 'Palmtree', label: 'Liburan' },
    { id: 'Laptop', label: 'Elektronik' },
    { id: 'Home', label: 'Rumah' },
    { id: 'Car', label: 'Kendaraan' },
    { id: 'Gift', label: 'Impian' },
    { id: 'Coins', label: 'Investasi' },
  ];

  const ongoingGoals = savingsGoals.filter((g) => !g.isCompleted && g.currentAmount < g.targetAmount);
  const completedGoals = savingsGoals.filter((g) => g.isCompleted || g.currentAmount >= g.targetAmount);

  const displayedGoals = tab === 'ongoing' ? ongoingGoals : completedGoals;

  const totalTarget = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallSavedPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const openAddGoalModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmountStr('10000000');
    setInitialDepositStr('0');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setTargetDate(nextYear.toISOString().slice(0, 10));
    setColor('#731331');
    setIcon('ShieldCheck');
    setNotes('');
    setFormError('');
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmountStr(g.targetAmount.toString());
    setInitialDepositStr(g.currentAmount.toString());
    setTargetDate(g.targetDate);
    setColor(g.color);
    setIcon(g.icon || 'ShieldCheck');
    setNotes(g.notes || '');
    setFormError('');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama impian/target tabungan wajib diisi.');
      return;
    }

    const targetNum = parseFloat(targetAmountStr.replace(/[^0-9]/g, '')) || 0;
    if (targetNum <= 0) {
      setFormError('Nominal target tabungan harus lebih besar dari 0.');
      return;
    }

    const initNum = parseFloat(initialDepositStr.replace(/[^0-9]/g, '')) || 0;

    try {
      if (editingGoal) {
        await onUpdateSavingsGoal(editingGoal.id, {
          name: name.trim(),
          targetAmount: targetNum,
          currentAmount: initNum,
          targetDate,
          color,
          icon,
          notes: notes.trim(),
          isCompleted: initNum >= targetNum,
        });
      } else {
        await onAddSavingsGoal({
          name: name.trim(),
          targetAmount: targetNum,
          currentAmount: initNum,
          targetDate,
          color,
          icon,
          notes: notes.trim(),
          isCompleted: initNum >= targetNum,
        });
      }
      setIsGoalModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan target tabungan.');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');

    if (!currentDepositTarget) return;

    const amt = parseFloat(depositAmountStr.replace(/[^0-9]/g, '')) || 0;
    if (amt <= 0) {
      setDepositError('Nominal setoran harus lebih besar dari 0.');
      return;
    }

    try {
      await onAddContribution(
        currentDepositTarget.id,
        amt,
        depositNote.trim() || undefined,
        depositWalletId || undefined
      );
      if (onCloseDepositModal) onCloseDepositModal();
      setDepositGoal(null);
      setDepositAmountStr('');
      setDepositNote('');
      setDepositWalletId('');
    } catch (err: any) {
      setDepositError(err.message || 'Gagal menambahkan setoran tabungan.');
    }
  };

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Palmtree':
        return <Palmtree className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      case 'Home':
        return <Home className={className} />;
      case 'Car':
        return <Car className={className} />;
      case 'Gift':
        return <Gift className={className} />;
      case 'Coins':
        return <Coins className={className} />;
      default:
        return <ShieldCheck className={className} />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Target & Celengan Impian
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rencanakan dana darurat, liburan, dan impian finansial masa depan
          </p>
        </div>

        <button
          onClick={openAddGoalModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Target Baru</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="p-6 bg-gradient-to-br from-[#731331] via-[#851639] to-[#EA580C] text-white rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-white/80 font-medium uppercase tracking-wider">
              Total Akumulasi Tabungan
            </span>
            <div className="text-3xl font-extrabold mt-1 tabular-nums">
              {formatCurrency(totalSaved, 'IDR')}
            </div>
            <p className="text-xs text-white/80 mt-1">
              Dari total impian sebesar {formatCurrency(totalTarget, 'IDR')}
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-amber-300 tabular-nums">
              {overallSavedPercent.toFixed(0)}%
            </span>
            <div className="text-xs text-white/80">Rata-rata Terkumpul</div>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.min(overallSavedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs: Ongoing vs Completed */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('ongoing')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === 'ongoing'
              ? 'bg-[#731331] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Sedang Berjalan ({ongoingGoals.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === 'completed'
              ? 'bg-[#731331] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tercapai ({completedGoals.length})
        </button>
      </div>

      {/* Goals Grid */}
      {displayedGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedGoals.map((goal) => {
            const percent = Math.min(
              goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
              100
            );
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: goal.color }}
                      >
                        {renderIcon(goal.icon)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {goal.name}
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {formatDateIndonesian(goal.targetDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Target"
                        aria-label="Edit Target"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setGoalToDelete(goal)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus Target"
                        aria-label="Hapus Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.notes && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {goal.notes}
                    </p>
                  )}

                  <div className="mt-5 space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Terkumpul:</span>
                      <span className="font-extrabold text-base text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(goal.currentAmount, 'IDR')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-slate-500">
                      <span>Target:</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(goal.targetAmount, 'IDR')}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#731331',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">
                        {remaining > 0
                          ? `Kurang ${formatCurrency(remaining, 'IDR')}`
                          : 'Target Berhasil Tercapai! 🎉'}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Deposit CTA */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {goal.contributions?.length || 0} kali setoran
                  </span>
                  <button
                    onClick={() => {
                      setDepositGoal(goal);
                      setDepositAmountStr('');
                      setDepositNote('');
                      setDepositWalletId(wallets[0]?.id || '');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Setor Tabungan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {tab === 'ongoing' ? 'Belum Ada Target Berjalan' : 'Belum Ada Target yang Selesai'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mulai tetapkan impian finansial Anda sekarang untuk mengukur kemajuan tabungan.
            </p>
          </div>
          <button
            onClick={openAddGoalModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs transition-colors"
          >
            + Buat Target Baru
          </button>
        </div>
      )}

      {/* Goal Add / Edit Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Target Impian' : 'Buat Target Impian Baru'}
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Target Tabungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dana Darurat, Liburan ke Jepang, Mobil Baru..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nominal Target (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    placeholder="Contoh: 10000000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Saldo Awal Tabungan (Rp)
                  </label>
                  <input
                    type="text"
                    value={initialDepositStr}
                    onChange={(e) => setInitialDepositStr(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Tanggal Tercapai
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Kartu
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
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
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
                      {renderIcon(ic.id, 'w-4 h-4')}
                      <span>{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan / Motivasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan motivasi atau rincian alokasi tabungan..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
                >
                  {editingGoal ? 'Simpan Perubahan' : 'Buat Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {currentDepositTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Setor ke: {currentDepositTarget.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {formatCurrency(currentDepositTarget.targetAmount, 'IDR')}
                </p>
              </div>
              <button
                onClick={() => {
                  if (onCloseDepositModal) onCloseDepositModal();
                  setDepositGoal(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
              {depositError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nominal Setoran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 text-lg font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331] tabular-nums"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ambil dari Dompet (Opsional)
                </label>
                <select
                  value={depositWalletId}
                  onChange={(e) => setDepositWalletId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                >
                  <option value="">Jangan potong dompet (Hanya catat celengan)</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatCurrency(walletBalances[w.id] || 0, 'IDR')})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Jika dipilih, otomatis membuat transaksi pengeluaran tabungan dari dompet terkait.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Setoran (Opsional)
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Contoh: Sisa uang belanja, alokasi bonus..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#731331]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseDepositModal) onCloseDepositModal();
                    setDepositGoal(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#731331] hover:bg-[#560e25] rounded-xl shadow-xs"
                >
                  Konfirmasi Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Target Tabungan?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Target impian <strong>"{goalToDelete.name}"</strong> akan dihapus beserta histori
              setoran di dalamnya.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setGoalToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await onDeleteSavingsGoal(goalToDelete.id);
                  setGoalToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
