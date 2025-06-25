import { db } from "@/integrations/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface MonthlyPeriod {
  startDay: number;
  endDay: number;
}

export async function getMonthlyPeriod(uid: string): Promise<MonthlyPeriod> {
  const ref = doc(db, "users", uid, "monthlyPlan", "main");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as MonthlyPeriod;
  }
  // Default: 25th to 24th
  return { startDay: 25, endDay: 24 };
}

export async function setMonthlyPeriod(
  uid: string,
  period: MonthlyPeriod
): Promise<void> {
  const ref = doc(db, "users", uid, "monthlyPlan", "main");
  await setDoc(ref, period, { merge: true });
}

export const getCurrentPeriodRange = (
  period: MonthlyPeriod
): { start: Date; end: Date } => {
  const { startDay, endDay } = period;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (currentDay >= startDay) {
    // We're in the current period
    periodStart = new Date(currentYear, currentMonth, startDay, 0, 0, 0, 0);
    periodEnd = new Date(
      currentYear,
      currentMonth + 1,
      endDay,
      23,
      59,
      59,
      999
    );
  } else {
    // We're still in the previous period
    periodStart = new Date(currentYear, currentMonth - 1, startDay, 0, 0, 0, 0);
    periodEnd = new Date(currentYear, currentMonth, endDay, 23, 59, 59, 999);
  }

  return { start: periodStart, end: periodEnd };
};

export const isDateInCurrentPeriod = (
  date: Date,
  period: MonthlyPeriod
): boolean => {
  const { start, end } = getCurrentPeriodRange(period);
  return date >= start && date <= end;
};

export const formatPeriodRange = (period: MonthlyPeriod): string => {
  const { start, end } = getCurrentPeriodRange(period);
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${startStr} - ${endStr}`;
};
