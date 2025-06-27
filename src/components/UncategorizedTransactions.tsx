import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { useTranslation } from "react-i18next";
import { getCategories, addExpense } from "@/utils/periodManager";

interface UncategorizedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  entryType: string;
  status: string;
  importedAt: string;
  source: string;
  note?: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
  color: string;
}

export const UncategorizedTransactions = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [transactions, setTransactions] = useState<UncategorizedTransaction[]>(
    []
  );
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorizing, setCategorizing] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!uid) return;
    loadUncategorizedTransactions();
    loadCategories();
  }, [uid]);

  const loadCategories = async () => {
    if (!uid) return;
    try {
      const categoriesData = await getCategories(uid);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error loading categories",
        variant: "destructive",
      });
    }
  };

  const loadUncategorizedTransactions = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const expensesRef = collection(db, "users", uid, "expenses");
      const q = query(
        expensesRef,
        where("category", "==", "")
        // where("status", "!=", "deleted")
      );
      const querySnapshot = await getDocs(q);

      const uncategorizedTransactions: UncategorizedTransaction[] = [];
      querySnapshot.forEach((doc) => {
        uncategorizedTransactions.push(doc.data() as UncategorizedTransaction);
      });

      // Sort by date (newest first)
      uncategorizedTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const filteredTransactions = uncategorizedTransactions.filter(
        (tx) => tx.status !== "deleted"
      );

      setTransactions(filteredTransactions);

      //setTransactions(uncategorizedTransactions);
    } catch (error) {
      console.error("Error loading uncategorized transactions:", error);
      toast({
        title: "Error loading transactions",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const categorizeTransaction = async (
    transactionId: string,
    categoryId: string
  ) => {
    if (!uid) return;
    setCategorizing(transactionId);
    try {
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      if (!selectedCategory) {
        throw new Error("Category not found");
      }
      const transaction = transactions.find((t) => t.id === transactionId);
      const transactionRef = doc(db, "users", uid, "expenses", transactionId);
      await updateDoc(transactionRef, {
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        status: "categorized",
        categorizedAt: new Date().toISOString(),
      });
      // Add to dailyLogs as an expense
      if (transaction) {
        await addExpense(uid, {
          date: transaction.date,
          category: selectedCategory.name,
          categoryId: selectedCategory.id,
          amount: Math.abs(transaction.amount),
          note: transaction.description || "",
        });
      }
      // Remove from local state
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      toast({
        title: t("uncategorized.categorized", "Transaction categorized"),
        description: t("uncategorized.categorized_as", {
          category: selectedCategory.name,
          defaultValue: "Categorized as {{category}}",
        }),
      });
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      toast({
        title: t(
          "uncategorized.error_categorizing",
          "Error categorizing transaction"
        ),
        variant: "destructive",
      });
    }
    setCategorizing(null);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!uid) return;
    setCategorizing(transactionId);
    try {
      const transactionRef = doc(db, "users", uid, "expenses", transactionId);
      await updateDoc(transactionRef, {
        category: "",
        categoryId: "",
        status: "deleted",
        categorizedAt: null,
      });
      // Remove from local state so it does not reappear
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
    setCategorizing(null);
  };

  const formatAmount = (amount: number, currency: string) => {
    const sign = amount < 0 ? "-" : "";
    const absAmount = Math.abs(amount);
    return `${sign}${currency}${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Find the latest import date
  const latestImport =
    transactions.length > 0
      ? transactions.reduce((latest, t) => {
          return new Date(t.importedAt) > new Date(latest.importedAt)
            ? t
            : latest;
        }, transactions[0])
      : null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-green-200 shadow-sm bg-white dark:bg-gray-900">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            {t("uncategorized.all_categorized")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
            {t("uncategorized.all_categorized_desc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="border-orange-200 shadow-sm bg-white dark:bg-gray-900">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">📋</div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            {t("uncategorized.no_categories")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto mb-6">
            {t("uncategorized.no_categories_desc")}
          </p>
          <Button
            onClick={() => (window.location.href = "/dashboard/budget")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t("uncategorized.create_categories")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {latestImport && (
        <div className="flex items-center justify-center mb-2">
          <div className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
            <svg
              className="w-4 h-4 mr-1 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t("uncategorized.last_import", "Last import")}:{" "}
            <span className="font-semibold">
              {formatDateTime(latestImport.importedAt)}
            </span>
          </div>
        </div>
      )}
      <Card className="border-orange-200 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader className="pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                📋
              </div>
              <div>
                <div className="font-bold">
                  {t("uncategorized.title", "Uncategorized Transactions")}
                </div>
                <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {transactions.length}{" "}
                  {t(
                    "uncategorized.need_categorization",
                    "transaction(s) need categorization"
                  )}
                </div>
              </div>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUncategorizedTransactions}
                className="text-gray-600 dark:text-gray-300"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t("uncategorized.refresh", "Refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              "uncategorized.description",
              "These transactions were imported from your bank but haven't been categorized yet. Please categorize them to keep your budget organized."
            )}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch hover:shadow-md transition-shadow overflow-hidden mb-2"
            style={{ borderLeft: "6px solid #fbbf24" }} // orange-400 accent
          >
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {transaction.entryType}
                  </Badge>
                  {transaction.status === "Green" && (
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 border-green-200">
                      {transaction.status}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {t("uncategorized.id", "ID")}: {transaction.id.slice(-6)}
                </div>
              </div>
              {/* Show note if present */}
              {transaction.note && (
                <div className="mt-3 mb-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-gray-700 dark:text-gray-100 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">📝</span>
                  <span className="break-words">{transaction.note}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="inline-block">
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="4"
                          fill="#fbbf24"
                        />
                        <text
                          x="12"
                          y="16"
                          textAnchor="middle"
                          fontSize="10"
                          fill="#fff"
                        >
                          {new Date(transaction.date).getDate()}
                        </text>
                      </svg>
                    </span>
                    <span className="font-medium">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="inline-block">💰</span>
                    <span
                      className={`font-bold text-xl ${
                        transaction.amount < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {formatAmount(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="inline-block">🕒</span>
                    <span className="font-medium">
                      {t("uncategorized.imported", "Imported")}{" "}
                      {formatDate(transaction.importedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[150px]">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("uncategorized.category", "Category")}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none pr-10"
                      onChange={(e) => {
                        if (e.target.value) {
                          categorizeTransaction(transaction.id, e.target.value);
                        }
                      }}
                      disabled={categorizing === transaction.id}
                      defaultValue=""
                    >
                      <option value="">
                        {t(
                          "uncategorized.choose_category",
                          "Choose a category..."
                        )}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-800 border-l border-gray-100 dark:border-gray-800">
              <button
                onClick={() => deleteTransaction(transaction.id)}
                disabled={categorizing === transaction.id}
                className="p-2 rounded-full border border-red-200 dark:border-red-700 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-all"
                title={t("uncategorized.uncategorize", "Uncategorize")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
