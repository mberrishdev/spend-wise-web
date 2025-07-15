import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { addSavingsGoal } from "@/utils/periodManager";

export default function AddSavingsGoal({ open, onClose, onAdded, uid }: { open: boolean, onClose: () => void, onAdded: () => void, uid: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [trackingDay, setTrackingDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !targetAmount || !fromDate || !toDate || !trackingDay) {
      setError(t("savings.fill_required", "Please fill all required fields"));
      return;
    }
    const day = parseInt(trackingDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setError(t("savings.tracking_day_invalid", "Tracking day must be between 1 and 31"));
      return;
    }
    setLoading(true);
    try {
      await addSavingsGoal(uid, {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        fromDate,
        toDate,
        completed: false,
        trackingDay: day,
      });
      setName(""); setTargetAmount(""); setFromDate(""); setToDate(""); setCurrentAmount(""); setTrackingDay("");
      onAdded();
      onClose();
    } catch (err) {
      setError(t("savings.failed_to_add", "Failed to add savings goal"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("savings.add_goal", "Add Goal")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.goal_name", "Goal Name")}</label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("savings.target", "Target")}</label>
              <Input type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("savings.saved", "Saved")}</label>
              <Input type="number" min="0" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("savings.from_date", "From Date")}</label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("savings.to_date", "To Date")}</label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.tracking_day", "Tracking Day (1-31)")}</label>
            <Input type="number" min="1" max="31" value={trackingDay} onChange={e => setTrackingDay(e.target.value)} required />
            <div className="text-xs text-gray-500 mt-1">{t("savings.tracking_day_hint", "Which day of the month do you want to log your balance?")}</div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{t("savings.add_goal", "Add Goal")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 