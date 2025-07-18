import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getCurrentPeriodRange,
  formatPeriodRange,
  isDateInCurrentPeriod,
  getMonthlyPeriod,
  MonthlyPeriod,
} from "@/utils/monthlyPeriod";
import { getExpenses, getCategories } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useTranslation } from "react-i18next";
import { PrivacyToggle } from "@/components/ui/privacy-toggle";

interface Expense {
  id: string;
  date: string;
  category: string; // name (legacy)
  categoryId?: string; // new: id reference
  amount: number;
  note: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
  color?: string;
}

interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
  remaining: number;
  percentage: number;
}

export const Summary = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const { showAmounts } = usePrivacy();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [period, setPeriod] = useState<MonthlyPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    Promise.all([getExpenses(uid), getCategories(uid), getMonthlyPeriod(uid)])
      .then(([expenses, categories, period]) => {
        setExpenses(expenses);
        setCategories(categories);
        setPeriod(period);
        setLoading(false);
      })
      .catch(() => {
        setError(t('summary.failed_to_load_summary_data'));
        setLoading(false);
      });
  }, [uid, t]);

  if (loading || !period || !categories || !expenses) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  // Get current period's expenses using custom monthly period
  const currentPeriodExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return isDateInCurrentPeriod(expenseDate, period);
  });

  // Calculate summary by category
  const categorySummaries: CategorySummary[] = categories.map((category) => {
    const categoryExpenses = currentPeriodExpenses.filter((expense) => {
      // Prefer matching by categoryId, fallback to name for legacy data
      if (expense.categoryId) {
        return expense.categoryId === category.id;
      }
      return expense.category === category.name;
    });

    const actual = categoryExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const remaining = category.plannedAmount - actual;
    const percentage =
      category.plannedAmount > 0 ? (actual / category.plannedAmount) * 100 : 0;

    return {
      category: category.name,
      planned: category.plannedAmount,
      actual,
      remaining,
      percentage: Math.min(percentage, 100),
    };
  });

  const totalPlanned = categories.reduce(
    (sum, cat) => sum + cat.plannedAmount,
    0
  );
  const totalActual = currentPeriodExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalRemaining = totalPlanned - totalActual;

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return "bg-green-500";
    if (percentage <= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusEmoji = (percentage: number) => {
    if (percentage <= 50) return "😊";
    if (percentage <= 80) return "😐";
    if (percentage <= 100) return "😰";
    return "🚨";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            📊 {t("summary.summary")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formatPeriodRange(period)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex justify-center md:justify-end">
          <PrivacyToggle />
        </div>
      </div>

      {/* Overall Summary */}
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            📈 {t('summary.period_overview')}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">{formatPeriodRange(period)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currency}
                {showAmounts ? totalActual.toFixed(2) : '***'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t('summary.spent')}</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  totalRemaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {currency}
                {showAmounts ? Math.abs(totalRemaining).toFixed(2) : '***'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {totalRemaining >= 0 ? t('summary.remaining') : t('summary.over_budget')}
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                totalPlanned > 0 && totalActual / totalPlanned <= 1
                  ? getProgressColor((totalActual / totalPlanned) * 100)
                  : "bg-red-500"
              }`}
              style={{
                width: `${
                  totalPlanned > 0
                    ? Math.min((totalActual / totalPlanned) * 100, 100)
                    : 0
                }%`,
              }}
            ></div>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            {totalPlanned > 0
              ? `${((totalActual / totalPlanned) * 100).toFixed(1)}%`
              : "0%"}{" "}
            {t('summary.of_budget_used')}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700 dark:text-gray-100">📊 {t('summary.by_category')}</h3>

        {categorySummaries.map((summary) => {
          
          // Find the category object to get its color
          const cat = categories.find(c => c.name === summary.category);
          const color = cat?.color || '#60a5fa';
          // Create a soft background color with opacity
          const bgColor = color + '20'; // e.g. #60a5fa20 for 12.5% opacity
          return (
            <Card
              key={summary.category}
              className="border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.015] hover:shadow-md"
              style={{ borderLeft: `8px solid ${color}`, background: bgColor }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white shadow" style={{ background: color, display: 'inline-block' }} />
                    <span className="text-lg">
                      {getStatusEmoji(summary.percentage)}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {summary.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {currency}{showAmounts ? summary.actual.toFixed(2) : '***'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('of')} {currency}{showAmounts ? summary.planned.toFixed(2) : '***'}
                    </div>
                  </div>
                </div>

                <Progress
                  value={summary.percentage}
                  className="h-2 mb-2"
                  style={{ background: color }}
                />

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {summary.percentage.toFixed(1)}% {t('summary.used')}
                  </span>
                  <span
                    className={`font-medium ${
                      summary.remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {summary.remaining >= 0
                      ? currency + (showAmounts ? summary.remaining.toFixed(2) : '***') + ` ${t('summary.left')}`
                      : currency +
                        (showAmounts ? Math.abs(summary.remaining).toFixed(2) : '***') +
                        ` ${t('summary.over')}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {categorySummaries.length === 0 && (
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
              {t('summary.no_categories')}
              <br />
              {t('summary.go_to_budget_tab')}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
