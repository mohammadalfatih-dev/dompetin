import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  parseAmount,
  calculateWalletBalances,
  calculateTotals,
  calculateCategoryBreakdown,
  calculateBudgetStatus,
  generateMonthlyCashFlow,
  filterTransactionsByDateRange,
  LEGACY_DEMO_IDS,
  isLegacyDemoId,
} from './finance';
import { Wallet, Transaction, Category, Budget } from '../types/finance';

test('formatCurrency formats Indonesian Rupiah with dot separators correctly', () => {
  assert.equal(formatCurrency(1500000, 'IDR'), 'Rp1.500.000');
  assert.equal(formatCurrency(0, 'IDR'), 'Rp0');
  assert.equal(formatCurrency(25000, 'IDR'), 'Rp25.000');
  assert.equal(formatCurrency(-50000, 'IDR'), '-Rp50.000');
});

test('parseAmount correctly handles Indonesian currency strings', () => {
  assert.equal(parseAmount('Rp1.500.000'), 1500000);
  assert.equal(parseAmount('250.000'), 250000);
  assert.equal(parseAmount('Rp 75,000'), 75000);
  assert.equal(parseAmount(''), 0);
});

test('calculateWalletBalances updates balances and transfers without leaking into income/expense', () => {
  const wallets: Wallet[] = [
    {
      id: 'w-bca',
      name: 'Bank BCA',
      type: 'bank',
      initialBalance: 5000000,
      color: '#0066AE',
      icon: 'building',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'w-gopay',
      name: 'GoPay',
      type: 'ewallet',
      initialBalance: 200000,
      color: '#00AED6',
      icon: 'smartphone',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const transactions: Transaction[] = [
    // Income into BCA
    {
      id: 't-1',
      amount: 10000000,
      type: 'income',
      fromWalletId: 'w-bca',
      date: '2026-11-01',
      description: 'Gaji Bulanan',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    },
    // Expense from GoPay
    {
      id: 't-2',
      amount: 50000,
      type: 'expense',
      fromWalletId: 'w-gopay',
      date: '2026-11-02',
      description: 'Makan Siang',
      createdAt: '2026-11-02',
      updatedAt: '2026-11-02',
    },
    // Transfer 1.000.000 from BCA to GoPay
    {
      id: 't-3',
      amount: 1000000,
      type: 'transfer',
      fromWalletId: 'w-bca',
      toWalletId: 'w-gopay',
      date: '2026-11-03',
      description: 'Topup GoPay',
      createdAt: '2026-11-03',
      updatedAt: '2026-11-03',
    },
  ];

  const balances = calculateWalletBalances(wallets, transactions);
  // BCA: 5.000.000 + 10.000.000 - 1.000.000 = 14.000.000
  assert.equal(balances['w-bca'], 14000000);
  // GoPay: 200.000 - 50.000 + 1.000.000 = 1.150.000
  assert.equal(balances['w-gopay'], 1150000);

  const totals = calculateTotals(transactions);
  // Total Income should ONLY be 10.000.000 (transfer is excluded!)
  assert.equal(totals.totalIncome, 10000000);
  // Total Expense should ONLY be 50.000 (transfer is excluded!)
  assert.equal(totals.totalExpense, 50000);
  // Net Flow = 10.000.000 - 50.000 = 9.950.000
  assert.equal(totals.netFlow, 9950000);
  assert.equal(totals.transferVolume, 1000000);
});

test('calculateBudgetStatus properly identifies over budget and warning states', () => {
  const categories: Category[] = [
    {
      id: 'cat-food',
      name: 'Makanan & Minuman',
      type: 'expense',
      icon: 'utensils',
      color: '#ea580c',
      createdAt: '2026-01-01',
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'b-1',
      categoryId: 'cat-food',
      monthlyLimit: 1000000,
      month: '2026-11',
      alertThreshold: 0.8,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    },
  ];

  // Case 1: Spent 500.000 (50%) -> normal
  const tx1: Transaction[] = [
    {
      id: 't-1',
      amount: 500000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-1',
      date: '2026-11-05',
      description: 'Makan',
      createdAt: '2026-11-05',
      updatedAt: '2026-11-05',
    },
  ];
  let status = calculateBudgetStatus(budgets, tx1, categories, '2026-11');
  assert.equal(status[0].spent, 500000);
  assert.equal(status[0].remaining, 500000);
  assert.equal(status[0].isOverBudget, false);
  assert.equal(status[0].isWarning, false);

  // Case 2: Spent 850.000 (85%) -> warning triggered
  const tx2: Transaction[] = [
    ...tx1,
    {
      id: 't-2',
      amount: 350000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-1',
      date: '2026-11-10',
      description: 'Restoran',
      createdAt: '2026-11-10',
      updatedAt: '2026-11-10',
    },
  ];
  status = calculateBudgetStatus(budgets, tx2, categories, '2026-11');
  assert.equal(status[0].spent, 850000);
  assert.equal(status[0].remaining, 150000);
  assert.equal(status[0].isOverBudget, false);
  assert.equal(status[0].isWarning, true);

  // Case 3: Spent 1.200.000 (120%) -> over budget
  const tx3: Transaction[] = [
    ...tx2,
    {
      id: 't-3',
      amount: 350000,
      type: 'expense',
      categoryId: 'cat-food',
      fromWalletId: 'w-1',
      date: '2026-11-12',
      description: 'Traktir',
      createdAt: '2026-11-12',
      updatedAt: '2026-11-12',
    },
  ];
  status = calculateBudgetStatus(budgets, tx3, categories, '2026-11');
  assert.equal(status[0].spent, 1200000);
  assert.equal(status[0].remaining, 0);
  assert.equal(status[0].isOverBudget, true);
});

test('filterTransactionsByDateRange filters transactions accurately', () => {
  const txs: Transaction[] = [
    {
      id: '1',
      amount: 10000,
      type: 'expense',
      fromWalletId: 'w',
      date: '2026-11-12',
      description: 'Today',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      amount: 20000,
      type: 'expense',
      fromWalletId: 'w',
      date: '2026-10-15',
      description: 'Last month',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const today = new Date('2026-11-12T10:00:00Z');
  const filteredToday = filterTransactionsByDateRange(txs, 'today', undefined, today);
  assert.equal(filteredToday.length, 1);
  assert.equal(filteredToday[0].id, '1');

  const filteredMonth = filterTransactionsByDateRange(txs, 'this_month', undefined, today);
  assert.equal(filteredMonth.length, 1);
  assert.equal(filteredMonth[0].id, '1');
});

test('zero-state calculations return clean zeros and empty breakdowns even with categories loaded', () => {
  const categories: Category[] = [
    {
      id: 'cat-food',
      name: 'Makanan & Minuman',
      type: 'expense',
      icon: 'Utensils',
      color: '#EA580C',
      isSystem: true,
      createdAt: '2026-01-01',
    },
  ];

  assert.deepEqual(calculateWalletBalances([], []), {});
  assert.deepEqual(calculateTotals([]), {
    totalIncome: 0,
    totalExpense: 0,
    netFlow: 0,
    transferVolume: 0,
  });
  assert.deepEqual(calculateCategoryBreakdown([], categories, 'expense'), []);
  assert.deepEqual(calculateCategoryBreakdown([], categories, 'income'), []);
  assert.deepEqual(calculateBudgetStatus([], [], categories, '2026-11'), []);

  const trend = generateMonthlyCashFlow([], 6, new Date('2026-11-12T10:00:00Z'));
  assert.equal(trend.length, 6);
  assert.equal(
    trend.some((m) => m.income !== 0 || m.expense !== 0 || m.net !== 0),
    false
  );
});

test('isLegacyDemoId identifies only known legacy demo IDs and preserves user UUIDs', () => {
  assert.equal(LEGACY_DEMO_IDS.wallets.length, 5);
  assert.equal(isLegacyDemoId('wallets', 'w-bca'), true);
  assert.equal(isLegacyDemoId('transactions', 'tx-1'), true);
  assert.equal(isLegacyDemoId('budgets', 'b-food'), true);
  assert.equal(isLegacyDemoId('savingsGoals', 'sg-emergency'), true);

  assert.equal(isLegacyDemoId('wallets', 'user-wallet-uuid-123'), false);
  assert.equal(isLegacyDemoId('transactions', 'user-tx-uuid-456'), false);
  assert.equal(isLegacyDemoId('budgets', 'user-budget-uuid-789'), false);
  assert.equal(isLegacyDemoId('savingsGoals', 'user-goal-uuid-012'), false);
});

