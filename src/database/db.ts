import Dexie, { Table } from 'dexie';
import {
  Wallet,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  AppSettings,
} from '../types/finance';

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

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
}

/**
 * Initial Indonesian Seed Data
 */
export async function seedInitialData(force = false) {
  const [walletCount, categoryCount] = await Promise.all([
    db.wallets.count(),
    db.categories.count(),
  ]);

  if (walletCount > 0 && categoryCount > 0 && !force) {
    return;
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${y}-${m}`;

  // 1. Wallets
  const defaultWallets: Wallet[] = [
    {
      id: 'w-bca',
      name: 'Bank BCA',
      type: 'bank',
      initialBalance: 12500000,
      accountNumber: '8820-412-990',
      color: '#0066AE',
      icon: 'Building2',
      createdAt: new Date(y, now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'w-mandiri',
      name: 'Bank Mandiri',
      type: 'bank',
      initialBalance: 8250000,
      accountNumber: '142-00-1928374-1',
      color: '#003876',
      icon: 'Landmark',
      createdAt: new Date(y, now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'w-gopay',
      name: 'GoPay',
      type: 'ewallet',
      initialBalance: 850000,
      accountNumber: '0812-3456-7890',
      color: '#00AED6',
      icon: 'Smartphone',
      createdAt: new Date(y, now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'w-ovo',
      name: 'OVO Cash',
      type: 'ewallet',
      initialBalance: 420000,
      accountNumber: '0812-3456-7890',
      color: '#4C3494',
      icon: 'Wallet',
      createdAt: new Date(y, now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'w-cash',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: 650000,
      color: '#16A34A',
      icon: 'Banknote',
      createdAt: new Date(y, now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 2. Categories
  const defaultCategories: Category[] = [
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

  // Helper date generators for current month
  const dayStr = (day: number) => {
    const validDay = Math.min(Math.max(1, day), 28);
    return `${y}-${m}-${String(validDay).padStart(2, '0')}`;
  };

  // 3. Transactions
  const defaultTransactions: Transaction[] = [
    // Income
    {
      id: 'tx-1',
      amount: 15500000,
      type: 'income',
      categoryId: 'cat-salary',
      fromWalletId: 'w-bca',
      date: dayStr(1),
      time: '09:00',
      description: 'Gaji Bulanan PT Digital Finansial',
      notes: 'Transfer payroll bulanan resmi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      amount: 3200000,
      type: 'income',
      categoryId: 'cat-freelance',
      fromWalletId: 'w-mandiri',
      date: dayStr(4),
      time: '14:30',
      description: 'Fee Desain UI Website Client',
      notes: 'Pembayaran termin 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      amount: 450000,
      type: 'income',
      categoryId: 'cat-investment',
      fromWalletId: 'w-bca',
      date: dayStr(8),
      time: '11:00',
      description: 'Dividen Reksadana Pasar Uang',
      notes: 'Return bulanan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Expenses
    {
      id: 'tx-4',
      amount: 850000,
      type: 'expense',
      categoryId: 'cat-bills',
      fromWalletId: 'w-bca',
      date: dayStr(2),
      time: '10:15',
      description: 'Listrik PLN & WiFi Indihome',
      notes: 'Tagihan rutin awal bulan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      amount: 450000,
      type: 'expense',
      categoryId: 'cat-shopping',
      fromWalletId: 'w-mandiri',
      date: dayStr(3),
      time: '18:40',
      description: 'Belanja Bulanan Supermarket',
      notes: 'Bahan masakan, susu, deterjen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      amount: 48000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-gopay',
      date: dayStr(5),
      time: '12:30',
      description: 'Makan Siang Nasi Padang Sederhana',
      notes: 'Rendang + es teh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      amount: 125000,
      type: 'expense',
      categoryId: 'cat-transport',
      fromWalletId: 'w-gopay',
      date: dayStr(6),
      time: '08:15',
      description: 'GrabCar ke Kantor Meeting',
      notes: 'Cuaca hujan deras',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      amount: 350000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-mandiri',
      date: dayStr(7),
      time: '20:00',
      description: 'Makan Malam Sushi Bersama Keluarga',
      notes: 'Weekend dinner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-9',
      amount: 180000,
      type: 'expense',
      categoryId: 'cat-entertainment',
      fromWalletId: 'w-ovo',
      date: dayStr(9),
      time: '19:30',
      description: 'Nonton Bioskop XXI Premiere',
      notes: 'Tiket nonton + popcorn',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-10',
      amount: 95000,
      type: 'expense',
      categoryId: 'cat-health',
      fromWalletId: 'w-cash',
      date: dayStr(10),
      time: '15:20',
      description: 'Vitamin C & Suplemen Apotek',
      notes: 'Jaga stamina musim hujan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-11',
      amount: 35000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-cash',
      date: dayStr(11),
      time: '08:00',
      description: 'Kopi Susu Gula Aren & Roti',
      notes: 'Sarapan pagi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Transfers
    {
      id: 'tx-12',
      amount: 500000,
      type: 'transfer',
      fromWalletId: 'w-bca',
      toWalletId: 'w-gopay',
      date: dayStr(3),
      time: '11:00',
      description: 'Top Up Saldo GoPay dari BCA',
      notes: 'Saldo operasional harian',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-13',
      amount: 300000,
      type: 'transfer',
      fromWalletId: 'w-mandiri',
      toWalletId: 'w-cash',
      date: dayStr(5),
      time: '16:00',
      description: 'Tarik Tunai ATM Mandiri',
      notes: 'Uang pegangan tunai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 4. Budgets
  const defaultBudgets: Budget[] = [
    {
      id: 'b-food',
      categoryId: 'cat-food',
      monthlyLimit: 2500000,
      month: currentMonthKey,
      alertThreshold: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b-shopping',
      categoryId: 'cat-shopping',
      monthlyLimit: 2000000,
      month: currentMonthKey,
      alertThreshold: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b-transport',
      categoryId: 'cat-transport',
      monthlyLimit: 1200000,
      month: currentMonthKey,
      alertThreshold: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b-bills',
      categoryId: 'cat-bills',
      monthlyLimit: 1500000,
      month: currentMonthKey,
      alertThreshold: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b-ent',
      categoryId: 'cat-entertainment',
      monthlyLimit: 800000,
      month: currentMonthKey,
      alertThreshold: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 5. Savings Goals
  const defaultSavingsGoals: SavingsGoal[] = [
    {
      id: 'sg-emergency',
      name: 'Dana Darurat (6 Bulan)',
      targetAmount: 30000000,
      currentAmount: 18500000,
      targetDate: `${y + 1}-12-31`,
      color: '#731331',
      icon: 'ShieldCheck',
      notes: 'Dana aman untuk antisipasi kebutuhan medis & mendadak',
      isCompleted: false,
      contributions: [
        { id: 'c-1', amount: 5000000, date: `${y}-09-01`, note: 'Setoran rutin' },
        { id: 'c-2', amount: 5000000, date: `${y}-10-01`, note: 'Setoran rutin' },
        { id: 'c-3', amount: 8500000, date: `${y}-11-01`, note: 'Alokasi bonus proyek' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sg-holiday',
      name: 'Liburan Akhir Tahun ke Bali',
      targetAmount: 7500000,
      currentAmount: 5200000,
      targetDate: `${y}-12-25`,
      color: '#EA580C',
      icon: 'Palmtree',
      notes: 'Tiket pesawat, resort di Seminyak, & sewa motor',
      isCompleted: false,
      contributions: [
        { id: 'c-4', amount: 2000000, date: `${y}-09-15`, note: 'Cicilan pertama' },
        { id: 'c-5', amount: 3200000, date: `${y}-10-20`, note: 'Cicilan kedua' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sg-laptop',
      name: 'Upgrade Laptop Kerja',
      targetAmount: 22000000,
      currentAmount: 14500000,
      targetDate: `${y + 1}-05-01`,
      color: '#0284C7',
      icon: 'Laptop',
      notes: 'Apple MacBook Pro M-series untuk produktivitas coding',
      isCompleted: false,
      contributions: [
        { id: 'c-6', amount: 14500000, date: `${y}-10-10`, note: 'Tabungan awal' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 6. Settings
  const existingSettings = await db.settings.get('current');
  const defaultSettings: AppSettings = existingSettings || {
    id: 'current',
    theme: 'light',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    deviceId: generateUUID(),
    cloudSyncEnabled: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
    lastSyncedAt: new Date().toISOString(),
  };

  await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.budgets, db.savingsGoals, db.settings], async () => {
    if (force) {
      await db.wallets.clear();
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.savingsGoals.clear();
    }
    await db.wallets.bulkPut(defaultWallets);
    await db.categories.bulkPut(defaultCategories);
    await db.transactions.bulkPut(defaultTransactions);
    await db.budgets.bulkPut(defaultBudgets);
    await db.savingsGoals.bulkPut(defaultSavingsGoals);
    await db.settings.put(defaultSettings);
  });
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
    if (!parsed.data || !parsed.data.wallets) {
      throw new Error('Format file backup Dompetin tidak valid.');
    }

    const { wallets, categories, transactions, budgets, savingsGoals, settings } = parsed.data;

    await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.budgets, db.savingsGoals, db.settings], async () => {
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
      if (settings) await db.settings.put(settings);
    });

    return true;
  } catch (err) {
    console.error('Error importing Dompetin backup:', err);
    throw err;
  }
}
