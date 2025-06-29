import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getArchivedPeriods } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
  Trash2,
  Archive as ArchiveIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  date: string;
  category: string;
  categoryId?: string;
  amount: number;
  note: string;
  color?: string;
}

interface ArchivedPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  expenses: Expense[];
  totalSpent: number;
  archivedAt: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
  color: string;
}

export const Archive = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const [archivedPeriods, setArchivedPeriods] = useState<ArchivedPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ArchivedPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    
    getArchivedPeriods(uid)
      .then((periods) => {
        setArchivedPeriods(periods.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()));
        setLoading(false);
      })
      .catch(() => {
        setError(t('archive.failed_to_load_data'));
        setLoading(false);
      });
  }, [uid, t]);

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateRange = (start: string, end: string) => {
    return `${format(new Date(start), 'MMM dd')} - ${format(new Date(end), 'MMM dd, yyyy')}`;
  };

  // Color palette fallback
  const palette = [
    '#60a5fa', // blue
    '#f59e42', // orange
    '#34d399', // green
    '#f472b6', // pink
    '#fbbf24', // yellow
    '#a78bfa', // purple
    '#f87171', // red
    '#38bdf8', // sky
    '#4ade80', // emerald
    '#facc15', // amber
  ];

  // Calculate category summaries for selected period
  const categorySummaries = selectedPeriod ? (() => {
    const categoryMap = new Map<string, CategorySummary>();
    let colorIdx = 0;
    selectedPeriod.expenses.forEach(expense => {
      const category = expense.category;
      const color = expense.color || palette[colorIdx % palette.length];
      const existing = categoryMap.get(category);
      if (existing) {
        existing.total += expense.amount;
        existing.count += 1;
      } else {
        categoryMap.set(category, {
          category,
          total: expense.amount,
          count: 1,
          color,
        });
        colorIdx++;
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  })() : [];

  // Generate daily spending data for charts
  const dailySpendingData = selectedPeriod ? (() => {
    const dailyMap = new Map<string, number>();
    const startDate = new Date(selectedPeriod.periodStart);
    const endDate = new Date(selectedPeriod.periodEnd);

    // Initialize all days with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dailyMap.set(d.toISOString().split('T')[0], 0);
    }

    // Add actual spending
    selectedPeriod.expenses.forEach(expense => {
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
  })() : [];

  // Generate category spending data for pie chart
  const categorySpendingData = categorySummaries.map(summary => ({
    name: summary.category,
    value: summary.total,
    color: summary.color,
  }));

  const handleExport = (period: ArchivedPeriod) => {
    // Create export data structure
    const exportData = {
      periodInfo: {
        id: period.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        totalSpent: period.totalSpent,
        archivedAt: period.archivedAt,
        transactionCount: period.expenses.length
      },
      expenses: period.expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        amount: expense.amount,
        note: expense.note
      })),
      summary: {
        totalSpent: period.totalSpent,
        averagePerDay: period.totalSpent / Math.ceil((new Date(period.periodEnd).getTime() - new Date(period.periodStart).getTime()) / (1000 * 60 * 60 * 24)),
        categoryBreakdown: categorySummaries.map(summary => ({
          category: summary.category,
          total: summary.total,
          count: summary.count,
          percentage: ((summary.total / period.totalSpent) * 100).toFixed(1)
        }))
      },
      exportInfo: {
        exportedAt: new Date().toISOString(),
        app: "SpendWise",
        version: "1.0"
      }
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise-archive-${format(new Date(period.periodStart), 'yyyy-MM-dd')}-to-${format(new Date(period.periodEnd), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success toast
    toast({
      title: t('archive.export_success'),
      description: t('archive.export_success_desc', { 
        filename: link.download 
      }),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t('archive.loading')}</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            📦 {t('archive.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('archive.description')}
          </p>
        </div>
      </div>

      {/* Periods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archivedPeriods.map((period) => (
          <Card
            key={period.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPeriod?.id === period.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setSelectedPeriod(period)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                {formatDateRange(period.periodStart, period.periodEnd)}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(period.archivedAt)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('archive.total_spent')}
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(period.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('archive.transactions')}
                  </span>
                  <Badge variant="secondary">
                    {period.expenses.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Period Details */}
      {selectedPeriod && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center justify-between">
                <span>
                  📊 {formatDateRange(selectedPeriod.periodStart, selectedPeriod.periodEnd)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => handleExport(selectedPeriod)}>
                    <Download className="w-4 h-4" />
                    {t('archive.export')}
                  </Button>
                  {/* <Button size="sm" variant="outline" className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-4 h-4" />
                    {t('archive.delete')}
                  </Button> */}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    {t('archive.overview')}
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('archive.trends')}
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4" />
                    {t('archive.categories')}
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {t('archive.transactions')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Spending Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                          📈 {t('archive.daily_spending')}
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
                            <Tooltip />
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
                          🥧 {t('archive.category_breakdown')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={categorySpendingData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {categorySpendingData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
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
                        📊 {t('archive.spending_trends')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={dailySpendingData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                        📋 {t('archive.category_details')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categorySummaries.map((summary) => (
                          <div key={summary.category} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                                {summary.category}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {summary.count} {t('archive.transactions')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(summary.total)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {((summary.total / selectedPeriod.totalSpent) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                        💳 {t('archive.all_transactions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedPeriod.expenses.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-gray-100">
                                {expense.category}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {expense.note}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDate(expense.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {archivedPeriods.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <ArchiveIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('archive.no_archived_data')}</h3>
              <p className="text-sm">{t('archive.no_archived_data_desc')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 