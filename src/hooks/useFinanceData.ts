import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultCategories, generateUUID } from '../database/db';
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
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    [],
    []
  ) as Transaction[];
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], []) as Budget[];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), [], []) as SavingsGoal[];
  const settings = useLiveQuery(() => db.settings.get('current'), []) as AppSettings | undefined;

  // Real-time computed wallet balances
  const walletBalances = calculateWalletBalances(wallets, transactions);

  // Real-time computed financial totals
  const totals = calculateTotals(transactions);

  // Total balance across all non-archived wallets
  const totalBalance = wallets
    .filter((w) => !w.isArchived)
    .reduce((acc, w) => acc + (walletBalances[w.id] || 0), 0);

  // 1. Transaction Operations
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
    const newTx: Transaction = {
      id: generateUUID(),
      amount: data.amount,
      type: data.type,
      categoryId: data.type === 'transfer' ? undefined : data.categoryId,
      fromWalletId: data.fromWalletId,
      toWalletId: data.type === 'transfer' ? data.toWalletId : undefined,
      date: data.date,
      time: data.time || new Date().toTimeString().slice(0, 5),
      description: data.description.trim(),
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.transactions.add(newTx);
    cloudSync.triggerSync();
    return newTx;
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => {
    await db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cloudSync.triggerSync();
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    cloudSync.triggerSync();
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
    // Delete transactions associated with this wallet or reassign
    await db.transaction('rw', [db.wallets, db.transactions], async () => {
      await db.transactions
        .filter((tx) => tx.fromWalletId === id || tx.toWalletId === id)
        .delete();
      await db.wallets.delete(id);
    });
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
      contributions: data.currentAmount > 0 ? [
        {
          id: generateUUID(),
          amount: data.currentAmount,
          date: new Date().toISOString().slice(0, 10),
          note: 'Setoran awal',
        }
      ] : [],
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

  const addSavingsContribution = async (
    goalId: string,
    amount: number,
    note?: string,
    walletId?: string
  ) => {
    const goal = await db.savingsGoals.get(goalId);
    if (!goal) return;

    const newContrib = {
      id: generateUUID(),
      amount,
      date: new Date().toISOString().slice(0, 10),
      note,
      walletId,
    };

    const newCurrent = goal.currentAmount + amount;
    const isCompleted = newCurrent >= goal.targetAmount;

    // Optional: If walletId provided, record an expense or transfer
    if (walletId) {
      await db.transactions.add({
        id: generateUUID(),
        amount,
        type: 'expense',
        fromWalletId: walletId,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        description: `Setoran Tabungan: ${goal.name}`,
        notes: note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await db.savingsGoals.update(goalId, {
      currentAmount: newCurrent,
      isCompleted,
      contributions: [...(goal.contributions || []), newContrib],
      updatedAt: new Date().toISOString(),
    });

    cloudSync.triggerSync();
  };

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
