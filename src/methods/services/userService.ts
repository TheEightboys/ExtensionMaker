import { db } from "./../../lib/FirebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function setUserPlanData(userId: string, plan: string, timestamp: Date) {
  // Save user plan and timestamp info in Firestore "users" collection
  const userDoc = doc(db, "users", userId);
  await setDoc(
    userDoc,
    { plan, planStartedAt: timestamp },
    { merge: true }
  );
}

export async function getUserPlanData(userId: string) {
  const userDoc = doc(db, "users", userId);
  const snap = await getDoc(userDoc);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}
