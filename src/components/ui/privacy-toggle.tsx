import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useTranslation } from "react-i18next";

interface PrivacyToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "default" | "secondary" | "ghost";
}

export const PrivacyToggle = ({ 
  className = "", 
  size = "sm", 
  variant = "outline" 
}: PrivacyToggleProps) => {
  const { showAmounts, toggleShowAmounts } = usePrivacy();
  const { t } = useTranslation();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleShowAmounts}
      className={`flex items-center gap-2 ${className}`}
    >
      {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      {showAmounts ? t('hide_amounts', 'Hide Amounts') : t('show_amounts', 'Show Amounts')}
    </Button>
  );
}; 