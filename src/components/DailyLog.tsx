
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

export const DailyLog = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Load data from localStorage
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

  // Save expenses to localStorage
  useEffect(() => {
    if (expenses.length >= 0) {
      localStorage.setItem("spendwise-expenses", JSON.stringify(expenses));
    }
  }, [expenses]);

  const addExpense = () => {
    if (!selectedCategory || !amount) {
      toast({
        title: "Please select a category and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      date,
      category: selectedCategory,
      amount: parseFloat(amount),
      note: note.trim(),
    };

    setExpenses([newExpense, ...expenses]);
    setSelectedCategory("");
    setAmount("");
    setNote("");
    
    toast({
      title: "Expense logged! 💸",
      description: `₾${amount} spent on ${selectedCategory}`,
    });
  };

  const todaysExpenses = expenses.filter(expense => expense.date === date);
  const todaysTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Quick Add Form */}
      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            ✍️ Log Today's Expense
          </CardTitle>
          <p className="text-sm text-gray-600">
            Quick and easy expense tracking
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₾</span>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 text-lg"
              step="0.01"
            />
          </div>

          <Textarea
            placeholder="What did you buy? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none"
            rows={2}
          />

          <Button onClick={addExpense} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle size={16} className="mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700">
            📅 Today's Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Total spent today:</span>
            <span className="text-xl font-bold text-blue-600">₾{todaysTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            {todaysExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses logged today</p>
            ) : (
              todaysExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{expense.category}</div>
                    {expense.note && (
                      <div className="text-sm text-gray-600 mt-1">{expense.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">₾{expense.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
