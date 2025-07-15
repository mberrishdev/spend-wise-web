import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSavingsGoals, updateSavingsGoal, getMonthlyBalances, addMonthlyBalance, SavingsGoal, MonthlyBalance, deleteSavingsGoal } from "@/utils/periodManager";
import { useTranslation } from "react-i18next";
import AddSavingsGoal from "@/components/AddSavingsGoal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const Savings = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  // Remove Add Money state and handler
  // const [addTxGoalId, setAddTxGoalId] = useState<string | null>(null);
  // const [txAmount, setTxAmount] = useState("");
  // const [txDate, setTxDate] = useState("");
  // const [txNote, setTxNote] = useState("");
  // const [txLoading, setTxLoading] = useState(false);
  // const [txError, setTxError] = useState("");

  // Remove handleAddMoney function
  // const handleAddMoney = async () => { ... }

  const [logBalanceGoalId, setLogBalanceGoalId] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDate, setBalanceDate] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balances, setBalances] = useState<Record<string, MonthlyBalance[]>>({});
  const [detailsGoal, setDetailsGoal] = useState<SavingsGoal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getSavingsGoals(uid)
      .then(async (goals) => {
        setGoals(goals);
        // Fetch balances for all goals in parallel
        const balancesEntries = await Promise.all(
          goals.map(async (goal) => {
            const b = await getMonthlyBalances(uid, goal.id);
            return [goal.id, b.sort((a, b) => b.date.localeCompare(a.date))] as [string, MonthlyBalance[]];
          })
        );
        setBalances(Object.fromEntries(balancesEntries));
      })
      .finally(() => setLoading(false));
  }, [uid]);

  // Remove Add Money handler
  // const handleAddMoney = async () => { ... }

  const openLogBalance = async (goal: SavingsGoal) => {
    setLogBalanceGoalId(goal.id);
    // Default date: this month, tracking day
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = (goal.trackingDay || 1).toString().padStart(2, "0");
    setBalanceDate(`${year}-${month}-${day}`);
    setBalanceAmount("");
    setBalanceError("");
    // Load balances for this goal if not loaded
    if (!balances[goal.id]) {
      if (uid) {
        const b = await getMonthlyBalances(uid, goal.id);
        setBalances(prev => ({ ...prev, [goal.id]: b.sort((a, b) => b.date.localeCompare(a.date)) }));
      }
    }
  };

  const handleLogBalance = async () => {
    if (!uid || !logBalanceGoalId || !balanceAmount || !balanceDate) return;
    setBalanceLoading(true);
    setBalanceError("");
    try {
      await addMonthlyBalance(uid, logBalanceGoalId, {
        date: balanceDate,
        amount: parseFloat(balanceAmount),
      });
      // Update goal's currentAmount to the new balance
      await updateSavingsGoal(uid, logBalanceGoalId, {
        currentAmount: parseFloat(balanceAmount),
      });
      // Refresh balances for this goal
      const b = await getMonthlyBalances(uid, logBalanceGoalId);
      setBalances(prev => ({ ...prev, [logBalanceGoalId]: b.sort((a, b) => b.date.localeCompare(a.date)) }));
      if (uid) getSavingsGoals(uid).then(setGoals);
      setBalanceAmount("");
      setLogBalanceGoalId(null);
    } catch (err) {
      setBalanceError(t("savings.failed_to_log_balance", "Failed to log balance"));
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleDeleteBalance = async (goalId: string, balanceId: string) => {
    if (!uid) return;
    if (!window.confirm(t("savings.confirm_delete_balance", "Delete this balance entry?"))) return;
    await deleteDoc(doc(db, "users", uid, "savingsGoals", goalId, "balances", balanceId));
    const b = await getMonthlyBalances(uid, goalId);
    setBalances(prev => ({ ...prev, [goalId]: b.sort((a, b) => b.date.localeCompare(a.date)) }));
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!uid) return;
    if (!window.confirm(t("savings.confirm_delete_goal", "Delete this savings goal and all its balances?"))) {
      setShowDeleteModal(null);
      return;
    }
    setShowDeleteModal(null); // Close modal
    try {
      await deleteSavingsGoal(uid, goalId);
      getSavingsGoals(uid).then(setGoals);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            🏦 {t("savings.title", "Savings Goals")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("savings.description", "Track and achieve your savings goals")}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button onClick={() => setShowAdd(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {t("savings.add_goal", "Add Goal")}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">{t("loading")}</div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("savings.no_goals", "No savings goals yet")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("savings.start_tracking", "Start tracking your savings goals")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <Card key={goal.id} className="rounded-xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center px-4 pt-4">
                  <CardTitle className="text-xl font-bold">{goal.name}</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowDeleteModal(goal.id)}
                          aria-label={t('delete')}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t('savings.delete_goal')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardContent className="pt-2 pb-4 px-4">
                  <div className="mb-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t("savings.target", "Target")}: {goal.targetAmount}
                  </div>
                  <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {t("savings.saved", "Saved")}: {goal.currentAmount}
                  </div>
                  <div className="my-4">
                    <Progress value={percent} />
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    {t("savings.progress", "Progress")}: {percent.toFixed(1)}%
                  </div>
                  <div className="flex mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Button
                      className="w-1/2 h-12 text-base font-medium rounded-none rounded-l-xl justify-center items-center"
                      onClick={() => openLogBalance(goal)}
                    >
                      {t('savings.log_balance')}
                    </Button>
                    <Button
                      className="w-1/2 h-12 text-base font-medium rounded-none rounded-r-xl justify-center items-center bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700"
                      variant="outline"
                      onClick={() => setDetailsGoal(goal)}
                    >
                      {t('savings.view_details')}
                    </Button>
                  </div>
                  {balances[goal.id] && balances[goal.id].length > 0 && (
                    <div className="mt-6">
                      <div className="font-semibold text-xs mb-1">{t("savings.balance_history", "Balance History")}</div>
                      <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="p-2 text-left">{t("savings.date", "Date")}</th>
                            <th className="p-2 text-right">{t("savings.amount", "Amount")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {balances[goal.id].map(b => (
                            <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <td className="p-2 align-middle">{b.date}</td>
                              <td className="p-2 text-right align-middle">
                                {b.amount}
                                <button
                                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-gray-900 transition align-middle"
                                  title={t('delete')}
                                  onClick={() => handleDeleteBalance(goal.id, b.id)}
                                  type="button"
                                >
                                  <Trash2 className="inline w-4 h-4 align-middle" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AddSavingsGoal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          if (uid) getSavingsGoals(uid).then(setGoals);
        }}
        uid={uid}
      />
      {/* Remove Add Money Dialog */}
      {/*
      <Dialog open={!!addTxGoalId} onOpenChange={v => !v && setAddTxGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("savings.add_money", "Add Money")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleAddMoney(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.amount", "Amount")}</label>
              <Input type="number" min="0.01" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.date", "Date")}</label>
              <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} placeholder={t("savings.date_placeholder", "Select date")}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.note", "Note")}</label>
              <Textarea value={txNote} onChange={e => setTxNote(e.target.value)} rows={2} />
            </div>
            {txError && <div className="text-red-500 text-sm">{txError}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddTxGoalId(null)} disabled={txLoading}>{t("cancel")}</Button>
              <Button type="submit" disabled={txLoading || !txAmount}>{t("savings.add_money", "Add Money")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      */}
      <Dialog open={!!logBalanceGoalId} onOpenChange={v => !v && setLogBalanceGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("savings.log_balance", "Log Balance")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleLogBalance(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.amount", "Amount")}</label>
              <Input type="number" min="0.01" step="0.01" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.date", "Date")}</label>
              <Input type="date" value={balanceDate} onChange={e => setBalanceDate(e.target.value)} required />
            </div>
            {balanceError && <div className="text-red-500 text-sm">{balanceError}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLogBalanceGoalId(null)} disabled={balanceLoading}>{t("cancel")}</Button>
              <Button type="submit" disabled={balanceLoading || !balanceAmount}>{t("savings.log_balance", "Log Balance")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!detailsGoal} onOpenChange={v => !v && setDetailsGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailsGoal?.name}</DialogTitle>
          </DialogHeader>
          {detailsGoal && (
            <div className="space-y-2">
              <div><b>{t("savings.target")}</b>: {detailsGoal.targetAmount}</div>
              <div><b>{t("savings.saved")}</b>: {detailsGoal.currentAmount}</div>
              <div><b>{t("savings.progress")}</b>: {Math.min(100, (detailsGoal.currentAmount / detailsGoal.targetAmount) * 100).toFixed(1)}%</div>
              <div><b>{t("savings.from_date")}</b>: {detailsGoal.fromDate}</div>
              <div><b>{t("savings.to_date")}</b>: {detailsGoal.toDate}</div>
              <div><b>{t("savings.tracking_day")}</b>: {detailsGoal.trackingDay}</div>
              <div className="mt-4">
                <div className="font-semibold text-xs mb-1">{t("savings.balance_history", "Balance History")}</div>
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-1 text-left">{t("savings.date", "Date")}</th>
                      <th className="p-1 text-right">{t("savings.amount", "Amount")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances[detailsGoal.id]?.map(b => (
                      <tr key={b.id}>
                        <td className="p-1">{b.date}</td>
                        <td className="p-1 text-right">{b.amount}</td>
                        <td className="p-1 text-right">
                          <button
                            className="text-red-500 hover:text-red-700"
                            title={t("delete")}
                            onClick={() => handleDeleteBalance(detailsGoal.id, b.id)}
                            type="button"
                          >
                            <Trash2 className="inline w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!showDeleteModal} onOpenChange={v => !v && setShowDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("savings.confirm_delete_goal", "Delete Savings Goal")}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Trash2 className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t("savings.confirm_delete_goal_text", "Are you sure you want to delete this savings goal and all its balances?")}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>{t("cancel")}</Button>
              <Button variant="destructive" onClick={() => handleDeleteGoal(showDeleteModal!)}>{t("delete")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Savings; 