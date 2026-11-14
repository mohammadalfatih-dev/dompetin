import {
  Wallet,
  Transaction,
  Category,
  Budget,
  DateFilterType,
  DateRange,
} from '../types/finance';

/**
 * Format number as Indonesian Rupiah or selected currency
 * Default: Rp1.500.000
 */
export function formatCurrency(
  amount: number,
  currency: 'IDR' | 'USD' | 'EUR' | 'SGD' = 'IDR',
  includeSymbol: boolean = true
): string {
  const isNegative = amount < 0;
  const absValue = Math.abs(amount);

  let formatted = '';

  if (currency === 'IDR') {
    // Indonesian format: 1.500.000
    const parts = Math.round(absValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    formatted = includeSymbol ? `Rp${parts}` : parts;
  } else if (currency === 'USD') {
    formatted = (includeSymbol ? '$' : '') + absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === 'EUR') {
    formatted = (includeSymbol ? '€' : '') + absValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === 'SGD') {
    formatted = (includeSymbol ? 'S$' : '') + absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parse string with Indonesian dot/comma formatting into number
 */
export function parseAmount(value: string): number {
  if (!value) return 0;
  // Strip Rp, spaces, and thousand-separators (dots or commas)
  const clean = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate accurate wallet balances:
 * Initial Balance + Income into wallet - Expenses from wallet - Transfers sent from wallet + Transfers received into wallet
 */
export function calculateWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize with wallet initial balances
  for (const wallet of wallets) {
    balances[wallet.id] = wallet.initialBalance || 0;
  }

  // Iterate over transactions in chronological order or simple accumulation
  for (const tx of transactions) {
    const amt = tx.amount || 0;

    if (tx.type === 'income') {
      if (balances[tx.fromWalletId] !== undefined) {
        balances[tx.fromWalletId] += amt;
      }
    } else if (tx.type === 'expense') {
      if (balances[tx.fromWalletId] !== undefined) {
        balances[tx.fromWalletId] -= amt;
      }
    } else if (tx.type === 'transfer') {
      // Outgoing from source wallet
      if (balances[tx.fromWalletId] !== undefined) {
        balances[tx.fromWalletId] -= amt;
      }
      // Incoming into destination wallet
      if (tx.toWalletId && balances[tx.toWalletId] !== undefined) {
        balances[tx.toWalletId] += amt;
      }
    }
  }

  return balances;
}

/**
 * Calculate financial totals (Total Income, Total Expense, Net Flow)
 * Crucial: Transfers between user's own wallets DO NOT count as Income or Expense!
 */
export function calculateTotals(transactions: Transaction[]): {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  transferVolume: number;
} {
  let totalIncome = 0;
  let totalExpense = 0;
  let transferVolume = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount || 0;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount || 0;
    } else if (tx.type === 'transfer') {
      transferVolume += tx.amount || 0;
    }
  }

  return {
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    transferVolume,
  };
}

/**
 * Helper to get date boundaries in YYYY-MM-DD
 */
export function getDateRangeForFilter(
  filterType: DateFilterType,
  customRange?: DateRange,
  now = new Date()
): DateRange {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (filterType === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (filterType === 'this_week') {
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
    return { startDate: startStr, endDate: endStr };
  }

  if (filterType === 'this_month') {
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (filterType === 'this_year') {
    return {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    };
  }

  if (filterType === 'custom' && customRange) {
    return customRange;
  }

  // 'all' or fallback
  return {
    startDate: '1970-01-01',
    endDate: '2099-12-31',
  };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  filterType: DateFilterType,
  customRange?: DateRange,
  now = new Date()
): Transaction[] {
  if (filterType === 'all') return transactions;

  const { startDate, endDate } = getDateRangeForFilter(filterType, customRange, now);
  return transactions.filter((tx) => {
    return tx.date >= startDate && tx.date <= endDate;
  });
}

/**
 * Group expenses or income by category
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense'
): {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}[] {
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  const totalsByCategory: Record<string, number> = {};
  let overallAmount = 0;

  for (const tx of transactions) {
    if (tx.type === type && tx.categoryId) {
      totalsByCategory[tx.categoryId] = (totalsByCategory[tx.categoryId] || 0) + tx.amount;
      overallAmount += tx.amount;
    }
  }

  const result = Object.entries(totalsByCategory).map(([catId, amount]) => {
    const cat = categoryMap.get(catId);
    return {
      categoryId: catId,
      categoryName: cat?.name || 'Lainnya',
      color: cat?.color || '#94a3b8',
      icon: cat?.icon || 'tag',
      amount,
      percentage: overallAmount > 0 ? (amount / overallAmount) * 100 : 0,
    };
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate budget status for given month
 */
export function calculateBudgetStatus(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  targetMonth: string // YYYY-MM
): {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isWarning: boolean;
}[] {
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  // Calculate expenses for target month by category
  const expensesByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.categoryId && tx.date.startsWith(targetMonth)) {
      expensesByCategory[tx.categoryId] = (expensesByCategory[tx.categoryId] || 0) + tx.amount;
    }
  }

  return budgets.map((b) => {
    const cat = categoryMap.get(b.categoryId);
    const spent = expensesByCategory[b.categoryId] || 0;
    const remaining = Math.max(0, b.monthlyLimit - spent);
    const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    const threshold = b.alertThreshold || 0.8; // 80%

    return {
      budgetId: b.id,
      categoryId: b.categoryId,
      categoryName: cat?.name || 'Kategori',
      color: cat?.color || '#731331',
      icon: cat?.icon || 'pie-chart',
      monthlyLimit: b.monthlyLimit,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > b.monthlyLimit,
      isWarning: percentage >= threshold * 100 && spent <= b.monthlyLimit,
    };
  });
}

/**
 * Generate monthly trend data for charts (last 6 months)
 */
export function generateMonthlyCashFlow(
  transactions: Transaction[],
  monthsCount = 6,
  referenceDate = new Date()
): {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}[] {
  const result: {
    monthKey: string;
    label: string;
    income: number;
    expense: number;
    net: number;
  }[] = [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    const label = `${monthNames[d.getMonth()]} ${String(y).slice(-2)}`;

    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.date.startsWith(key)) {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
      }
    }

    result.push({
      monthKey: key,
      label,
      income,
      expense,
      net: income - expense,
    });
  }

  return result;
}

/**
 * Indonesian formatted date string
 */
export function formatDateIndonesian(dateString: string, includeDayName = false): string {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return dateString;

  const date = new Date(y, m - 1, d);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const formatted = `${d} ${months[m - 1]} ${y}`;
  if (includeDayName) {
    return `${days[date.getDay()]}, ${formatted}`;
  }
  return formatted;
}
