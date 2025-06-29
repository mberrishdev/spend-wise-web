import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "default" | "secondary" | "ghost";
  showLabel?: boolean;
}

export const ThemeToggle = ({ 
  className = "", 
  size = "sm", 
  variant = "outline",
  showLabel = false
}: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "system":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return t("settings.theme_light", "Light");
      case "dark":
        return t("settings.theme_dark", "Dark");
      case "system":
        return t("settings.theme_system", "System");
      default:
        return t("settings.theme_light", "Light");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`flex items-center gap-2 ${className}`}
      title={`${t("settings.theme")}: ${getThemeLabel()}`}
    >
      {getThemeIcon()}
      {showLabel && getThemeLabel()}
    </Button>
  );
}; 