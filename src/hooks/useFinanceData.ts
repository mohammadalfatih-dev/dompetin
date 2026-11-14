import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, ensureSupabaseUser, isSupabaseConfigured, linkGoogleAccount, signInWithGoogle, signOutDompetin } from '../lib/supabase';
import {
  Wallet, Category, Transaction, Budget, SavingsGoal, AppSettings, TransactionType,
} from '../types/finance';
import { calculateWalletBalances, calculateTotals } from '../utils/finance';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

const defaultSettings: AppSettings = {
  id: 'current',
  theme: 'light',
  currency: 'IDR',
  dateFormat: 'DD/MM/YYYY',
  deviceId: 'supabase-account',
  cloudSyncEnabled: true,
};

function mapWallet(row: any): Wallet {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'other',
    // Preserve the opening balance stored in Supabase.
    initialBalance: Number(row.initial_balance || 0),
    accountNumber: row.account_number || undefined,
    color: row.color || '#731331',
    icon: row.icon || 'Wallet',
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'expense',
    icon: row.icon || 'Tag',
    color: row.color || '#731331',
    isSystem: Boolean(row.is_system),
    createdAt: row.created_at,
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    amount: Number(row.amount || 0),
    type: row.type,
    categoryId: row.category_id || undefined,
    fromWalletId: row.from_wallet_id || '',
    toWalletId: row.to_wallet_id || undefined,
    date: row.transaction_date,
    time: row.transaction_time?.slice(0, 5) || undefined,
    description: row.description || '',
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    categoryId: row.category_id || '',
    monthlyLimit: Number(row.monthly_limit || 0),
    month: String(row.month || today()).slice(0, 7),
    alertThreshold: Number(row.alert_threshold ?? 80) / 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DEFAULT_CATEGORIES = [
  { name: 'Makanan', type: 'expense', icon: 'Utensils', color: '#F59E0B' },
  { name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Kendaraan', type: 'expense', icon: 'Car', color: '#3B82F6' },
  { name: 'Investasi', type: 'expense', icon: 'TrendingUp', color: '#10B981' },
  { name: 'Medis', type: 'expense', icon: 'HeartPulse', color: '#EF4444' },
  { name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6' },
  { name: 'Tagihan', type: 'expense', icon: 'Receipt', color: '#64748B' },
  { name: 'Lainnya', type: 'expense', icon: 'Wallet', color: '#731331' },
  { name: 'Gaji', type: 'income', icon: 'BriefcaseBusiness', color: '#10B981' },
  { name: 'Bonus', type: 'income', icon: 'Gift', color: '#F59E0B' },
  { name: 'Pendapatan Lain', type: 'income', icon: 'CircleDollarSign', color: '#3B82F6' },
] as const;

export function useFinanceData() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      return {
        ...defaultSettings,
        ...JSON.parse(localStorage.getItem('dompetin_settings') || '{}'),
      };
    } catch {
      return defaultSettings;
    }
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setConnectionError(
        'Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
      );
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // After an intentional logout, do not silently create a new anonymous account.
      if (!sessionData.session && localStorage.getItem('dompetin_explicit_logout') === 'true') {
        setIsAuthenticated(false);
        setAuthEmail(null);
        setIsGoogleLinked(false);
        setWallets([]); setCategories([]); setTransactions([]); setBudgets([]); setSavingsGoals([]);
        setConnectionError(null);
        return;
      }

      const user = await ensureSupabaseUser();
      localStorage.removeItem('dompetin_explicit_logout');
      setIsAuthenticated(true);
      setAuthEmail(user.email || null);
      setIsGoogleLinked((user.identities || []).some((identity) => identity.provider === 'google'));

      // Create starter categories for this signed-in user only when none exist.
      const { data: existingCategories, error: categoryCheckError } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (categoryCheckError) throw categoryCheckError;

      if (!existingCategories || existingCategories.length === 0) {
        const { error: insertCategoryError } = await supabase
          .from('categories')
          .insert(
            DEFAULT_CATEGORIES.map((category) => ({
              ...category,
              user_id: user.id,
              is_system: true,
            })),
          );

        if (insertCategoryError) throw insertCategoryError;
      }

      const [w, c, t, b, g, contributions] = await Promise.all([
        supabase.from('wallets').select('*').is('deleted_at', null).order('created_at'),
        supabase.from('categories').select('*').is('deleted_at', null).order('created_at'),
        supabase
          .from('transactions')
          .select('*')
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false }),
        supabase
          .from('budgets')
          .select('*')
          .is('deleted_at', null)
          .order('month', { ascending: false }),
        supabase.from('savings_goals').select('*').is('deleted_at', null).order('created_at'),
        supabase
          .from('savings_contributions')
          .select('*')
          .is('deleted_at', null)
          .order('contribution_date'),
      ]);

      for (const result of [w, c, t, b, g, contributions]) {
        if (result.error) throw result.error;
      }

      setWallets((w.data || []).map(mapWallet));
      setCategories((c.data || []).map(mapCategory));
      setTransactions((t.data || []).map(mapTransaction));
      setBudgets((b.data || []).map(mapBudget));

      const contributionRows = contributions.data || [];
      setSavingsGoals(
        (g.data || []).map((row: any) => {
          const goalContributions = contributionRows
            .filter((item: any) => item.goal_id === row.id)
            .map((item: any) => ({
              id: item.id,
              amount: Number(item.amount || 0),
              date: item.contribution_date,
              note: item.note || undefined,
            }));

          const currentAmount = goalContributions.reduce(
            (sum: number, item: any) => sum + item.amount,
            0,
          );

          return {
            id: row.id,
            name: row.name || '',
            targetAmount: Number(row.target_amount || 0),
            currentAmount,
            targetDate: row.target_date || '',
            color: row.color || '#731331',
            icon: row.icon || 'Target',
            notes: row.notes || undefined,
            isCompleted: currentAmount >= Number(row.target_amount || 0),
            contributions: goalContributions,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          } as SavingsGoal;
        }),
      );

      setConnectionError(null);
    } catch (error: any) {
      console.error('Supabase load error:', error);
      setConnectionError(error.message || 'Gagal memuat data Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connectGoogleAccount = async () => {
    await linkGoogleAccount();
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    if (!isGoogleLinked) {
      throw new Error('Hubungkan akun Google terlebih dahulu agar akun sementara dan datanya tidak hilang saat keluar.');
    }
    await signOutDompetin();
    setIsAuthenticated(false);
    setAuthEmail(null);
    setIsGoogleLinked(false);
    setWallets([]); setCategories([]); setTransactions([]); setBudgets([]); setSavingsGoals([]);
  };

  const walletBalances = useMemo(
    () => calculateWalletBalances(wallets, transactions),
    [wallets, transactions],
  );
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const totalBalance = wallets
    .filter((wallet) => !wallet.isArchived)
    .reduce((sum, wallet) => sum + (walletBalances[wallet.id] || 0), 0);

  const run = async (operation: () => Promise<void>) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    await operation();
    await refresh();
  };

  const addTransaction = async (data: {
    amount: number;
    type: TransactionType;
    categoryId?: string;
    fromWalletId: string;
    toWalletId?: string;
    date: string;
    time?: string;
    description: string;
    notes?: string;
  }) => {
    const { data: authData, error: authError } = await supabase!.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Sesi pengguna tidak tersedia.');

    const row = {
      user_id: authData.user.id,
      amount: data.amount,
      type: data.type,
      category_id: data.type === 'transfer' ? null : data.categoryId || null,
      from_wallet_id: data.fromWalletId,
      to_wallet_id: data.type === 'transfer' ? data.toWalletId || null : null,
      transaction_date: data.date,
      transaction_time: data.time || null,
      description: data.description.trim(),
      notes: data.notes?.trim() || null,
    };

    await run(async () => {
      const { error } = await supabase!.from('transactions').insert(row);
      if (error) throw error;
    });
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ) =>
    run(async () => {
      const row: any = { updated_at: now() };
      if (updates.amount !== undefined) row.amount = updates.amount;
      if (updates.type !== undefined) row.type = updates.type;
      if (updates.categoryId !== undefined) row.category_id = updates.categoryId || null;
      if (updates.fromWalletId !== undefined) row.from_wallet_id = updates.fromWalletId;
      if (updates.toWalletId !== undefined) row.to_wallet_id = updates.toWalletId || null;
      if (updates.date !== undefined) row.transaction_date = updates.date;
      if (updates.time !== undefined) row.transaction_time = updates.time || null;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.notes !== undefined) row.notes = updates.notes || null;

      const { error } = await supabase!.from('transactions').update(row).eq('id', id);
      if (error) throw error;
    });

  const deleteTransaction = async (id: string) =>
    run(async () => {
      const { error } = await supabase!.from('transactions').delete().eq('id', id);
      if (error) throw error;
    });

  const addWallet = async (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) =>
    run(async () => {
      const { error } = await supabase!.from('wallets').insert({
        name: data.name,
        type: data.type,
        initial_balance: data.initialBalance || 0,
        account_number: data.accountNumber || null,
        color: data.color,
        icon: data.icon,
        is_archived: Boolean(data.isArchived),
      });
      if (error) throw error;
    });

  const updateWallet = async (id: string, updates: Partial<Wallet>) =>
    run(async () => {
      const row: any = { updated_at: now() };
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.type !== undefined) row.type = updates.type;
      if (updates.initialBalance !== undefined) row.initial_balance = updates.initialBalance;
      if (updates.accountNumber !== undefined) row.account_number = updates.accountNumber || null;
      if (updates.color !== undefined) row.color = updates.color;
      if (updates.icon !== undefined) row.icon = updates.icon;
      if (updates.isArchived !== undefined) row.is_archived = updates.isArchived;

      const { error } = await supabase!.from('wallets').update(row).eq('id', id);
      if (error) throw error;
    });

  const deleteWallet = async (id: string) =>
    run(async () => {
      const { error: txError } = await supabase!
        .from('transactions')
        .delete()
        .or(`from_wallet_id.eq.${id},to_wallet_id.eq.${id}`);
      if (txError) throw txError;

      const { error } = await supabase!.from('wallets').delete().eq('id', id);
      if (error) throw error;
    });

  const addCategory = async (data: Omit<Category, 'id' | 'createdAt'>) =>
    run(async () => {
      const { error } = await supabase!.from('categories').insert({
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        is_system: Boolean(data.isSystem),
      });
      if (error) throw error;
    });

  const updateCategory = async (id: string, updates: Partial<Category>) =>
    run(async () => {
      const row: any = { updated_at: now() };
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.type !== undefined) row.type = updates.type;
      if (updates.icon !== undefined) row.icon = updates.icon;
      if (updates.color !== undefined) row.color = updates.color;

      const { error } = await supabase!.from('categories').update(row).eq('id', id);
      if (error) throw error;
    });

  const deleteCategory = async (id: string) =>
    run(async () => {
      const { error } = await supabase!.from('categories').delete().eq('id', id);
      if (error) throw error;
    });

  const addBudget = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) =>
    run(async () => {
      const { error } = await supabase!.from('budgets').insert({
        category_id: data.categoryId,
        monthly_limit: data.monthlyLimit,
        month: `${data.month}-01`,
        alert_threshold: Math.round((data.alertThreshold ?? 0.8) * 100),
      });
      if (error) throw error;
    });

  const updateBudget = async (id: string, updates: Partial<Budget>) =>
    run(async () => {
      const row: any = { updated_at: now() };
      if (updates.categoryId !== undefined) row.category_id = updates.categoryId;
      if (updates.monthlyLimit !== undefined) row.monthly_limit = updates.monthlyLimit;
      if (updates.month !== undefined) row.month = `${updates.month}-01`;
      if (updates.alertThreshold !== undefined) {
        row.alert_threshold = Math.round(updates.alertThreshold * 100);
      }

      const { error } = await supabase!.from('budgets').update(row).eq('id', id);
      if (error) throw error;
    });

  const deleteBudget = async (id: string) =>
    run(async () => {
      const { error } = await supabase!.from('budgets').delete().eq('id', id);
      if (error) throw error;
    });

  const addSavingsGoal = async (
    data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>,
  ) =>
    run(async () => {
      const { data: goal, error } = await supabase!
        .from('savings_goals')
        .insert({
          name: data.name,
          target_amount: data.targetAmount,
          target_date: data.targetDate || null,
          color: data.color,
          icon: data.icon,
          notes: data.notes || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      if (data.currentAmount > 0) {
        const { error: contributionError } = await supabase!
          .from('savings_contributions')
          .insert({
            goal_id: goal.id,
            amount: data.currentAmount,
            contribution_date: today(),
            note: 'Setoran awal',
          });
        if (contributionError) throw contributionError;
      }
    });

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) =>
    run(async () => {
      const row: any = { updated_at: now() };
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.targetAmount !== undefined) row.target_amount = updates.targetAmount;
      if (updates.targetDate !== undefined) row.target_date = updates.targetDate || null;
      if (updates.color !== undefined) row.color = updates.color;
      if (updates.icon !== undefined) row.icon = updates.icon;
      if (updates.notes !== undefined) row.notes = updates.notes || null;

      const { error } = await supabase!.from('savings_goals').update(row).eq('id', id);
      if (error) throw error;
    });

  const deleteSavingsGoal = async (id: string) =>
    run(async () => {
      const { error: contributionError } = await supabase!
        .from('savings_contributions')
        .delete()
        .eq('goal_id', id);
      if (contributionError) throw contributionError;

      const { error } = await supabase!.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    });

  const addSavingsContribution = async (
    goalId: string,
    amount: number,
    note?: string,
    walletId?: string,
  ) =>
    run(async () => {
      const { error } = await supabase!.from('savings_contributions').insert({
        goal_id: goalId,
        amount,
        contribution_date: today(),
        note: note || null,
      });
      if (error) throw error;

      if (walletId) {
        const goal = savingsGoals.find((item) => item.id === goalId);
        const { error: txError } = await supabase!.from('transactions').insert({
          amount,
          type: 'expense',
          from_wallet_id: walletId,
          transaction_date: today(),
          description: `Setoran Tabungan: ${goal?.name || 'Tabungan'}`,
          notes: note || null,
        });
        if (txError) throw txError;
      }
    });

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('dompetin_settings', JSON.stringify(next));
  };

  const resetToDemoData = async () => {
    throw new Error('Data demo dinonaktifkan. Dompetin menggunakan database Supabase kosong.');
  };

  const clearAllData = async () =>
    run(async () => {
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Sesi pengguna tidak tersedia.');

      for (const table of [
        'savings_contributions',
        'transactions',
        'budgets',
        'savings_goals',
        'categories',
        'wallets',
      ] as const) {
        const { error } = await supabase!
          .from(table)
          .delete()
          .eq('user_id', userData.user.id);
        if (error) throw error;
      }
    });

  return {
    wallets,
    categories,
    transactions,
    budgets,
    savingsGoals,
    settings,
    loading,
    connectionError,
    authEmail,
    isGoogleLinked,
    isAuthenticated,
    connectGoogleAccount,
    loginWithGoogle,
    logout,
    walletBalances,
    totals,
    totalBalance,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsContribution,
    updateSettings,
    resetToDemoData,
    clearAllData,
  };
}
