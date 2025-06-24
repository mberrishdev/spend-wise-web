
interface MonthlyPeriod {
  startDay: number;
  endDay: number;
}

export const getMonthlyPeriod = (): MonthlyPeriod => {
  const savedPeriod = localStorage.getItem("spendwise-monthly-period");
  if (savedPeriod) {
    return JSON.parse(savedPeriod);
  }
  // Default: 25th to 24th
  return { startDay: 25, endDay: 24 };
};

export const getCurrentPeriodRange = (): { start: Date; end: Date } => {
  const { startDay, endDay } = getMonthlyPeriod();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (currentDay >= startDay) {
    // We're in the current period
    periodStart = new Date(currentYear, currentMonth, startDay);
    periodEnd = new Date(currentYear, currentMonth + 1, endDay);
  } else {
    // We're still in the previous period
    periodStart = new Date(currentYear, currentMonth - 1, startDay);
    periodEnd = new Date(currentYear, currentMonth, endDay);
  }

  return { start: periodStart, end: periodEnd };
};

export const isDateInCurrentPeriod = (date: Date): boolean => {
  const { start, end } = getCurrentPeriodRange();
  return date >= start && date <= end;
};

export const formatPeriodRange = (): string => {
  const { start, end } = getCurrentPeriodRange();
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
};
