import { getCurrentPeriodRange } from './monthlyPeriod';
import { db } from '@/integrations/firebase';
import { collection, doc, getDocs, setDoc, addDoc, query, where, deleteDoc, updateDoc } from 'firebase/firestore';

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
}

interface ArchivedPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  expenses: Expense[];
  totalSpent: number;
  archivedAt: string;
}

// Firestore paths: users/{uid}/dailyLogs, users/{uid}/archive, users/{uid}/categories

export async function getExpenses(uid: string): Promise<Expense[]> {
  const col = collection(db, 'users', uid, 'dailyLogs');
  const snap = await getDocs(col);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(uid: string, expense: Omit<Expense, 'id'>): Promise<void> {
  const col = collection(db, 'users', uid, 'dailyLogs');
  await addDoc(col, expense);
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'dailyLogs', expenseId);
  await deleteDoc(ref);
}

export async function getCategories(uid: string): Promise<BudgetCategory[]> {
  const col = collection(db, 'users', uid, 'categories');
  const snap = await getDocs(col);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
}

export async function addCategory(uid: string, category: Omit<BudgetCategory, 'id'>): Promise<void> {
  const col = collection(db, 'users', uid, 'categories');
  await addDoc(col, category);
}

export async function updateCategory(uid: string, categoryId: string, data: Partial<BudgetCategory>): Promise<void> {
  const ref = doc(db, 'users', uid, 'categories', categoryId);
  await updateDoc(ref, data);
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'categories', categoryId);
  await deleteDoc(ref);
}

export async function getArchivedPeriods(uid: string): Promise<ArchivedPeriod[]> {
  const col = collection(db, 'users', uid, 'archive');
  const snap = await getDocs(col);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchivedPeriod));
}

export async function archiveCurrentPeriod(uid: string, expenses: Expense[]): Promise<void> {
  if (expenses.length === 0) return;
  const { start, end } = getCurrentPeriodRange();
  const previousPeriodStart = new Date(start);
  const previousPeriodEnd = new Date(end);
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
  previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const archivedPeriod: Omit<ArchivedPeriod, 'id'> = {
    periodStart: previousPeriodStart.toISOString(),
    periodEnd: previousPeriodEnd.toISOString(),
    expenses,
    totalSpent,
    archivedAt: new Date().toISOString(),
  };
  const col = collection(db, 'users', uid, 'archive');
  await addDoc(col, archivedPeriod);
}
