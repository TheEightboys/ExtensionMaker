// src/hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/FirebaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface UserData {
  credits: number;
  maxCredits: number;
  plan: 'free' | 'pro' | 'basic';
  subscriptionPlan?: string;
  billingPeriod?: 'monthly' | 'yearly';
  subscriptionDate?: string;
  nextRenewalDate?: string;
  paymentAmount?: number;
  dailyPromptsUsed: number;
  lastDailyReset: string;
  monthlyCreditsUsed: number;
  lastMonthlyReset: string;
}

export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'userCredits', user.uid);
    const unsubscribe = onSnapshot(userRef, 
      { includeMetadataChanges: true }, // This ensures we get all updates
      (doc) => {
        console.log('🔄 [useUserData] Received update:', doc.metadata);
      if (doc.exists()) {
        const data = doc.data();
        console.log('Received user data from Firestore (useUserData):', data);
        const now = new Date().toISOString();
        setUserData({
          credits: data.creditsRemaining || 30,
          maxCredits: data.maxCredits || 30,
          plan: data.plan || 'free',
          subscriptionPlan: data.subscriptionPlan,
          billingPeriod: data.billingPeriod,
          subscriptionDate: data.subscriptionDate,
          nextRenewalDate: data.nextResetDate,
          paymentAmount: data.paymentAmount,
          dailyPromptsUsed: data.dailyPromptsUsed || 0,
          lastDailyReset: data.lastDailyReset || now,
          monthlyCreditsUsed: data.monthlyCreditsUsed || 0,
          lastMonthlyReset: data.lastMonthlyReset || now,
        });
      } else {
        // Set default data for a new user
        const now = new Date().toISOString();
        setUserData({
          credits: 30,
          maxCredits: 30,
          plan: 'free',
          dailyPromptsUsed: 0,
          lastDailyReset: now,
          monthlyCreditsUsed: 0,
          lastMonthlyReset: now,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  return { userData, loading };
};
