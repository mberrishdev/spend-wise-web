import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getExpenses, addExpense, getCategories, deleteExpense, updateExpense } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");

  // Load data from Firestore
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getExpenses(uid),
      getCategories(uid)
    ])
      .then(([expenses, categories]) => {
        setExpenses(expenses);
        setCategories(categories);
        setLoading(false);
      })
      .catch((err) => {
        setError(t('dailyLog.failed_to_load_data'));
        setLoading(false);
      });
  }, [uid, t]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !amount) {
      toast({
        title: t('dailyLog.select_category_and_amount'),
        variant: "destructive",
      });
      return;
    }
    if (!uid) return;
    const newExpense = {
      date,
      category: selectedCategory,
      amount: parseFloat(amount),
      note: note.trim(),
    };
    try {
      await addExpense(uid, newExpense);
      setExpenses([{ id: "pending", ...newExpense }, ...expenses]); // Optimistic update
      setSelectedCategory("");
      setAmount("");
      setNote("");
      toast({
        title: t('dailyLog.expense_logged'),
        description: t('dailyLog.spent_on', { currency, amount, selectedCategory }),
      });
      // Reload from Firestore to get real id
      const updated = await getExpenses(uid);
      setExpenses(updated);
    } catch (err) {
      toast({
        title: t('dailyLog.failed_to_add_expense'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!uid) return;
    await deleteExpense(uid, expenseId);
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast({ title: t('dailyLog.expense_deleted') });
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditNote(expense.note || "");
    setEditCategory(expense.category);
    setEditDate(expense.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditNote("");
    setEditCategory("");
    setEditDate("");
  };

  const saveEdit = async (expense: Expense) => {
    if (!uid) return;
    await updateExpense(uid, expense.id, {
      amount: parseFloat(editAmount),
      note: editNote,
      category: editCategory,
      date: editDate,
    });
    setExpenses(expenses.map(e => e.id === expense.id ? { ...e, amount: parseFloat(editAmount), note: editNote, category: editCategory, date: editDate } : e));
    setEditingId(null);
    toast({ title: t('dailyLog.expense_updated') });
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">{t('loading')}</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  // If no categories, show a friendly empty state
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="max-w-lg w-full">
          <div className="bg-yellow-50 dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center gap-3 shadow-sm">
            <span className="text-4xl">🗂️</span>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-100 text-center">{t('dailyLog.no_categories')}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">{t('dailyLog.go_to_budget_tab')}</div>
            <button
              onClick={() => navigate('/dashboard/budget')}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              {t('dailyLog.go_to_budget_button')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todaysExpenses = expenses.filter(expense => expense.date === date);
  const todaysTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Filter for all expenses except today's
  const otherExpenses = expenses.filter(expense => expense.date !== date);

  return (
    <div className="space-y-6">
      {/* Quick Add Form */}
      <Card className="border-blue-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            ✍️ {t('dailyLog.log_today_expense')}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('dailyLog.quick_and_easy')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
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
              <SelectValue placeholder={t('dailyLog.select_category_placeholder')} />
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
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">{currency}</span>
            <Input
              type="number"
              placeholder={t('dailyLog.amount_placeholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 text-lg"
              step="0.01"
            />
          </div>

          <Textarea
            placeholder={t('dailyLog.note_placeholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none dark:bg-gray-800 dark:text-gray-100"
            rows={2}
          />

          <Button onClick={handleAddExpense} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle size={16} className="mr-2" />
            {t('dailyLog.add_expense')}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700 dark:text-gray-100">
            📅 {t('dailyLog.todays_expenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 dark:text-gray-300">{t('dailyLog.total_spent_today')}</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{currency}{todaysTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            {todaysExpenses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dailyLog.no_expenses_logged')}</p>
            ) : (
              todaysExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2">
                  {editingId === expense.id ? (
                    <>
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="date"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100 mb-1"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                        />
                        <select
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          placeholder={t('dailyLog.note_placeholder')}
                        />
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => saveEdit(expense)} className="p-1 rounded bg-green-600 text-white hover:bg-green-700"><Check size={16} /></button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"><X size={16} /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-100">{expense.category}</div>
                        {expense.note && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{expense.note}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-medium text-gray-800 dark:text-gray-100">{currency}{expense.amount.toFixed(2)}</div>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => startEdit(expense)} className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Expenses Section */}
      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700 dark:text-gray-100">
            {t('dailyLog.all_expenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {otherExpenses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dailyLog.no_other_expenses')}</p>
            ) : (
              otherExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2">
                  {editingId === expense.id ? (
                    <>
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="date"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100 mb-1"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                        />
                        <select
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full p-1 rounded border dark:bg-gray-900 dark:text-gray-100"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          placeholder={t('dailyLog.note_placeholder')}
                        />
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => saveEdit(expense)} className="p-1 rounded bg-green-600 text-white hover:bg-green-700"><Check size={16} /></button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"><X size={16} /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{new Date(expense.date).toLocaleDateString()}</span>
                        <div className="font-medium text-gray-800 dark:text-gray-100">{expense.category}</div>
                        {expense.note && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{expense.note}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-medium text-gray-800 dark:text-gray-100">{currency}{expense.amount.toFixed(2)}</div>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => startEdit(expense)} className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
