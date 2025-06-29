import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  showAmounts: boolean;
  setShowAmounts: (show: boolean) => void;
  toggleShowAmounts: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({ 
  showAmounts: true, 
  setShowAmounts: () => {}, 
  toggleShowAmounts: () => {} 
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAmounts, setShowAmounts] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('showAmounts');
    if (saved !== null) {
      setShowAmounts(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when changed
  const handleSetShowAmounts = (show: boolean) => {
    setShowAmounts(show);
    localStorage.setItem('showAmounts', JSON.stringify(show));
  };

  const toggleShowAmounts = () => {
    handleSetShowAmounts(!showAmounts);
  };

  return (
    <PrivacyContext.Provider value={{ 
      showAmounts, 
      setShowAmounts: handleSetShowAmounts, 
      toggleShowAmounts 
    }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
} 