import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getCategories, addCategory, updateCategory, deleteCategory } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
}

export const BudgetPlanner = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAmount, setNewCategoryAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    getCategories(uid)
      .then((cats) => {
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => {
        setError(t('budgetPlanner.failed_to_load_categories'));
        setLoading(false);
      });
  }, [uid, t]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryAmount) {
      toast({
        title: t('budgetPlanner.fill_in_both_fields'),
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(newCategoryAmount) <= 0) {
      toast({
        title: t('budgetPlanner.amount_greater_than_zero'),
        variant: "destructive",
      });
      return;
    }
    if (!uid) return;
    try {
      await addCategory(uid, {
        name: newCategoryName.trim(),
        plannedAmount: parseFloat(newCategoryAmount),
      });
      setNewCategoryName("");
      setNewCategoryAmount("");
      toast({ title: t('budgetPlanner.category_added') });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: t('budgetPlanner.failed_to_add_category'), variant: "destructive" });
    }
  };

  const handleUpdateCategory = async (id: string, field: keyof BudgetCategory, value: string | number) => {
    if (!uid) return;
    if (field === "plannedAmount" && (typeof value === "number" ? value <= 0 : parseFloat(value) <= 0)) {
      toast({
        title: t('budgetPlanner.amount_greater_than_zero'),
        variant: "destructive",
      });
      return;
    }
    try {
      await updateCategory(uid, id, { [field]: value });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: t('budgetPlanner.failed_to_update_category'), variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!uid) return;
    try {
      await deleteCategory(uid, id);
      toast({ title: t('budgetPlanner.category_deleted') });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: t('budgetPlanner.failed_to_delete_category'), variant: "destructive" });
    }
  };

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);

  if (loading) {
    return <div className="text-center text-gray-500 py-8">{t('loading')}</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            📊 {t('budgetPlanner.monthly_budget_plan')}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {t('budgetPlanner.set_goals')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty state message */}
          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <span className="text-3xl">🗂️</span>
              <div className="text-gray-600 text-base text-center">{t('budgetPlanner.no_categories')}</div>
            </div>
          )}
          {/* Add new category */}
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-gray-700">{t('budgetPlanner.add_new_category')}</h3>
            <div className="flex gap-2">
              <Input
                placeholder={t('budgetPlanner.category_name')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder={currency}
                value={newCategoryAmount}
                onChange={(e) => setNewCategoryAmount(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleAddCategory} size="sm" className="bg-green-600 hover:bg-green-700">
                <PlusCircle size={16} />
              </Button>
            </div>
          </div>

          {/* Categories list */}
          <div className="space-y-3">
            {categories.map((category) => {
              const isEditing = editId === category.id;
              return (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  {isEditing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 font-medium"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">{currency}</span>
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-20 text-right"
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!editName.trim() || !editAmount || parseFloat(editAmount) <= 0) {
                            toast({ title: t('budgetPlanner.enter_valid_name_and_amount'), variant: "destructive" });
                            return;
                          }
                          await handleUpdateCategory(category.id, "name", editName.trim());
                          await handleUpdateCategory(category.id, "plannedAmount", parseFloat(editAmount));
                          setEditId(null);
                        }}
                        size="sm"
                        className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100"
                        title={t('save')}
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        onClick={() => setEditId(null)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                        title={t('cancel')}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={category.name}
                        readOnly
                        className="flex-1 font-medium bg-transparent border-none focus:ring-0 focus:outline-none cursor-default"
                        tabIndex={-1}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">{currency}</span>
                        <Input
                          type="number"
                          value={category.plannedAmount}
                          readOnly
                          className="w-20 text-right bg-transparent border-none focus:ring-0 focus:outline-none cursor-default"
                          tabIndex={-1}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setEditId(category.id);
                          setEditName(category.name);
                          setEditAmount(category.plannedAmount.toString());
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-blue-500 hover:text-blue-700"
                        title={t('edit')}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={t('delete')}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">{t('budgetPlanner.total_monthly_budget')}</span>
              <span className="text-xl font-bold text-green-600">{currency}{totalPlanned.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
