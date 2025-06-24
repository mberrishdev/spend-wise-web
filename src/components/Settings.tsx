import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { archiveCurrentPeriod, getExpenses } from "@/utils/periodManager";
import {
  getMonthlyPeriod,
  setMonthlyPeriod,
  MonthlyPeriod,
} from "@/utils/monthlyPeriod";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { useTranslation } from "react-i18next";

const CURRENCIES = [
  { code: "GEL", symbol: "₾" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

export const Settings = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [startDay, setStartDay] = useState(25);
  const [endDay, setEndDay] = useState(24);
  const [currency, setCurrency] = useState("₾");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t, i18n } = useTranslation();
  const initialPeriod = useRef({ startDay: 25, endDay: 24 });
  const initialCurrency = useRef("₾");
  const initialLang = useRef(i18n.language);

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
        initialPeriod.current = { startDay: period.startDay, endDay: period.endDay };
        if (profileSnap.exists()) {
          setCurrency(profileSnap.data().currency || "₾");
          initialCurrency.current = profileSnap.data().currency || "₾";
        }
        initialLang.current = i18n.language;
        setLoading(false);
      })
      .catch(() => {
        setError(t("settings.failed_to_load_settings"));
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [uid]);

  const periodChanged = startDay !== initialPeriod.current.startDay || endDay !== initialPeriod.current.endDay;
  const currencyChanged = currency !== initialCurrency.current;
  const langChanged = i18n.language !== initialLang.current;

  const validatePeriod = () => {
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      setPeriodError(t("settings.invalid_day_range"));
      return false;
    }
    setPeriodError(null);
    return true;
  };

  const savePeriod = async () => {
    if (!validatePeriod() || !uid) return;
    setSaving(true);
    try {
      await setMonthlyPeriod(uid, { startDay, endDay });
      initialPeriod.current = { startDay, endDay };
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
      toast({
        title: t("settings.monthly_period_saved"),
        description: t("settings.budget_month_range", { startDay, endDay }),
      });
    } catch {
      toast({ title: t("settings.failed_to_save_period"), variant: "destructive" });
    }
    setSaving(false);
  };

  const saveCurrency = async (newCurrency: string) => {
    if (!uid) return;
    setCurrency(newCurrency);
    setSaving(true);
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { currency: newCurrency }, { merge: true });
      initialCurrency.current = newCurrency;
      toast({ title: t("settings.currency_set", { code: CURRENCIES.find(c => c.symbol === newCurrency)?.code, symbol: newCurrency }) });
    } catch {
      toast({ title: t("settings.failed_to_save_currency"), variant: "destructive" });
    }
    setSaving(false);
  };

  const saveLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    initialLang.current = lang;
    toast({ title: t("settings.language_note") });
  };

  const handleStartNewPeriod = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const expenses = await getExpenses(uid);
      await archiveCurrentPeriod(uid, expenses);
      toast({
        title: t("settings.new_period_started"),
        description: t("settings.archived_and_reset"),
      });
    } catch {
      toast({ title: t("settings.failed_to_archive"), variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">{t("loading")}</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Budget Period Section */}
      <Card className="border-purple-200 shadow-sm mb-6">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                {t("settings.configure_budget_month")}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.period_section_description")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="bg-purple-50 rounded-lg p-4 flex flex-col md:flex-col md:items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="start-day">{t("settings.budget_month_starts")}</Label>
              <Input
                id="start-day"
                type="number"
                min="1"
                max="31"
                value={startDay}
                onChange={e => setStartDay(parseInt(e.target.value) || 1)}
                className={`w-full ${periodError ? "border-red-400" : ""}`}
                aria-invalid={!!periodError}
              />
              {periodError && (
                <p className="text-xs text-red-500 mt-1">{periodError}</p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="end-day">{t("settings.budget_month_ends")}</Label>
              <Input
                id="end-day"
                type="number"
                min="1"
                max="31"
                value={endDay}
                onChange={e => setEndDay(parseInt(e.target.value) || 1)}
                className={`w-full ${periodError ? "border-red-400" : ""}`}
                aria-invalid={!!periodError}
              />
            </div>
            <Button
              onClick={savePeriod}
              className="bg-purple-600 hover:bg-purple-700 min-w-[140px] flex items-center justify-center rounded-lg shadow"
              disabled={!periodChanged || !!periodError || saving}
            >
              {saving && periodChanged ? <span className="animate-spin mr-2">⏳</span> : null}
              {success && !saving ? <span className="text-green-500 mr-2">✔️</span> : null}
              {t("settings.save_period")}
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-2">{t("settings.eg_25")} / {t("settings.eg_24")}</p>
          <div className="bg-gray-50 p-4 rounded-lg mt-2 flex items-center gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t("settings.current_period")}</h4>
              <p className="text-sm text-gray-600">{t("settings.period_range", { startDay, endDay })}</p>
              <p className="text-xs text-gray-500 mt-1">{t("settings.period_example")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card className="border-green-200 shadow-sm mb-6">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            💱 {t("currency")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <Label htmlFor="currency">{t("currency")}</Label>
          <select
            id="currency"
            value={currency}
            onChange={e => saveCurrency(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={saving}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600">{t("settings.currency_note")}</p>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="border-blue-200 shadow-sm mb-6">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            🌐 {t("settings.language_label")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <Label htmlFor="language">{t("settings.language_label")}</Label>
          <select
            id="language"
            value={i18n.language}
            onChange={e => saveLanguage(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={saving}
          >
            <option value="en">English</option>
            <option value="ka">ქართული</option>
          </select>
          <p className="text-xs text-gray-600">{t("settings.language_note")}</p>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card className="border-orange-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            🔄 {t("settings.period_management")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="bg-orange-50 p-4 rounded-lg space-y-3">
            <p className="text-sm text-gray-700">{t("settings.archive_note")}</p>
            <Button
              onClick={handleStartNewPeriod}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center justify-center"
              disabled={saving}
            >
              {saving ? <span className="animate-spin mr-2">⏳</span> : null}
              {t("settings.start_new_period")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
