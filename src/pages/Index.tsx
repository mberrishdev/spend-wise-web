import { useEffect, useState } from "react";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { DailyLog } from "@/components/DailyLog";
import { Summary } from "@/components/Summary";
import { Settings } from "@/components/Settings";
import { NewPeriodPrompt } from "@/components/NewPeriodPrompt";
import {
  Calendar,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DashboardLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { id: "budget", label: t("budgetPlanner.budget"), icon: Calendar, path: "/dashboard/budget" },
    { id: "log", label: t("dailyLog.log"), icon: PlusCircle, path: "/dashboard/log" },
    { id: "summary", label: t("summary.summary"), icon: BarChart3, path: "/dashboard/summary" },
    { id: "settings", label: t("settings.settings"), icon: SettingsIcon, path: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm border-b border-green-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-2 sm:px-4 py-3 sm:py-4 relative flex items-center justify-center">
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            {user && (
              <Avatar>
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={user.displayName || user.email || "User"}
                />
                <AvatarFallback>
                  {user.displayName
                    ? user.displayName[0]
                    : user.email
                    ? user.email[0]
                    : "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div>
            {user && (
              <div className="text-center mt-1">
                <span className="text-base font-medium text-gray-700 dark:text-gray-100">
                  {(() => {
                    const hour = new Date().getHours();
                    let greetingKey = 'good_morning';
                    if (hour < 5) greetingKey = 'good_night';
                    else if (hour < 12) greetingKey = 'good_morning';
                    else if (hour < 18) greetingKey = 'good_afternoon';
                    else greetingKey = 'good_evening';
                    const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || t('friend', 'friend');
                    return t('greeting_name', { greeting: t(greetingKey), name });
                  })()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded transition"
            title={t('app.logout')}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-xs font-medium">
              {t('app.logout')}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border-t border-green-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                    }`
                  }
                  end
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1 font-medium">{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default DashboardLayout;
