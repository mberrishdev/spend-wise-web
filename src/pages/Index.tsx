import { useEffect, useState } from "react";
import {
  Calendar,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  FileText,
  TrendingUp,
  Lightbulb,
  Home,
  Menu,
  X,
  Archive,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const getGreeting = (
  t: ReturnType<typeof useTranslation>["t"],
  user: User | null
) => {
  const hour = new Date().getHours();
  let greetingKey = "good_morning";
  if (hour < 5) greetingKey = "good_night";
  else if (hour < 12) greetingKey = "good_morning";
  else if (hour < 18) greetingKey = "good_afternoon";
  else greetingKey = "good_evening";
  const name =
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    t("friend", "friend");
  return t("greeting_name", { greeting: t(greetingKey), name });
};

const DashboardLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [greeting, setGreeting] = useState(() => getGreeting(t, user));

  useEffect(() => {
    setGreeting(getGreeting(t, user));
    if (!user) return;
    const interval = setInterval(() => {
      setGreeting(getGreeting(t, user));
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [t, user]);

  const navigationItems = [
    {
      id: "log",
      label: t("dailyLog.log"),
      icon: PlusCircle,
      path: "/dashboard/log",
    },
    {
      id: "budget",
      label: t("budgetPlanner.budget"),
      icon: Calendar,
      path: "/dashboard/budget",
    },
    {
      id: "analytics",
      label: t("analytics.analytics"),
      icon: BarChart3,
      path: "/dashboard/analytics",
    },
    {
      id: "advisor",
      label: t("advisor.advisor"),
      icon: Lightbulb,
      path: "/dashboard/advisor",
    },
    {
      id: "summary",
      label: t("summary.summary"),
      icon: TrendingUp,
      path: "/dashboard/summary",
    },
    {
      id: "archive",
      label: t("archive.title"),
      icon: Archive,
      path: "/dashboard/archive",
    },
    {
      id: "borrowed-money",
      label: t("borrowedMoney.title"),
      icon: DollarSign,
      path: "/dashboard/borrowed-money",
    },
    {
      id: "uncategorized",
      label: t("uncategorized.title"),
      icon: FileText,
      path: "/dashboard/uncategorized-transactions",
    },
    {
      id: "savings",
      label: t("savings.title", "Savings Goals"),
      icon: PiggyBank,
      path: "/dashboard/savings",
    },
    {
      id: "settings",
      label: t("settings.settings"),
      icon: SettingsIcon,
      path: "/dashboard/settings",
    },
  ];

  const quickActions = [
    {
      id: "add-expense",
      label: t("add"),
      icon: PlusCircle,
      action: () => (window.location.href = "/dashboard/log"),
    },
    {
      id: "view-analytics",
      label: t("analytics.analytics"),
      icon: BarChart3,
      action: () => (window.location.href = "/dashboard/analytics"),
    },
  ];

  // Mobile navigation items
  const mobileNavItems = [
    {
      to: "/dashboard/log",
      icon: PlusCircle,
      label: t("navigation.add"),
    },
    {
      to: "/dashboard/analytics",
      icon: BarChart3,
      label: t("navigation.analytics"),
    },
    {
      to: "/dashboard/budget",
      icon: Calendar,
      label: t("navigation.budget"),
    },
    {
      action: () => setSidebarOpen(true),
      icon: Menu,
      label: t("navigation.more"),
    },
  ];

  return (
    <div className="flex min-h-screen h-auto bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-gradient-to-br fixed inset-y-0 left-0 z-50 w-64 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                SpendWise
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 rounded-xl mx-3 mt-4 mb-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center gap-2 shadow-sm">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="w-12 h-12 shadow-md">
                <AvatarImage
                  src={user?.photoURL || undefined}
                  alt={user?.displayName || user?.email || "User"}
                />
                <AvatarFallback className="text-lg">
                  {user?.displayName
                    ? user.displayName[0]
                    : user?.email
                    ? user.email[0]
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title={t("app.logout")}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
            <div>
              <p className="text-xs text-gray-900 dark:text-gray-400 truncate mt-0.5">
                {greeting}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 border-r-2 border-green-500"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                    }`
                  }
                >
                  <Icon
                    className={`w-5 h-5 ${
                      location.pathname === item.path
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top Header */}
        <div className="dark:bg-gray-900/90 backdrop-blur-sm border-b border-green-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm">
          <div className="flex flex-col gap-0 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </Button>
                  );
                })}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only for essential actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border-t border-green-100 dark:border-gray-800 lg:hidden">
        <div className="flex justify-around py-2">
          {mobileNavItems.map((item, index) => {
            const IconComponent = item.icon;

            if (item.to) {
              return (
                <NavLink
                  key={index}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                    }`
                  }
                >
                  <IconComponent size={20} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </NavLink>
              );
            } else {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  <IconComponent size={20} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              );
            }
          })}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-16 lg:hidden"></div>
    </div>
  );
};

export default DashboardLayout;
