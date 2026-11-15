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
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState<'welcome' | 'signup' | 'login'>('welcome');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [profileNameInput, setProfileNameInput] = useState('');

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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6"><div className="max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm"><h1 className="text-xl font-bold text-slate-900 dark:text-white">Koneksi database belum siap</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{finance.connectionError}</p><p className="mt-3 text-xs text-slate-500">Pastikan Environment Variables Vercel sudah diisi dan Supabase Auth configurado correctamente.</p><button onClick={() => finance.refresh()} className="mt-5 rounded-xl bg-[#731331] px-4 py-2 text-sm font-semibold text-white">Coba lagi</button></div></div>;
  }

  if (!finance.isAuthenticated) {
    const submitEmailAuth = async (event: React.FormEvent) => {
      event.preventDefault();
      setLoginError('');
      setLoginBusy(true);
      try {
        if (authMode === 'signup') {
          const result = await finance.registerWithEmail(authEmailInput, authPassword);
          if (!result.session) {
            setLoginError('Akun berhasil dibuat. Periksa email untuk konfirmasi, lalu login.');
            setAuthMode('login');
          } else {
            await finance.refresh();
          }
        } else {
          await finance.loginWithEmail(authEmailInput, authPassword);
        }
      } catch (error: any) {
        setLoginError(error?.message || 'Autentikasi gagal.');
      } finally {
        setLoginBusy(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#731331] dark:text-rose-300 text-2xl font-black">D</div>
          <h1 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white">Selamat datang di Dompetin</h1>
          <p className="mt-2 text-sm text-center text-slate-600 dark:text-slate-300">Catat keuanganmu, pahami alurnya, dan tumbuh lebih terarah.</p>
          {authMode === 'welcome' ? (
            <div className="mt-6 space-y-3">
              <button type="button" disabled={loginBusy} onClick={async () => { setLoginError(''); setLoginBusy(true); try { await finance.loginWithGoogle(); } catch (error: any) { setLoginError(error?.message || 'Gagal memulai login Google.'); setLoginBusy(false); } }} className="w-full rounded-xl bg-[#731331] px-4 py-3 font-semibold text-white hover:bg-[#560e25] disabled:opacity-60">{loginBusy ? 'Mengalihkan...' : 'Lanjutkan dengan Google'}</button>
              <button type="button" onClick={() => { setLoginError(''); setAuthMode('signup'); }} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Buat akun baru</button>
              <button type="button" onClick={() => { setLoginError(''); setAuthMode('login'); }} className="w-full px-4 py-2 text-sm font-semibold text-[#731331]">Sudah punya akun? Login</button>
            </div>
          ) : (
            <form onSubmit={submitEmailAuth} className="mt-6 space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{authMode === 'signup' ? 'Daftar dengan Email' : 'Login dengan Email'}</h2>
              <input required type="email" autoComplete="email" value={authEmailInput} onChange={e => setAuthEmailInput(e.target.value)} placeholder="Alamat email" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white" />
              <input required minLength={6} type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password (minimal 6 karakter)" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white" />
              <button disabled={loginBusy} className="w-full rounded-xl bg-[#731331] px-4 py-3 font-semibold text-white disabled:opacity-60">{loginBusy ? 'Memproses...' : authMode === 'signup' ? 'Daftar' : 'Login'}</button>
              <button type="button" onClick={() => { setLoginError(''); setAuthMode('welcome'); }} className="w-full py-2 text-sm text-slate-500">Kembali</button>
            </form>
          )}
          {loginError && <p className="mt-3 text-sm text-rose-600">{loginError}</p>}
        </div>
      </div>
    );
  }

  if (!finance.profileName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-5">
        <form onSubmit={async (event) => { event.preventDefault(); setLoginBusy(true); setLoginError(''); try { await finance.saveProfileName(profileNameInput); } catch (error: any) { setLoginError(error?.message || 'Gagal menyimpan nama.'); } finally { setLoginBusy(false); } }} className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Siapa nama kamu?</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Nama ini akan ditampilkan di akun Dompetin.</p>
          <input required value={profileNameInput} onChange={e => setProfileNameInput(e.target.value)} placeholder="Nama pengguna" className="mt-5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white" />
          <button disabled={loginBusy} className="mt-3 w-full rounded-xl bg-[#731331] px-4 py-3 font-semibold text-white disabled:opacity-60">{loginBusy ? 'Menyimpan...' : 'Lanjutkan'}</button>
          {loginError && <p className="mt-3 text-sm text-rose-600">{loginError}</p>}
        </form>
      </div>
    );
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
          authEmail={finance.authEmail}
          authProvider={finance.authProvider}
          profileName={finance.profileName}
          onLogout={finance.logout}
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
