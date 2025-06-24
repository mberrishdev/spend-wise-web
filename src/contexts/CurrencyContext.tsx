import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";

interface CurrencyContextType {
  currency: string;
}

const CurrencyContext = createContext<CurrencyContextType>({ currency: "₾" });

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [currency, setCurrency] = useState("₾");

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid, "profile", "main")).then(snap => {
      if (snap.exists()) {
        setCurrency(snap.data().currency || "₾");
      }
    });
  }, [uid]);

  return (
    <CurrencyContext.Provider value={{ currency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency() {
  return useContext(CurrencyContext);
} 