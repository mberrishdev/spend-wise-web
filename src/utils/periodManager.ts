
import { getCurrentPeriodRange, getMonthlyPeriod } from './monthlyPeriod';

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}

interface ArchivedPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  expenses: Expense[];
  totalSpent: number;
  archivedAt: string;
}

export const checkForNewPeriod = (): boolean => {
  const lastCheckedPeriod = localStorage.getItem("spendwise-last-period");
  const { start } = getCurrentPeriodRange();
  const currentPeriodKey = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
  
  if (!lastCheckedPeriod || lastCheckedPeriod !== currentPeriodKey) {
    return true;
  }
  
  return false;
};

export const archiveCurrentPeriod = (): void => {
  const expenses: Expense[] = JSON.parse(localStorage.getItem("spendwise-expenses") || "[]");
  
  if (expenses.length === 0) {
    markPeriodAsChecked();
    return;
  }

  const { start, end } = getCurrentPeriodRange();
  const previousPeriodStart = new Date(start);
  const previousPeriodEnd = new Date(end);
  
  // Adjust to get the previous period
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
  previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const archivedPeriod: ArchivedPeriod = {
    id: Date.now().toString(),
    periodStart: previousPeriodStart.toISOString(),
    periodEnd: previousPeriodEnd.toISOString(),
    expenses,
    totalSpent,
    archivedAt: new Date().toISOString(),
  };

  // Save to archive
  const existingArchive: ArchivedPeriod[] = JSON.parse(localStorage.getItem("spendwise-archive") || "[]");
  existingArchive.push(archivedPeriod);
  localStorage.setItem("spendwise-archive", JSON.stringify(existingArchive));

  // Clear current expenses
  localStorage.setItem("spendwise-expenses", "[]");
  
  markPeriodAsChecked();
};

export const markPeriodAsChecked = (): void => {
  const { start } = getCurrentPeriodRange();
  const currentPeriodKey = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
  localStorage.setItem("spendwise-last-period", currentPeriodKey);
};

export const getArchivedPeriods = (): ArchivedPeriod[] => {
  return JSON.parse(localStorage.getItem("spendwise-archive") || "[]");
};
