import React, { useState, useEffect } from 'react';
import { useFinanceData } from './hooks/useFinanceData';
import { AppLayout } from './layouts/AppLayout';
import { DashboardView } from './features/dashboard/DashboardView';
import { TransactionsView } from './features/transactions/TransactionsView';
import { WalletsView } from './features/wallets/WalletsView';
import { BudgetsView } from './features/budgets/BudgetsView';
import { SavingsView } from './features/savings/SavingsView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';
import { TransactionModal } from './features/transactions/TransactionModal';
import { Transaction, SavingsGoal } from './types/finance';

export default function App() {
  const finance = useFinanceData();

  // Navigation tab state: 'dashboard' | 'transactions' | 'wallets' | 'budgets' | 'savings' | 'reports' | 'settings'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Transaction Modal state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Detail Modal shortcut state
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // Savings Deposit Modal shortcut state
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dompetin_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dompetin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dompetin_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync with DB settings theme when loaded
  useEffect(() => {
    if (finance.settings?.theme) {
      if (finance.settings.theme === 'dark' && !isDarkMode) {
        setIsDarkMode(true);
      } else if (finance.settings.theme === 'light' && isDarkMode) {
        setIsDarkMode(false);
      }
    }
  }, [finance.settings?.theme]);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    finance.updateSettings({ theme: next ? 'dark' : 'light' });
  };

  const handleOpenAddTransaction = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (data: any) => {
    if (editingTransaction) {
      await finance.updateTransaction(editingTransaction.id, data);
    } else {
      await finance.addTransaction(data);
    }
  };

  if (finance.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">Menghubungkan ke database Dompetin...</div>;
  }

  if (finance.connectionError) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6"><div className="max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm"><h1 className="text-xl font-bold text-slate-900 dark:text-white">Koneksi database belum siap</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{finance.connectionError}</p><p className="mt-3 text-xs text-slate-500">Pastikan Environment Variables Vercel sudah diisi dan Anonymous Sign-Ins aktif di Supabase Auth.</p><button onClick={() => finance.refresh()} className="mt-5 rounded-xl bg-[#731331] px-4 py-2 text-sm font-semibold text-white">Coba lagi</button></div></div>;
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onOpenAddTransaction={handleOpenAddTransaction}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
      totalBalance={finance.totalBalance}
    >
      {/* 1. Dashboard Tab */}
      {currentTab === 'dashboard' && (
        <DashboardView
          wallets={finance.wallets}
          categories={finance.categories}
          transactions={finance.transactions}
          budgets={finance.budgets}
          savingsGoals={finance.savingsGoals}
          walletBalances={finance.walletBalances}
          totalBalance={finance.totalBalance}
          onOpenAddTransaction={handleOpenAddTransaction}
          onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
          onNavigateTab={setCurrentTab}
          onOpenDepositSavings={(goal) => {
            setActiveDepositGoal(goal);
            setCurrentTab('savings');
          }}
        />
      )}

      {/* 2. Transactions Tab */}
      {currentTab === 'transactions' && (
        <TransactionsView
          transactions={finance.transactions}
          wallets={finance.wallets}
          categories={finance.categories}
          walletBalances={finance.walletBalances}
          onOpenAddTransaction={handleOpenAddTransaction}
          onEditTransaction={handleOpenEditTransaction}
          onDeleteTransaction={finance.deleteTransaction}
          selectedTxForDetail={selectedTxDetail}
          onCloseDetailModal={() => setSelectedTxDetail(null)}
          onOpenDetailModal={(tx) => setSelectedTxDetail(tx)}
        />
      )}

      {/* 3. Wallets Tab */}
      {currentTab === 'wallets' && (
        <WalletsView
          wallets={finance.wallets}
          transactions={finance.transactions}
          walletBalances={finance.walletBalances}
          onAddWallet={finance.addWallet}
          onUpdateWallet={finance.updateWallet}
          onDeleteWallet={finance.deleteWallet}
          onOpenTransferModal={() => {
            setEditingTransaction(null);
            setIsTxModalOpen(true);
          }}
        />
      )}

      {/* 4. Budgets Tab */}
      {currentTab === 'budgets' && (
        <BudgetsView
          budgets={finance.budgets}
          categories={finance.categories}
          transactions={finance.transactions}
          onAddBudget={finance.addBudget}
          onUpdateBudget={finance.updateBudget}
          onDeleteBudget={finance.deleteBudget}
        />
      )}

      {/* 5. Savings Goals Tab */}
      {currentTab === 'savings' && (
        <SavingsView
          savingsGoals={finance.savingsGoals}
          wallets={finance.wallets}
          walletBalances={finance.walletBalances}
          onAddSavingsGoal={finance.addSavingsGoal}
          onUpdateSavingsGoal={finance.updateSavingsGoal}
          onDeleteSavingsGoal={finance.deleteSavingsGoal}
          onAddContribution={finance.addSavingsContribution}
          activeDepositGoal={activeDepositGoal}
          onCloseDepositModal={() => setActiveDepositGoal(null)}
        />
      )}

      {/* 6. Reports Tab */}
      {currentTab === 'reports' && (
        <ReportsView
          transactions={finance.transactions}
          wallets={finance.wallets}
          categories={finance.categories}
          walletBalances={finance.walletBalances}
        />
      )}

      {/* 7. Settings Tab */}
      {currentTab === 'settings' && (
        <SettingsView
          settings={finance.settings}
          categories={finance.categories}
          onUpdateSettings={finance.updateSettings}
          onAddCategory={finance.addCategory}
          onUpdateCategory={finance.updateCategory}
          onDeleteCategory={finance.deleteCategory}
          onClearAllData={finance.clearAllData}
        />
      )}

      {/* Global Transaction Modal (Add / Edit / Transfer) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        wallets={finance.wallets}
        categories={finance.categories}
        walletBalances={finance.walletBalances}
      />
    </AppLayout>
  );
}
