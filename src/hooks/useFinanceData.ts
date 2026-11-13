import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultCategories, generateUUID } from '../database/db';
import { supabase } from '../lib/supabase';
import {
  Wallet,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  AppSettings,
  TransactionType,
} from '../types/finance';
import { calculateWalletBalances, calculateTotals } from '../utils/finance';
import { cloudSync } from '../services/cloudSync';

export function useFinanceData() {
  const wallets = useLiveQuery(() => db.wallets.toArray(), [], []) as Wallet[];
  const categories = useLiveQuery(() => db.categories.toArray(), [], []) as Category[];
  
  // State transaksi langsung dari Supabase (Tabel: dompetin)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], []) as Budget[];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), [], []) as SavingsGoal[];
  const settings = useLiveQuery(() => db.settings.get('current'), []) as AppSettings | undefined;

  // Fungsi ambil data transaksi dari Supabase (tabel: dompetin)
  const fetchSupabaseTransactions = async () => {
    const { data, error } = await supabase
      .from('dompetin')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil transaksi dari Supabase:', error);
    } else if (data) {
      const mapped: Transaction[] = data.map((item: any) => ({
        id: item.id || generateUUID(),
        amount: Number(item.jumlah) || 0,
        type: (item.tipe as TransactionType) || 'expense',
        categoryId: 'cat-other-exp',
        fromWalletId: 'default',
        date: item.created_at ? item.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: '00:00',
        description: item.keterangan || '',
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.created_at || new Date().toISOString(),
      }));
      setTransactions(mapped);
    }
  };

  useEffect(() => {
    fetchSupabaseTransactions();
  }, []);

  // Real-time computed wallet balances
  const walletBalances = calculateWalletBalances(wallets, transactions);

  // Real-time computed financial totals
  const totals = calculateTotals(transactions);

  // Total balance across all non-archived wallets
  const totalBalance = wallets
    .filter((w) => !w.isArchived)
    .reduce((acc, w) => acc + (walletBalances[w.id] || 0), 0);

  // 1. Transaction Operations (Connected to Supabase Table: dompetin)
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
    const createdAt = new Date().toISOString();
    
    const { error } = await supabase.from('dompetin').insert([
      {
        keterangan: data.description.trim(),
        jumlah: data.amount,
        tipe: data.type,
        created_at: createdAt,
      },
    ]);

    if (error) {
      console.error('Gagal menyimpan transaksi ke Supabase:', error);
      throw error;
    }

    await fetchSupabaseTransactions();
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => {
    const payload: any = {};
    if (updates.description !== undefined) payload.keterangan = updates.description;
    if (updates.amount !== undefined) payload.jumlah = updates.amount;
    if (updates.type !== undefined) payload.tipe = updates.type;

    if (Object.keys(payload).length > 0) {
      await supabase.from('dompetin').update(payload).eq('id', id);
    }
    await fetchSupabaseTransactions();
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from('dompetin').delete().eq('id', id);
    await fetchSupabaseTransactions();
  };

  // 2. Wallet Operations
  const addWallet = async (data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newWallet: Wallet = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.wallets.add(newWallet);
    cloudSync.triggerSync();
    return newWallet;
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    await db.wallets.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cloudSync.triggerSync();
  };

  const deleteWallet = async (id: string) => {
    await db.wallets.delete(id);
    cloudSync.triggerSync();
  };

  // 3. Category Operations
  const addCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
    const newCat: Category = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.categories.add(newCat);
    cloudSync.triggerSync();
    return newCat;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await db.categories.update(id, updates);
    cloudSync.triggerSync();
  };

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id);
    cloudSync.triggerSync();
  };

  // 4. Budget Operations
  const addBudget = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.budgets.add(newBudget);
    cloudSync.triggerSync();
    return newBudget;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    await db.budgets.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cloudSync.triggerSync();
  };

  const deleteBudget = async (id: string) => {
    await db.budgets.delete(id);
    cloudSync.triggerSync();
  };

  // 5. Savings Goal Operations
  const addSavingsGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>) => {
    const newGoal: SavingsGoal = {
      ...data,
      id: generateUUID(),
      contributions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.savingsGoals.add(newGoal);
    cloudSync.triggerSync();
    return newGoal;
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    await db.savingsGoals.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cloudSync.triggerSync();
  };

  const deleteSavingsGoal = async (id: string) => {
    await db.savingsGoals.delete(id);
    cloudSync.triggerSync();
  };

  const addSavingsContribution = async () => {};

  // 6. Settings Operations
  const updateSettings = async (updates: Partial<AppSettings>) => {
    await db.settings.update('current', updates);
  };

  const clearAllData = async () => {
    await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.budgets, db.savingsGoals], async () => {
      await db.wallets.clear();
      await db.categories.clear();
      await db.categories.bulkPut(defaultCategories);
      await db.transactions.clear();
      await db.budgets.clear();
      await db.savingsGoals.clear();
    });
  };

  return {
    wallets,
    categories,
    transactions,
    budgets,
    savingsGoals,
    settings,
    walletBalances,
    totals,
    totalBalance,
    // Operations
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
    clearAllData,
  };
}