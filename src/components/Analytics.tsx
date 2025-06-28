import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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
  Clock,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Eye,
  EyeOff,
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

interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
  remaining: number;
  percentage: number;
  color: string;
}

interface SpendingInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

interface DailySpending {
  date: string;
  amount: number;
  cumulative: number;
}

interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

export const Analytics = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [period, setPeriod] = useState<MonthlyPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAmounts, setShowAmounts] = useState(true);
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
        setError(t('analytics.failed_to_load_data'));
        setLoading(false);
      });
  }, [uid, t]);

  // Get current period's expenses
  const currentPeriodExpenses = useMemo(() => {
    if (!period || !expenses.length) return [];
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return isDateInCurrentPeriod(expenseDate, period);
    });
  }, [expenses, period]);

  // Calculate category summaries
  const categorySummaries = useMemo(() => {
    if (!categories.length || !currentPeriodExpenses.length) return [];
    
    return categories.map((category) => {
      const categoryExpenses = currentPeriodExpenses.filter((expense) => {
        if (expense.categoryId) {
          return expense.categoryId === category.id;
        }
        return expense.category === category.name;
      });

      const actual = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = category.plannedAmount - actual;
      const percentage = category.plannedAmount > 0 ? (actual / category.plannedAmount) * 100 : 0;

      return {
        category: category.name,
        planned: category.plannedAmount,
        actual,
        remaining,
        percentage: Math.min(percentage, 100),
        color: category.color || '#60a5fa',
      };
    });
  }, [categories, currentPeriodExpenses]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalPlanned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
    const totalActual = currentPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRemaining = totalPlanned - totalActual;
    const percentageUsed = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return {
      planned: totalPlanned,
      actual: totalActual,
      remaining: totalRemaining,
      percentageUsed,
    };
  }, [categories, currentPeriodExpenses]);

  // Generate daily spending data for charts
  const dailySpendingData = useMemo(() => {
    if (!currentPeriodExpenses.length || !period) return [];

    const dailyMap = new Map<string, number>();
    const { start, end } = getCurrentPeriodRange(period);
    const startDate = start;
    const endDate = end;

    // Initialize all days with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dailyMap.set(d.toISOString().split('T')[0], 0);
    }

    // Add actual spending
    currentPeriodExpenses.forEach(expense => {
      const date = expense.date.split('T')[0];
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + expense.amount);
    });

    // Convert to array and calculate cumulative
    let cumulative = 0;
    return Array.from(dailyMap.entries())
      .map(([date, amount]) => {
        cumulative += amount;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          cumulative,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentPeriodExpenses, period]);

  // Generate category spending data for pie chart
  const categorySpendingData = useMemo(() => {
    return categorySummaries
      .filter(summary => summary.actual > 0)
      .map(summary => ({
        name: summary.category,
        value: summary.actual,
        color: summary.color,
      }));
  }, [categorySummaries]);

  // Generate insights
  const insights = useMemo((): SpendingInsight[] => {
    const insights: SpendingInsight[] = [];

    // Budget usage insight
    if (totals.percentageUsed > 90) {
      insights.push({
        type: "negative",
        title: t('analytics.budget_warning'),
        description: t('analytics.budget_warning_desc'),
        icon: <AlertTriangle className="w-5 h-5" />,
        action: t('analytics.review_spending'),
      });
    } else if (totals.percentageUsed < 50) {
      insights.push({
        type: "positive",
        title: t('analytics.great_progress'),
        description: t('analytics.great_progress_desc'),
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }

    // Category insights
    categorySummaries.forEach(summary => {
      if (summary.percentage > 100) {
        insights.push({
          type: "negative",
          title: t('analytics.over_budget_category', { category: summary.category }),
          description: t('analytics.over_budget_desc'),
          icon: <TrendingUp className="w-5 h-5" />,
          action: t('analytics.adjust_budget'),
        });
      }
    });

    return insights.slice(0, 3); // Limit to 3 insights
  }, [totals, categorySummaries, t]);

  const formatCurrency = (amount: number) => {
    return `${currency}${showAmounts ? amount.toFixed(2) : '***'}`;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage <= 50) return "text-green-600 dark:text-green-400";
    if (percentage <= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusEmoji = (percentage: number) => {
    if (percentage <= 50) return "😊";
    if (percentage <= 80) return "😐";
    if (percentage <= 100) return "😰";
    return "🚨";
  };

  if (loading || !period) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t('analytics.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period info and privacy toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            📊 {t('analytics.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatPeriodRange(period)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAmounts(!showAmounts)}
          className="flex items-center gap-2"
        >
          {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showAmounts ? t('analytics.hide_amounts') : t('analytics.show_amounts')}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.total_spent')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totals.actual)}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.budget_remaining')}</p>
                <p className={`text-2xl font-bold ${getStatusColor(totals.percentageUsed)}`}>
                  {formatCurrency(Math.abs(totals.remaining))}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.budget_used')}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totals.percentageUsed.toFixed(1)}%
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.transactions')}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {currentPeriodExpenses.length}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
              💡 {t('analytics.smart_insights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'positive'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : insight.type === 'negative'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${
                      insight.type === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : insight.type === 'negative'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      {insight.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('analytics.overview')}
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('analytics.trends')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            {t('analytics.categories')}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('analytics.details')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Spending Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                  📈 {t('analytics.daily_spending')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailySpendingData}>
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip labelFormatter={(value) => {
                      return `Amount: ${value}`;
                    }} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      fill="url(#spendingGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                  🥧 {t('analytics.category_breakdown')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categorySpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip labelFormatter={(value) => {
                      return `Amount: ${value}`;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                📊 {t('analytics.spending_trends')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(value) => {
                    return `Date: ${value}`;
                  }} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                  📊 {t('analytics.category_performance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categorySummaries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip labelFormatter={(value) => {
                      return `Category: ${value}`;
                    }} />
                    <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget vs Actual Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                  ⚖️ {t('analytics.budget_vs_actual')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySummaries.map((summary) => (
                    <div key={summary.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: summary.color }}
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {summary.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(summary.actual)} / {formatCurrency(summary.planned)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {summary.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={summary.percentage}
                        className="h-2"
                        style={{
                          '--progress-background': summary.color,
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                📋 {t('analytics.category_details')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySummaries.map((summary) => (
                  <Card
                    key={summary.category}
                    className="border-gray-200 dark:border-gray-800 shadow-sm"
                    style={{ borderLeft: `4px solid ${summary.color}` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getStatusEmoji(summary.percentage)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                              {summary.category}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {summary.percentage.toFixed(1)}% {t('analytics.of_budget_used')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {formatCurrency(summary.actual)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('of')} {formatCurrency(summary.planned)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('analytics.remaining')}:
                          </span>
                          <span
                            className={`font-medium ${
                              summary.remaining >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatCurrency(Math.abs(summary.remaining))}
                            {summary.remaining >= 0 ? ` ${t('analytics.left')}` : ` ${t('analytics.over')}`}
                          </span>
                        </div>
                        
                        <Progress
                          value={summary.percentage}
                          className="h-2"
                          style={{
                            '--progress-background': summary.color,
                          } as React.CSSProperties}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 