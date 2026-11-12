export type TransactionType = 'income' | 'expense' | 'transfer';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'savings' | 'credit' | 'other';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance?: number;
  accountNumber?: string;
  color: string;
  icon: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  fromWalletId: string;
  toWalletId?: string; // used for transfer
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  alertThreshold?: number; // e.g. 0.8 for 80%
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
  walletId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  color: string;
  icon: string;
  notes?: string;
  isCompleted?: boolean;
  contributions: SavingsContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string; // 'current'
  theme: 'light' | 'dark' | 'system';
  currency: 'IDR' | 'USD' | 'EUR' | 'SGD';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  deviceId: string;
  cloudSyncEnabled: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  lastSyncedAt?: string;
}

export type DateFilterType = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
