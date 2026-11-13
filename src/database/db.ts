import Dexie, { Table } from 'dexie';
import {
  Wallet,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  AppSettings,
} from '../types/finance';
import { LEGACY_DEMO_IDS } from '../utils/finance';

export class DompetinDatabase extends Dexie {
  wallets!: Table<Wallet, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('DompetinDB');
    this.version(1).stores({
      wallets: 'id, name, type, isArchived, createdAt',
      categories: 'id, name, type, isSystem',
      transactions: 'id, amount, type, categoryId, fromWalletId, toWalletId, date, createdAt',
      budgets: 'id, categoryId, month',
      savingsGoals: 'id, name, isCompleted, targetDate',
      settings: 'id',
    });
  }
}

export const db = new DompetinDatabase();

export const CLEAN_STATE_STORAGE_KEY = 'dompetin_clean_state_v1';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
}

/**
 * Default Built-in Transaction Categories (No balances or transactions created)
 */
export const defaultCategories: Category[] = [
  // Expense Categories
  { id: 'cat-food', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#EA580C', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#0284C7', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-shopping', name: 'Belanja & Belanjaan', type: 'expense', icon: 'ShoppingBag', color: '#8B5CF6', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-bills', name: 'Tagihan & Utilitas', type: 'expense', icon: 'Receipt', color: '#DC2626', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-entertainment', name: 'Hiburan & Hobi', type: 'expense', icon: 'Gamepad2', color: '#EC4899', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-health', name: 'Kesehatan & Medis', type: 'expense', icon: 'HeartPulse', color: '#10B981', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-education', name: 'Pendidikan & Kursus', type: 'expense', icon: 'GraduationCap', color: '#F59E0B', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-other-exp', name: 'Pengeluaran Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', isSystem: true, createdAt: '2026-01-01' },
  // Income Categories
  { id: 'cat-salary', name: 'Gaji Pokok Bulanan', type: 'income', icon: 'Briefcase', color: '#16A34A', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-freelance', name: 'Freelance & Side Project', type: 'income', icon: 'Laptop', color: '#06B6D4', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-business', name: 'Bisnis & Penjualan', type: 'income', icon: 'Store', color: '#F97316', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-investment', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#84CC16', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-allowance', name: 'Tunjangan & Bonus', type: 'income', icon: 'Gift', color: '#A855F7', isSystem: true, createdAt: '2026-01-01' },
  { id: 'cat-other-inc', name: 'Pemasukan Lainnya', type: 'income', icon: 'PlusCircle', color: '#64748B', isSystem: true, createdAt: '2026-01-01' },
];

/**
 * Initialize Database in Clean State (Zero State):
 * - Never seeds dummy wallets, transactions, budgets, or savings goals.
 * - Keeps default categories available for categorizing user transactions.
 * - Performs a one-time cleanup of any legacy app-generated demo records while preserving real user data.
 */
export async function initializeDatabase(): Promise<void> {
  const [existingSettings, categoryCount, walletCount, txCount, budgetCount, goalCount] =
    await Promise.all([
      db.settings.get('current'),
      db.categories.count(),
      db.wallets.count(),
      db.transactions.count(),
      db.budgets.count(),
      db.savingsGoals.count(),
    ]);

  const hasLocalMigrationFlag =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(CLEAN_STATE_STORAGE_KEY) === 'true';

  const isMigrated = Boolean(existingSettings?.cleanStateMigrated || hasLocalMigrationFlag);
  const isDatabaseCompletelyEmpty =
    walletCount === 0 && txCount === 0 && budgetCount === 0 && goalCount === 0;

  const baseSettings: AppSettings = existingSettings
    ? { ...existingSettings, cleanStateMigrated: true }
    : {
        id: 'current',
        theme: 'light',
        currency: 'IDR',
        dateFormat: 'DD/MM/YYYY',
        deviceId: generateUUID(),
        cloudSyncEnabled: false,
        supabaseUrl: '',
        supabaseAnonKey: '',
        lastSyncedAt: undefined,
        cleanStateMigrated: true,
      };

  await db.transaction(
    'rw',
    [db.wallets, db.categories, db.transactions, db.budgets, db.savingsGoals, db.settings],
    async () => {
      if (!isMigrated) {
        // Remove only legacy demo records seeded by earlier app versions; user-created records remain untouched
        await Promise.all([
          db.wallets.bulkDelete([...LEGACY_DEMO_IDS.wallets]),
          db.transactions.bulkDelete([...LEGACY_DEMO_IDS.transactions]),
          db.budgets.bulkDelete([...LEGACY_DEMO_IDS.budgets]),
          db.savingsGoals.bulkDelete([...LEGACY_DEMO_IDS.savingsGoals]),
        ]);
      }

      if (categoryCount === 0 && (!isMigrated || isDatabaseCompletelyEmpty)) {
        await db.categories.bulkPut(defaultCategories);
      }

      await db.settings.put(baseSettings);
    }
  );

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CLEAN_STATE_STORAGE_KEY, 'true');
  }
}

/**
 * Backup / Export all data to JSON
 */
export async function exportDatabaseBackup(): Promise<string> {
  const wallets = await db.wallets.toArray();
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();
  const budgets = await db.budgets.toArray();
  const savingsGoals = await db.savingsGoals.toArray();
  const settings = await db.settings.get('current');

  const payload = {
    appName: 'Dompetin',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data: {
      wallets,
      categories,
      transactions,
      budgets,
      savingsGoals,
      settings,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Import and Restore data from JSON
 */
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !Array.isArray(parsed.data.wallets)) {
      throw new Error('Format file backup Dompetin tidak valid.');
    }

    const { wallets, categories, transactions, budgets, savingsGoals, settings } = parsed.data;

    await db.transaction(
      'rw',
      [db.wallets, db.categories, db.transactions, db.budgets, db.savingsGoals, db.settings],
      async () => {
        await db.wallets.clear();
        await db.categories.clear();
        await db.transactions.clear();
        await db.budgets.clear();
        await db.savingsGoals.clear();

        if (wallets?.length) await db.wallets.bulkPut(wallets);
        if (categories?.length) await db.categories.bulkPut(categories);
        if (transactions?.length) await db.transactions.bulkPut(transactions);
        if (budgets?.length) await db.budgets.bulkPut(budgets);
        if (savingsGoals?.length) await db.savingsGoals.bulkPut(savingsGoals);
        if (settings) {
          await db.settings.put({ ...settings, cleanStateMigrated: true });
        }
      }
    );

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CLEAN_STATE_STORAGE_KEY, 'true');
    }

    return true;
  } catch (err) {
    console.error('Error importing Dompetin backup:', err);
    throw err;
  }
}
