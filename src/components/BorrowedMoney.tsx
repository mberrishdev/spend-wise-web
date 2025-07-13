import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, Pencil, Trash2, Check, X, DollarSign, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useTranslation } from "react-i18next";
import { PrivacyToggle } from "@/components/ui/privacy-toggle";
import { getBorrowedMoney, addBorrowedMoney, deleteBorrowedMoney, updateBorrowedMoney } from "@/utils/periodManager";

interface BorrowedMoney {
  id: string;
  date: string;
  amount: number;
  description: string;
  friendName: string;
  returnDate?: string;
  isReturned: boolean;
  returnedDate?: string;
}

export const BorrowedMoney = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const { showAmounts } = usePrivacy();
  const [borrowedMoney, setBorrowedMoney] = useState<BorrowedMoney[]>([]);
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFriendName, setEditFriendName] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");

  // Load data from Firestore
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    getBorrowedMoney(uid)
      .then((data) => {
        setBorrowedMoney(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(t('borrowedMoney.failed_to_load_data'));
        setLoading(false);
      });
  }, [uid, t]);

  const handleAddBorrowedMoney = async () => {
    if (!friendName.trim() || !amount) {
      toast({
        title: t('borrowedMoney.fill_all_fields'),
        variant: "destructive",
      });
      return;
    }
    if (!uid) return;
    
    const newBorrowedMoney = {
      date: new Date().toISOString().split('T')[0], // Automatic creation date
      friendName: friendName.trim(),
      amount: parseFloat(amount),
      description: description.trim(),
      returnDate: returnDate || null, // Optional return date
      isReturned: false,
    };
    
    try {
      await addBorrowedMoney(uid, newBorrowedMoney);
      setBorrowedMoney([{ id: "pending", ...newBorrowedMoney }, ...borrowedMoney]); // Optimistic update
      setFriendName("");
      setAmount("");
      setDescription("");
      toast({
        title: t('borrowedMoney.money_borrowed'),
        description: t('borrowedMoney.borrowed_to', { currency, amount, friendName: friendName.trim() }),
      });
      // Reload from Firestore to get real id
      const updated = await getBorrowedMoney(uid);
      setBorrowedMoney(updated);
    } catch (err) {
      toast({
        title: t('borrowedMoney.failed_to_add'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteBorrowedMoney = async (borrowedMoneyId: string) => {
    if (!uid) return;
    await deleteBorrowedMoney(uid, borrowedMoneyId);
    setBorrowedMoney(borrowedMoney.filter(b => b.id !== borrowedMoneyId));
    toast({ title: t('borrowedMoney.record_deleted') });
  };

  const handleMarkAsReturned = async (borrowedMoneyId: string) => {
    if (!uid) return;
    const returnedDate = new Date().toISOString().split('T')[0];
    await updateBorrowedMoney(uid, borrowedMoneyId, {
      isReturned: true,
      returnedDate,
    });
    setBorrowedMoney(borrowedMoney.map(b => 
      b.id === borrowedMoneyId 
        ? { ...b, isReturned: true, returnedDate }
        : b
    ));
    toast({ title: t('borrowedMoney.marked_as_returned') });
  };

  const startEdit = (borrowedMoney: BorrowedMoney) => {
    setEditingId(borrowedMoney.id);
    setEditAmount(borrowedMoney.amount.toString());
    setEditDescription(borrowedMoney.description || "");
    setEditFriendName(borrowedMoney.friendName);
    setEditReturnDate(borrowedMoney.returnDate || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDescription("");
    setEditFriendName("");
    setEditReturnDate("");
  };

  const saveEdit = async (borrowedMoneyItem: BorrowedMoney) => {
    if (!uid) return;
    await updateBorrowedMoney(uid, borrowedMoneyItem.id, {
      amount: parseFloat(editAmount),
      description: editDescription,
      friendName: editFriendName,
      returnDate: editReturnDate || null,
    });
    setBorrowedMoney(borrowedMoney.map(b => 
      b.id === borrowedMoneyItem.id 
        ? { ...b, amount: parseFloat(editAmount), description: editDescription, friendName: editFriendName, returnDate: editReturnDate || null }
        : b
    ));
    setEditingId(null);
    toast({ title: t('borrowedMoney.record_updated') });
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
  
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  const activeBorrowedMoney = borrowedMoney.filter(b => !b.isReturned)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const returnedBorrowedMoney = borrowedMoney.filter(b => b.isReturned)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalActive = activeBorrowedMoney.reduce((sum, b) => sum + b.amount, 0);
  const totalReturned = returnedBorrowedMoney.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            💰 {t("borrowedMoney.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("borrowedMoney.description")}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <PrivacyToggle />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {t("borrowedMoney.active_borrowed")}
                </p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {showAmounts ? `${currency} ${totalActive.toFixed(2)}` : "***"}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t("borrowedMoney.total_returned")}
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {showAmounts ? `${currency} ${totalReturned.toFixed(2)}` : "***"}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Borrowed Money Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            {t("borrowedMoney.add_new")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddBorrowedMoney();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("borrowedMoney.friend_name")}
                </label>
                <Input
                  type="text"
                  placeholder={t("borrowedMoney.friend_name_placeholder")}
                  value={friendName}
                  onChange={e => setFriendName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-32 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("borrowedMoney.amount")}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-48 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("borrowedMoney.return_date")}
                </label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full"
                  placeholder={t("borrowedMoney.return_date_optional")}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={!friendName.trim() || !amount}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t("borrowedMoney.add")}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("borrowedMoney.description")}
              </label>
              <Textarea
                placeholder={t("borrowedMoney.description_placeholder")}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full"
                rows={2}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Borrowed Money */}
      {activeBorrowedMoney.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("borrowedMoney.active_borrowed")} ({activeBorrowedMoney.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBorrowedMoney.map((borrowed) => (
                <div
                  key={borrowed.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {borrowed.friendName}
                      </h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {showAmounts ? `${currency} ${borrowed.amount.toFixed(2)}` : "***"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {t("borrowedMoney.created_on")} {new Date(borrowed.date).toLocaleDateString()}
                      </span>
                      {borrowed.returnDate && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Calendar className="w-4 h-4" />
                          {t("borrowedMoney.return_by")} {new Date(borrowed.returnDate).toLocaleDateString()}
                        </span>
                      )}
                      {borrowed.description && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {borrowed.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsReturned(borrowed.id)}
                      className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t("borrowedMoney.mark_returned")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(borrowed)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBorrowedMoney(borrowed.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returned Borrowed Money */}
      {returnedBorrowedMoney.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              {t("borrowedMoney.returned")} ({returnedBorrowedMoney.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {returnedBorrowedMoney.map((borrowed) => (
                <div
                  key={borrowed.id}
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {borrowed.friendName}
                      </h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {showAmounts ? `${currency} ${borrowed.amount.toFixed(2)}` : "***"}
                      </Badge>
                      <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                        {t("borrowedMoney.returned")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {t("borrowedMoney.created_on")} {new Date(borrowed.date).toLocaleDateString()}
                      </span>
                      {borrowed.returnDate && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Calendar className="w-4 h-4" />
                          {t("borrowedMoney.return_by")} {new Date(borrowed.returnDate).toLocaleDateString()}
                        </span>
                      )}
                      {borrowed.returnedDate && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          {t("borrowedMoney.returned_on")} {new Date(borrowed.returnedDate).toLocaleDateString()}
                        </span>
                      )}
                      {borrowed.description && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {borrowed.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(borrowed)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBorrowedMoney(borrowed.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {borrowedMoney.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("borrowedMoney.no_records")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("borrowedMoney.start_tracking")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("borrowedMoney.edit_record")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("borrowedMoney.friend_name")}
                </label>
                <Input
                  type="text"
                  value={editFriendName}
                  onChange={(e) => setEditFriendName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("borrowedMoney.amount")}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("borrowedMoney.return_date")}
                </label>
                <Input
                  type="date"
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  placeholder={t("borrowedMoney.return_date_optional")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("borrowedMoney.description")}
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveEdit(borrowedMoney.find(b => b.id === editingId)!)}
                  className="flex-1"
                >
                  {t("borrowedMoney.save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="flex-1"
                >
                  {t("borrowedMoney.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 