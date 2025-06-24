// NOTE: This file must be .tsx because it contains JSX.
import { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/integrations/firebase";
import { saveUserProfile } from "@/integrations/firebaseUser";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        localStorage.setItem("spendwise-uid", user.uid);
        await saveUserProfile(user);
      } else {
        localStorage.removeItem("spendwise-uid");
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
} 