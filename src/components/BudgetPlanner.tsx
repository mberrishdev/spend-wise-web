import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getCategories, addCategory, updateCategory, deleteCategory } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
}

const defaultCategories: Omit<BudgetCategory, "id">[] = [
  { name: "Food & Dining", plannedAmount: 500 },
  { name: "Transport", plannedAmount: 200 },
  { name: "Entertainment", plannedAmount: 150 },
  { name: "Shopping", plannedAmount: 300 },
];

export const BudgetPlanner = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAmount, setNewCategoryAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    getCategories(uid)
      .then((cats) => {
        if (cats.length === 0) {
          // Add default categories to Firestore
          Promise.all(defaultCategories.map(cat => addCategory(uid, cat))).then(async () => {
            const newCats = await getCategories(uid);
            setCategories(newCats);
            setLoading(false);
          });
        } else {
          setCategories(cats);
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, [uid]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryAmount) {
      toast({
        title: "Please fill in both fields",
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
      toast({ title: "Category added successfully! 🎉" });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: "Failed to add category", variant: "destructive" });
    }
  };

  const handleUpdateCategory = async (id: string, field: keyof BudgetCategory, value: string | number) => {
    if (!uid) return;
    try {
      await updateCategory(uid, id, { [field]: value });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!uid) return;
    try {
      await deleteCategory(uid, id);
      toast({ title: "Category deleted" });
      const updated = await getCategories(uid);
      setCategories(updated);
    } catch {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  };

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            📊 Monthly Budget Plan
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set your spending goals for each category
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new category */}
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-gray-700">Add New Category</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="₾"
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
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <Input
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.id, "name", e.target.value)}
                  className="flex-1 font-medium"
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">₾</span>
                  <Input
                    type="number"
                    value={category.plannedAmount}
                    onChange={(e) => handleUpdateCategory(category.id, "plannedAmount", parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                  />
                </div>
                <Button
                  onClick={() => handleDeleteCategory(category.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total Monthly Budget:</span>
              <span className="text-xl font-bold text-green-600">₾{totalPlanned.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
