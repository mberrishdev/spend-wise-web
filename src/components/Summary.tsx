
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentPeriodRange, formatPeriodRange, isDateInCurrentPeriod } from "@/utils/monthlyPeriod";

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

interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
  remaining: number;
  percentage: number;
}

export const Summary = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    const savedExpenses = localStorage.getItem("spendwise-expenses");
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }

    const savedCategories = localStorage.getItem("spendwise-categories");
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Get current period's expenses using custom monthly period
  const currentPeriodExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return isDateInCurrentPeriod(expenseDate);
  });

  // Calculate summary by category
  const categorySummaries: CategorySummary[] = categories.map(category => {
    const categoryExpenses = currentPeriodExpenses.filter(expense => 
      expense.category === category.name
    );
    const actual = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = category.plannedAmount - actual;
    const percentage = category.plannedAmount > 0 ? (actual / category.plannedAmount) * 100 : 0;

    return {
      category: category.name,
      planned: category.plannedAmount,
      actual,
      remaining,
      percentage: Math.min(percentage, 100),
    };
  });

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const totalActual = currentPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
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
      {/* Overall Summary */}
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            📈 Period Overview
          </CardTitle>
          <p className="text-sm text-gray-600">
            {formatPeriodRange()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₾{totalActual.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₾{Math.abs(totalRemaining).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                totalPlanned > 0 && (totalActual / totalPlanned) <= 1 
                  ? getProgressColor((totalActual / totalPlanned) * 100)
                  : 'bg-red-500'
              }`}
              style={{ 
                width: `${totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 100) : 0}%` 
              }}
            ></div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            {totalPlanned > 0 ? `${((totalActual / totalPlanned) * 100).toFixed(1)}%` : '0%'} of budget used
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">📊 By Category</h3>
        
        {categorySummaries.map((summary) => (
          <Card key={summary.category} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusEmoji(summary.percentage)}</span>
                  <span className="font-medium text-gray-800">{summary.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">₾{summary.actual.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">of ₾{summary.planned.toFixed(2)}</div>
                </div>
              </div>
              
              <Progress 
                value={summary.percentage} 
                className="h-2 mb-2"
              />
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{summary.percentage.toFixed(1)}% used</span>
                <span className={`font-medium ${summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.remaining >= 0 ? '₾' + summary.remaining.toFixed(2) + ' left' : '₾' + Math.abs(summary.remaining).toFixed(2) + ' over'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {categorySummaries.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center text-gray-500">
              No budget categories set up yet.<br />
              Go to the Budget tab to get started! 🎯
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
