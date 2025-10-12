import { db } from "./../../lib/FirebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function setUserPlanData(userId: string, plan: 'free' | 'pro', timestamp: Date) {
  // Save user plan and timestamp info in Firestore "users" collection
  const userDoc = doc(db, "users", userId);
  const userCreditsDoc = doc(db, "userCredits", userId);
  
  // Update both collections to ensure consistency
  await Promise.all([
    setDoc(userDoc, { 
      plan, 
      planStartedAt: timestamp,
      updatedAt: timestamp 
    }, { merge: true }),
    setDoc(userCreditsDoc, { 
      plan,
      updatedAt: timestamp.toISOString()
    }, { merge: true })
  ]);
}

export async function getUserPlanData(userId: string) {
  const userDoc = doc(db, "users", userId);
  const snap = await getDoc(userDoc);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}
