import { doc, runTransaction, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/FirebaseClient';
import type { PlanType } from '../types/plans';

export interface PlanData {
  plan: PlanType;
  planStartedAt: string;
  lastPaymentDate: string;
  paymentId?: string;
  paymentAmount?: number;
  updatedAt: string;
}

export const updateUserPlan = async (
  userId: string,
  planType: PlanType,
  paymentDetails?: {
    sessionId: string;
    amount: number;
  }
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    
    await runTransaction(db, async (transaction) => {
      const userCreditsRef = doc(db, 'userCredits', userId);
      const userRef = doc(db, 'users', userId);
      
      // Read current state
      const userCreditsDoc = await transaction.get(userCreditsRef);
      const userDoc = await transaction.get(userRef);
      
      if (!userCreditsDoc.exists() && !userDoc.exists()) {
        throw new Error('User documents not found');
      }
      
      // Update userCredits collection
      const creditsUpdate = {
        plan: planType,
        updatedAt: now
      };
      
      if (planType === 'pro') {
        Object.assign(creditsUpdate, {
          credits: 200,
          creditsRemaining: 200,
          totalCredits: 200,
          maxCredits: 200
        });
      }
      
      transaction.set(userCreditsRef, creditsUpdate, { merge: true });
      
      // Update users collection
      const userUpdate: PlanData = {
        plan: planType,
        planStartedAt: now,
        lastPaymentDate: now,
        updatedAt: now
      };
      
      if (paymentDetails) {
        userUpdate.paymentId = paymentDetails.sessionId;
        userUpdate.paymentAmount = paymentDetails.amount;
      }
      
      transaction.set(userRef, userUpdate, { merge: true });
    });
    
    return true;
  } catch (error) {
    console.error('Failed to update user plan:', error);
    return false;
  }
};

export const setupPlanListener = (
  userId: string,
  callback: (planData: PlanData) => void
): () => void => {
  // Listen to both collections
  const userRef = doc(db, 'users', userId);
  const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
    const data = snapshot.data() as PlanData;
    if (data) {
      callback(data);
    }
  });
  
  return () => {
    unsubscribeUser();
  };
};