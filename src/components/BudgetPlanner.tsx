
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
}

export const BudgetPlanner = () => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAmount, setNewCategoryAmount] = useState("");

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem("spendwise-categories");
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Default categories
      const defaultCategories = [
        { id: "1", name: "Food & Dining", plannedAmount: 500 },
        { id: "2", name: "Transport", plannedAmount: 200 },
        { id: "3", name: "Entertainment", plannedAmount: 150 },
        { id: "4", name: "Shopping", plannedAmount: 300 },
      ];
      setCategories(defaultCategories);
      localStorage.setItem("spendwise-categories", JSON.stringify(defaultCategories));
    }
  }, []);

  // Save to localStorage whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem("spendwise-categories", JSON.stringify(categories));
    }
  }, [categories]);

  const addCategory = () => {
    if (!newCategoryName.trim() || !newCategoryAmount) {
      toast({
        title: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      plannedAmount: parseFloat(newCategoryAmount),
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName("");
    setNewCategoryAmount("");
    toast({
      title: "Category added successfully! 🎉",
    });
  };

  const updateCategory = (id: string, field: keyof BudgetCategory, value: string | number) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
    toast({
      title: "Category deleted",
    });
  };

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);

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
              <Button onClick={addCategory} size="sm" className="bg-green-600 hover:bg-green-700">
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
                  onChange={(e) => updateCategory(category.id, "name", e.target.value)}
                  className="flex-1 font-medium"
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">₾</span>
                  <Input
                    type="number"
                    value={category.plannedAmount}
                    onChange={(e) => updateCategory(category.id, "plannedAmount", parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                  />
                </div>
                <Button
                  onClick={() => deleteCategory(category.id)}
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
