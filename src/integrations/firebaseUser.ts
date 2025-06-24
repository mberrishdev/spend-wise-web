import { db } from "@/integrations/firebase";
import { doc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

export async function saveUserProfile(user: User) {
  if (!user) return;
  const ref = doc(db, "users", user.uid, "profile", "main");
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    lastLogin: new Date().toISOString(),
  }, { merge: true });
} 