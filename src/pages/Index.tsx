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

const Index = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [showNewPeriodPrompt, setShowNewPeriodPrompt] = useState(false);
  const { signOut, user } = useAuth();

  useEffect(() => {
    console.log(user);
  }, [user]);

  const tabs = [
    { id: "planner", label: "Budget", icon: Calendar },
    { id: "daily", label: "Log", icon: PlusCircle },
    { id: "summary", label: "Summary", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "planner":
        return <BudgetPlanner />;
      case "daily":
        return <DailyLog />;
      case "summary":
        return <Summary />;
      case "settings":
        return <Settings />;
      default:
        return <DailyLog />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 relative flex items-center justify-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
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
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              💰 SpendWise
            </h1>
            <p className="text-sm text-gray-600 text-center mt-1">
              Your mindful spending companion
            </p>
          </div>
          <button
            onClick={signOut}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 hover:text-red-600 px-2 py-1 rounded transition"
            title="Log out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-xs font-medium">
              Log out
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">{renderContent()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-green-100">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1 font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>

      {/* New Period Prompt */}
      {showNewPeriodPrompt && (
        <NewPeriodPrompt onClose={() => setShowNewPeriodPrompt(false)} />
      )}
    </div>
  );
};

export default Index;
