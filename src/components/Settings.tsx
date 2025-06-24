import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { archiveCurrentPeriod, getExpenses } from "@/utils/periodManager";
import { getMonthlyPeriod, setMonthlyPeriod, MonthlyPeriod } from "@/utils/monthlyPeriod";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";

const CURRENCIES = [
  { code: "GEL", symbol: "₾" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "INR", symbol: "₹" },
];

export const Settings = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [startDay, setStartDay] = useState(25);
  const [endDay, setEndDay] = useState(24);
  const [currency, setCurrency] = useState("₾");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getMonthlyPeriod(uid),
      getDoc(doc(db, "users", uid, "profile", "main")),
    ])
      .then(([period, profileSnap]) => {
        setStartDay(period.startDay);
        setEndDay(period.endDay);
        if (profileSnap.exists()) {
          setCurrency(profileSnap.data().currency || "₾");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load settings");
        setLoading(false);
      });
  }, [uid]);

  const savePeriod = async () => {
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      toast({
        title: "Invalid day range",
        description: "Days must be between 1 and 31",
        variant: "destructive",
      });
      return;
    }
    if (!uid) return;
    const period: MonthlyPeriod = { startDay, endDay };
    try {
      await setMonthlyPeriod(uid, period);
      toast({
        title: "Monthly period saved! 🎉",
        description: `Your budget month now runs from ${startDay}th to ${endDay}th`,
      });
    } catch {
      toast({ title: "Failed to save period", variant: "destructive" });
    }
  };

  const saveCurrency = async (newCurrency: string) => {
    if (!uid) return;
    setCurrency(newCurrency);
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { currency: newCurrency }, { merge: true });
      const currencyObj = CURRENCIES.find(c => c.symbol === newCurrency);
      toast({ title: `Currency set to ${currencyObj?.code || newCurrency} (${newCurrency})` });
    } catch {
      toast({ title: "Failed to save currency", variant: "destructive" });
    }
  };

  const handleStartNewPeriod = async () => {
    if (!uid) return;
    try {
      const expenses = await getExpenses(uid);
      await archiveCurrentPeriod(uid, expenses);
      toast({
        title: "New period started! 🎉",
        description: "Previous expenses have been archived and your budget is reset.",
      });
    } catch {
      toast({ title: "Failed to archive period", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            ⚙️ Monthly Period Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure when your budget month starts and ends
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-day">Budget month starts on day:</Label>
              <Input
                id="start-day"
                type="number"
                min="1"
                max="31"
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <p className="text-xs text-gray-600">
                e.g., 25 = 25th of each month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-day">Budget month ends on day:</Label>
              <Input
                id="end-day"
                type="number"
                min="1"
                max="31"
                value={endDay}
                onChange={(e) => setEndDay(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <p className="text-xs text-gray-600">
                e.g., 24 = 24th of next month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency:</Label>
              <select
                id="currency"
                value={currency}
                onChange={e => saveCurrency(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.symbol}>{c.code} ({c.symbol})</option>
                ))}
              </select>
              <p className="text-xs text-gray-600">
                This currency symbol will be used throughout the app.
              </p>
            </div>

            <Button onClick={savePeriod} className="w-full bg-purple-600 hover:bg-purple-700">
              Save Monthly Period
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Current Period:</h4>
            <p className="text-sm text-gray-600">
              Your budget month runs from the <strong>{startDay}th</strong> of each month 
              to the <strong>{endDay}th</strong> of the following month.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Example: June 25th → July 24th
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            🔄 Period Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manually start a new budget period
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-4 rounded-lg space-y-3">
            <p className="text-sm text-gray-700">
              This will archive all current expenses and reset your spending to ₾0 while keeping your budget categories.
            </p>
            <Button 
              onClick={handleStartNewPeriod} 
              variant="outline" 
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Start New Period
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
