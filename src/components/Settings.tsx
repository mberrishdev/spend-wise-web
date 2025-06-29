import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getExpenses, archiveCurrentPeriod } from "@/utils/periodManager";
import {
  getMonthlyPeriod,
  setMonthlyPeriod,
  MonthlyPeriod,
  getCurrentPeriodRange,
  formatPeriodRange,
} from "@/utils/monthlyPeriod";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const CURRENCIES = [
  { code: "GEL", symbol: "₾" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

// Generate a secure API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { t, i18n } = useTranslation();
  const initialPeriod = useRef({ startDay: 25, endDay: 24 });
  const initialCurrency = useRef("₾");
  const initialLang = useRef(i18n.language);
  const { theme, setTheme } = useTheme();

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
        initialPeriod.current = {
          startDay: period.startDay,
          endDay: period.endDay,
        };
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setCurrency(data.currency || "₾");
          initialCurrency.current = data.currency || "₾";
          setApiKey(data.apiKey || "");
          if (data.language && data.language !== i18n.language) {
            i18n.changeLanguage(data.language);
          }
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
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

  const periodChanged =
    startDay !== initialPeriod.current.startDay ||
    endDay !== initialPeriod.current.endDay;
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
      toast({
        title: t("settings.failed_to_save_period"),
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const saveCurrency = async (newCurrency: string) => {
    if (!uid) return;
    setCurrency(newCurrency);
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid, "profile", "main"),
        { currency: newCurrency },
        { merge: true }
      );
      initialCurrency.current = newCurrency;
      toast({
        title: t("settings.currency_set", {
          code: CURRENCIES.find((c) => c.symbol === newCurrency)?.code,
          symbol: newCurrency,
        }),
      });
    } catch {
      toast({
        title: t("settings.failed_to_save_currency"),
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const saveLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    initialLang.current = lang;
    toast({ title: t("settings.language_note") });
    if (uid) {
      await setDoc(doc(db, "users", uid, "profile", "main"), { language: lang }, { merge: true });
    }
  };

  const handleThemeChange = async (newTheme: typeof theme) => {
    setTheme(newTheme);
    if (uid) {
      await setDoc(doc(db, "users", uid, "profile", "main"), { theme: newTheme }, { merge: true });
    }
  };

  const generateNewApiKey = async () => {
    if (!uid) return;
    setApiKeyLoading(true);
    try {
      const newApiKey = generateApiKey();
      await setDoc(
        doc(db, "users", uid, "profile", "main"),
        { apiKey: newApiKey },
        { merge: true }
      );
      setApiKey(newApiKey);
      setShowApiKey(true);
      toast({
        title: t("settings.api_key_generated"),
        description: t("settings.api_key_generated_desc"),
      });
    } catch (error) {
      toast({
        title: t("settings.failed_to_generate_api_key"),
        variant: "destructive",
      });
    }
    setApiKeyLoading(false);
  };

  const deleteApiKey = async () => {
    if (!uid || !apiKey) return;
    
    if (!window.confirm(t("settings.delete_api_key_confirm"))) {
      return;
    }
    
    setApiKeyLoading(true);
    try {
      await setDoc(
        doc(db, "users", uid, "profile", "main"),
        { apiKey: null },
        { merge: true }
      );
      setApiKey("");
      setShowApiKey(false);
      toast({
        title: t("settings.api_key_deleted"),
        description: t("settings.api_key_deleted_desc"),
      });
    } catch (error) {
      toast({
        title: t("settings.failed_to_delete_api_key"),
        variant: "destructive",
      });
    }
    setApiKeyLoading(false);
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: t("settings.api_key_copied"),
        description: t("settings.api_key_copied_desc"),
      });
    }
  };

  const handleArchive = async () => {
    if (!uid) return;
    
    setShowArchiveDialog(true);
  };

  const confirmArchive = async () => {
    if (!uid) return;

    setArchiving(true);
    setShowArchiveDialog(false);
    
    try {
      // Get current expenses
      const expenses = await getExpenses(uid);
      
      if (expenses.length === 0) {
        toast({
          title: t("settings.no_data_to_archive"),
          description: t("settings.no_data_to_archive_desc"),
        });
        return;
      }

      // Get current period range
      const period = await getMonthlyPeriod(uid);
      const { start, end } = getCurrentPeriodRange(period);
      
      // Archive the current period
      await archiveCurrentPeriod(uid, expenses, start, end);
      
      toast({
        title: t("settings.archive_success"),
        description: t("settings.archive_success_desc", { 
          period: formatPeriodRange(period),
          count: expenses.length 
        }),
      });
    } catch (error) {
      toast({
        title: t("settings.archive_failed"),
        description: t("settings.archive_failed_desc"),
        variant: "destructive",
      });
    }
    setArchiving(false);
  };

  // const handleStartNewPeriod = async () => {
  //   if (!uid) return;
  //   setSaving(true);
  //   try {
  //     const expenses = await getExpenses(uid);
  //     await archiveCurrentPeriod(uid, expenses);
  //     toast({
  //       title: t("settings.new_period_started"),
  //       description: t("settings.archived_and_reset"),
  //     });
  //   } catch {
  //     toast({ title: t("settings.failed_to_archive"), variant: "destructive" });
  //   }
  //   setSaving(false);
  // };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">{t("settings.loading")}</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions Section */}
      <Card className="border-orange-200 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {t("settings.quick_actions", "Quick Actions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-orange-500 text-xl">📦</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {t("settings.archive_current_period")}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t("settings.archive_note")}
              </p>
            </div>
            <Button
              onClick={handleArchive}
              variant="outline"
              className="border-orange-300 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 flex items-center justify-center min-w-[180px]"
              disabled={archiving}
            >
              {archiving ? <span className="animate-spin mr-2">⏳</span> : null}
              📦 {t("settings.archive_current_period")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <Card className="border-blue-200 shadow-sm mb-6 bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            🔑 {t("settings.api_key")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-100 mb-3">
              {t("settings.api_key_description")}
            </p>
            
            {apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => setShowApiKey(!showApiKey)}
                    variant="outline"
                    size="sm"
                  >
                    {showApiKey ? t("settings.hide") : t("settings.show")}
                  </Button>
                  <Button
                    onClick={copyApiKey}
                    variant="outline"
                    size="sm"
                  >
                    {t("settings.copy")}
                  </Button>
                  <Button
                    onClick={deleteApiKey}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    disabled={apiKeyLoading}
                  >
                    {t("settings.delete")}
                  </Button>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p>🔒 {t("settings.api_key_security_note")}</p>
                  <p>📝 {t("settings.api_key_usage_note")}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t("settings.no_api_key")}
              </p>
            )}
            
            <Button
              onClick={generateNewApiKey}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={apiKeyLoading}
            >
              {apiKeyLoading ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : null}
              {apiKey ? t("settings.generate_new_api_key") : t("settings.generate_api_key")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Period Section */}
      <Card className="border-purple-200 shadow-sm mb-6 bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t("settings.configure_budget_month")}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                {t("settings.period_section_description")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="bg-purple-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col md:flex-col gap-4">
            <div className="flex-1">
              <Label
                htmlFor="start-day"
                className="text-gray-700 dark:text-gray-100"
              >
                {t("settings.budget_month_starts")}
              </Label>
              <Input
                id="start-day"
                type="number"
                min="1"
                max="31"
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                className={`w-full dark:bg-gray-900 dark:text-gray-100 ${
                  periodError ? "border-red-400" : ""
                }`}
                aria-invalid={!!periodError}
              />
              {periodError && (
                <p className="text-xs text-red-500 mt-1">{periodError}</p>
              )}
            </div>
            <div className="flex-1">
              <Label
                htmlFor="end-day"
                className="text-gray-700 dark:text-gray-100"
              >
                {t("settings.budget_month_ends")}
              </Label>
              <Input
                id="end-day"
                type="number"
                min="1"
                max="31"
                value={endDay}
                onChange={(e) => setEndDay(parseInt(e.target.value) || 1)}
                className={`w-full dark:bg-gray-900 dark:text-gray-100 ${
                  periodError ? "border-red-400" : ""
                }`}
                aria-invalid={!!periodError}
              />
            </div>
            <Button
              onClick={savePeriod}
              className="bg-purple-600 hover:bg-purple-700 min-w-[140px] flex items-center justify-center rounded-lg shadow text-white disabled:bg-purple-300 dark:disabled:bg-purple-900"
              disabled={!periodChanged || !!periodError || saving}
            >
              {saving && periodChanged ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : null}
              {success && !saving ? (
                <span className="text-green-500 mr-2">✔️</span>
              ) : null}
              {t("settings.save_period")}
            </Button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {t("settings.eg_25")} / {t("settings.eg_24")}
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2 flex items-center gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-100 mb-1">
                {t("settings.current_period")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("settings.period_range", { startDay, endDay })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("settings.period_example")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card className="border-green-200 shadow-sm mb-6 bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            💱 {t("settings.currency")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <Label
            htmlFor="currency"
            className="text-gray-700 dark:text-gray-100"
          >
            {t("settings.currency")}
          </Label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => saveCurrency(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:text-gray-100"
            disabled={saving}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t("settings.currency_note")}
          </p>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="border-blue-200 shadow-sm mb-6 bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            🌐 {t("settings.language_label")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <Label
            htmlFor="language"
            className="text-gray-700 dark:text-gray-100"
          >
            {t("settings.language_label")}
          </Label>
          <select
            id="language"
            value={i18n.language}
            onChange={(e) => saveLanguage(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:text-gray-100"
            disabled={saving}
          >
            <option value="en">English</option>
            <option value="ka">ქართული</option>
          </select>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t("settings.language_note")}
          </p>
        </CardContent>
      </Card>

      {/* Theme Section */}
      <Card className="border-gray-200 shadow-sm mb-6 bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            🌓 {t("settings.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <div className="flex items-center gap-4">
            <Label
              htmlFor="theme-switch"
              className="flex-1 text-gray-700 dark:text-gray-100"
            >
              {t("settings.theme")}
            </Label>
            <div className="flex items-center gap-2">
              <button
                className={`px-2 py-1 rounded ${
                  theme === "system"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
                onClick={() => handleThemeChange("system")}
                type="button"
              >
                {t("settings.theme_system")}
              </button>
              <button
                className={`px-2 py-1 rounded ${
                  theme === "light"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
                onClick={() => handleThemeChange("light")}
                type="button"
              >
                {t("settings.theme_light")}
              </button>
              <button
                className={`px-2 py-1 rounded ${
                  theme === "dark"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
                onClick={() => handleThemeChange("dark")}
                type="button"
              >
                {t("settings.theme_dark")}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📦 {t("settings.archive_management")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.archive_confirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
              disabled={archiving}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmArchive}
              disabled={archiving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {archiving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("settings.loading")}
                </>
              ) : (
                <>
                  📦 {t("settings.archive_current_period")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
