import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Calculator,
  PiggyBank,
  CreditCard,
  Calendar,
  BarChart3,
  ArrowRight,
  Star,
  Zap,
  Heart,
  Shield,
  Brain,
  MessageSquare,
} from "lucide-react";

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
  color?: string;
}

interface FinancialAdvice {
  id: string;
  type: "savings" | "spending" | "budget" | "goal" | "emergency";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  impact: string;
  icon: React.ReactNode;
  color: string;
}

export const FinancialAdvisor = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
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
        setError(t("advisor.failed_to_load"));
        setLoading(false);
      });
  }, [uid]);

  // Get current period's expenses
  const currentPeriodExpenses = useMemo(() => {
    if (!period || !expenses.length) return [];
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return isDateInCurrentPeriod(expenseDate, period);
    });
  }, [expenses, period]);

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const totalSpent = currentPeriodExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalBudget = categories.reduce(
      (sum, cat) => sum + cat.plannedAmount,
      0
    );
    const remainingBudget = totalBudget - totalSpent;
    const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate average daily spending
    const daysInPeriod = currentPeriodExpenses.length > 0 ? 30 : 30; // Simplified
    const avgDailySpending = totalSpent / daysInPeriod;

    // Calculate savings rate (assuming income is 20% more than budget for demo)
    const estimatedIncome = totalBudget * 1.2;
    const savingsRate =
      estimatedIncome > 0
        ? ((estimatedIncome - totalSpent) / estimatedIncome) * 100
        : 0;

    return {
      totalSpent,
      totalBudget,
      remainingBudget,
      budgetUsage,
      avgDailySpending,
      savingsRate,
      transactionCount: currentPeriodExpenses.length,
    };
  }, [currentPeriodExpenses, categories]);

  // Generate personalized financial advice
  const financialAdvice = useMemo((): FinancialAdvice[] => {
    const advice: FinancialAdvice[] = [];
    const { budgetUsage, savingsRate, remainingBudget } = financialMetrics;

    // Budget management advice
    if (budgetUsage > 90) {
      advice.push({
        id: "budget-warning",
        type: "budget",
        priority: "high",
        title: "Budget Alert: Approaching Limit",
        description:
          "You're close to exceeding your monthly budget. Consider reviewing your spending patterns.",
        action: "Review & Adjust Budget",
        impact: "Prevent overspending",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-red-600 dark:text-red-400",
      });
    }

    if (budgetUsage < 50) {
      advice.push({
        id: "budget-opportunity",
        type: "budget",
        priority: "medium",
        title: "Budget Opportunity",
        description:
          "You're well under budget! Consider allocating more to savings or investments.",
        action: "Increase Savings",
        impact: "Build wealth faster",
        icon: <PiggyBank className="w-5 h-5" />,
        color: "text-green-600 dark:text-green-400",
      });
    }

    // Savings advice
    if (savingsRate < 10) {
      advice.push({
        id: "savings-low",
        type: "savings",
        priority: "high",
        title: "Low Savings Rate",
        description:
          "Your savings rate is below recommended levels. Aim for 20% of income.",
        action: "Create Savings Plan",
        impact: "Build emergency fund",
        icon: <Target className="w-5 h-5" />,
        color: "text-orange-600 dark:text-orange-400",
      });
    }

    // Emergency fund advice
    if (remainingBudget < 0) {
      advice.push({
        id: "emergency-fund",
        type: "emergency",
        priority: "high",
        title: "Emergency Fund Needed",
        description:
          "You're over budget this month. Build an emergency fund to handle unexpected expenses.",
        action: "Start Emergency Fund",
        impact: "Financial security",
        icon: <Shield className="w-5 h-5" />,
        color: "text-purple-600 dark:text-purple-400",
      });
    }

    return advice
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }, [financialMetrics]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  if (loading || !period) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            {t("advisor.loading", "Loading financial insights...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          💡 {t("advisor.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {formatPeriodRange(period)} • {t("advisor.subtitle")}
        </p>
      </div>

      {/* AI Advisor Coming Soon */}
      <Card className="border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            {t("advisor.ai_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t(
                "advisor.coming_soon_title",
                "AI-Powered Financial Advice Coming Soon"
              )}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t(
                "advisor.coming_soon_desc",
                "Get personalized financial advice, spending analysis, and smart recommendations powered by artificial intelligence."
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                {t("advisor.smart_insights")}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Target className="w-4 h-4 mr-1" />
                {t("advisor.goal_planning")}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                {t("advisor.trend_analysis")}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Heart className="w-4 h-4 mr-1" />
                {t("advisor.personalized")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Score */}
      <Card className="border-gradient-to-r from-green-200 to-blue-200 dark:from-green-800 dark:to-blue-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            {t("advisor.health_score")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Math.max(
                  0,
                  Math.min(100, 100 - financialMetrics.budgetUsage)
                ).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("advisor.budget_health")}
              </div>
              <Progress
                value={Math.max(
                  0,
                  Math.min(100, 100 - financialMetrics.budgetUsage)
                )}
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {Math.max(
                  0,
                  Math.min(100, financialMetrics.savingsRate)
                ).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("advisor.savings_rate")}
              </div>
              <Progress
                value={Math.max(0, Math.min(100, financialMetrics.savingsRate))}
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {financialMetrics.transactionCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("advisor.transactions")}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t("advisor.avg_daily")}{" "}
                {formatCurrency(financialMetrics.avgDailySpending)}/
                {t("advisor.day")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("advisor.total_spent")}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(financialMetrics.totalSpent)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("advisor.budget_remaining")}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    financialMetrics.remainingBudget >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(Math.abs(financialMetrics.remainingBudget))}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("advisor.budget_used")}
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {financialMetrics.budgetUsage.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("advisor.daily_average")}
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(financialMetrics.avgDailySpending)}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Financial Advice */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            {t("advisor.personalized_advice")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialAdvice.length > 0 ? (
              financialAdvice.map((advice) => (
                <div
                  key={advice.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${advice.color
                        .replace("text-", "bg-")
                        .replace("dark:text-", "dark:bg-")} bg-opacity-10`}
                    >
                      {advice.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                          {t(`advisor.advice.${advice.id}.title`, advice.title)}
                        </h3>
                        <Badge className={getPriorityColor(advice.priority)}>
                          {t(
                            `advisor.priority.${advice.priority}`,
                            advice.priority.toUpperCase()
                          )}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {t(
                          `advisor.advice.${advice.id}.desc`,
                          advice.description
                        )}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button size="sm" className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            {t(
                              `advisor.advice.${advice.id}.action`,
                              advice.action
                            )}
                          </Button>
                          <span className="text-sm text-gray-500">
                            {t("advisor.impact", "Impact:")}{" "}
                            {t(
                              `advisor.advice.${advice.id}.impact`,
                              advice.impact
                            )}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {t("advisor.great_job")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("advisor.great_job_desc")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
            ⚡ {t("advisor.quick_actions", "Quick Actions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Calculator className="w-6 h-6" />
              <span>{t("advisor.budget_calculator")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <PiggyBank className="w-6 h-6" />
              <span>{t("advisor.savings_goals")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <CreditCard className="w-6 h-6" />
              <span>{t("advisor.debt_tracker")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
