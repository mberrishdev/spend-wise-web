import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { useAuth } from "@/hooks/useAuth";

type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  // Load theme from Firebase on mount
  useEffect(() => {
    const loadThemeFromFirebase = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.theme && data.theme !== theme) {
            setThemeState(data.theme as Theme);
            localStorage.setItem("theme", data.theme);
          }
        }
      } catch (error) {
        console.error("Error loading theme from Firebase:", error);
      }
    };

    loadThemeFromFirebase();
  }, [user?.uid, theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: Theme) => {
      if (t === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", isDark);
      } else {
        root.classList.toggle("dark", t === "dark");
      }
    };
    applyTheme(theme);
    localStorage.setItem("theme", theme);
    
    // Save to Firebase
    const saveThemeToFirebase = async () => {
      if (!user?.uid) return;
      
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { theme },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving theme to Firebase:", error);
      }
    };

    saveThemeToFirebase();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme, user?.uid]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}; 