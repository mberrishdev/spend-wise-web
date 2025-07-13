import { getCurrentPeriodRange } from "./monthlyPeriod";
import { db } from "@/integrations/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

interface Expense {
  id: string;
  date: string;
  category: string;
  categoryId?: string;
  amount: number;
  note: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
  color: string; // hex code
}

interface ArchivedPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  expenses: Expense[];
  totalSpent: number;
  archivedAt: string;
}

interface BorrowedMoney {
  id: string;
  date: string;
  amount: number;
  description: string;
  friendName: string;
  returnDate?: string;
  isReturned: boolean;
  returnedDate?: string;
}

// Firestore paths: users/{uid}/dailyLogs, users/{uid}/archive, users/{uid}/categories, users/{uid}/borrowedMoney

export async function getExpenses(uid: string): Promise<Expense[]> {
  const col = collection(db, "users", uid, "dailyLogs");
  const snap = await getDocs(col);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(
  uid: string,
  expense: Omit<Expense, "id">
): Promise<void> {
  const col = collection(db, "users", uid, "dailyLogs");
  await addDoc(col, expense);
}

export async function deleteExpense(
  uid: string,
  expenseId: string
): Promise<void> {
  const ref = doc(db, "users", uid, "dailyLogs", expenseId);
  await deleteDoc(ref);
}

export async function getCategories(uid: string): Promise<BudgetCategory[]> {
  const col = collection(db, "users", uid, "categories");
  const snap = await getDocs(col);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      plannedAmount: data.plannedAmount,
      color: data.color || "#60a5fa", // default blue if missing
    } as BudgetCategory;
  });
}

export async function addCategory(
  uid: string,
  category: Omit<BudgetCategory, "id">
): Promise<void> {
  const col = collection(db, "users", uid, "categories");
  await addDoc(col, { ...category, color: category.color || "#60a5fa" });
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  data: Partial<BudgetCategory>
): Promise<void> {
  const ref = doc(db, "users", uid, "categories", categoryId);
  await updateDoc(ref, data);
}

export async function deleteCategory(
  uid: string,
  categoryId: string
): Promise<void> {
  const ref = doc(db, "users", uid, "categories", categoryId);
  await deleteDoc(ref);
}

export async function getArchivedPeriods(
  uid: string
): Promise<ArchivedPeriod[]> {
  const col = collection(db, "users", uid, "archive");
  const snap = await getDocs(col);
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as ArchivedPeriod)
  );
}

export async function archiveCurrentPeriod(
  uid: string, 
  expenses: Expense[], 
  periodStart: Date, 
  periodEnd: Date
): Promise<void> {
  if (expenses.length === 0) return;
  
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const archivedPeriod: Omit<ArchivedPeriod, 'id'> = {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    expenses,
    totalSpent,
    archivedAt: new Date().toISOString(),
  };
  const col = collection(db, 'users', uid, 'archive');
  await addDoc(col, archivedPeriod);

  // Delete all archived expenses from dailyLogs
  const batch = writeBatch(db);
  for (const expense of expenses) {
    const ref = doc(db, 'users', uid, 'dailyLogs', expense.id);
    batch.delete(ref);
  }
  await batch.commit();
}

export async function updateExpense(
  uid: string,
  expenseId: string,
  data: Partial<Expense>
): Promise<void> {
  const ref = doc(db, "users", uid, "dailyLogs", expenseId);
  await updateDoc(ref, data);
}

// Borrowed Money Functions
export async function getBorrowedMoney(uid: string): Promise<BorrowedMoney[]> {
  const col = collection(db, "users", uid, "borrowedMoney");
  const snap = await getDocs(col);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BorrowedMoney));
}

export async function addBorrowedMoney(
  uid: string,
  borrowedMoney: Omit<BorrowedMoney, "id">
): Promise<void> {
  const col = collection(db, "users", uid, "borrowedMoney");
  await addDoc(col, borrowedMoney);
}

export async function deleteBorrowedMoney(
  uid: string,
  borrowedMoneyId: string
): Promise<void> {
  const ref = doc(db, "users", uid, "borrowedMoney", borrowedMoneyId);
  await deleteDoc(ref);
}

export async function updateBorrowedMoney(
  uid: string,
  borrowedMoneyId: string,
  data: Partial<BorrowedMoney>
): Promise<void> {
  const ref = doc(db, "users", uid, "borrowedMoney", borrowedMoneyId);
  await updateDoc(ref, data);
}
