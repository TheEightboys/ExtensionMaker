import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './../../lib/FirebaseClient';

interface UserCredits {
  plan: 'free' | 'basic' | 'pro';
  creditsRemaining: number;
  totalCredits: number;
  billingPeriod: 'monthly' | 'yearly';
  lastReset: Date;
  createdAt: Date;
}

// Credit limits by plan
const CREDIT_LIMITS = {
  free: 10,
  basic: {
    monthly: 100,
    yearly: 150
  },
  pro: {
    monthly: 500,
    yearly: 750
  }
};

// Initialize user credits on signup
export const initializeUserCredits = async (userId: string) => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    
    // Check if already exists
    const existing = await getDoc(creditsRef);
    if (existing.exists()) {
      console.log('✅ Credits already initialized');
      return;
    }
    
    await setDoc(creditsRef, {
      plan: 'free',
      creditsRemaining: CREDIT_LIMITS.free,
      totalCredits: CREDIT_LIMITS.free,
      billingPeriod: 'monthly',
      lastReset: new Date(),
      createdAt: new Date()
    });
    
    console.log('✅ Credits initialized for user:', userId);
  } catch (error) {
    console.error('❌ Failed to initialize credits:', error);
    throw error;
  }
};

// Get user credits
export const getUserCredits = async (userId: string): Promise<UserCredits | null> => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    const creditsSnap = await getDoc(creditsRef);
    
    if (creditsSnap.exists()) {
      const data = creditsSnap.data();
      console.log('✅ Got credits:', data);
      return data as UserCredits;
    }
    
    // Initialize if doesn't exist
    console.log('⚠️ Credits not found, initializing...');
    await initializeUserCredits(userId);
    
    // Get again after initialization
    const newSnap = await getDoc(creditsRef);
    if (newSnap.exists()) {
      return newSnap.data() as UserCredits;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get credits:', error);
    return null;
  }
};

// Check if user has credits
export const hasCreditsAvailable = async (userId: string): Promise<boolean> => {
  try {
    const credits = await getUserCredits(userId);
    const hasCredits = credits ? credits.creditsRemaining > 0 : false;
    console.log('💳 Credits available:', hasCredits, 'Remaining:', credits?.creditsRemaining);
    return hasCredits;
  } catch (error) {
    console.error('❌ Failed to check credits:', error);
    return true; // Default to true on error
  }
};

// Use a credit (deduct 1)
export const useCredit = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔄 Attempting to deduct credit for user:', userId);
    
    const credits = await getUserCredits(userId);
    
    if (!credits) {
      console.error('❌ No credits found for user');
      return false;
    }
    
    if (credits.creditsRemaining <= 0) {
      console.error('❌ No credits remaining');
      return false;
    }
    
    const creditsRef = doc(db, 'userCredits', userId);
    
    // Use transaction-like update
    await updateDoc(creditsRef, {
      creditsRemaining: credits.creditsRemaining - 1
    });
    
    console.log('✅ Credit deducted! New balance:', credits.creditsRemaining - 1);
    return true;
  } catch (error) {
    console.error('❌ Failed to deduct credit:', error);
    return false;
  }
};

// Upgrade user plan
export const upgradePlan = async (
  userId: string, 
  plan: 'basic' | 'pro', 
  billingPeriod: 'monthly' | 'yearly'
) => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    
    let totalCredits = 0;
    if (plan === 'basic') {
      totalCredits = billingPeriod === 'monthly' ? CREDIT_LIMITS.basic.monthly : CREDIT_LIMITS.basic.yearly;
    } else if (plan === 'pro') {
      totalCredits = billingPeriod === 'monthly' ? CREDIT_LIMITS.pro.monthly : CREDIT_LIMITS.pro.yearly;
    }
    
    await updateDoc(creditsRef, {
      plan,
      billingPeriod,
      creditsRemaining: totalCredits,
      totalCredits,
      lastReset: new Date()
    });
    
    console.log('✅ Plan upgraded to:', plan, billingPeriod);
  } catch (error) {
    console.error('❌ Failed to upgrade plan:', error);
    throw error;
  }
};

// Reset credits monthly (run via Cloud Function)
export const resetMonthlyCredits = async (userId: string) => {
  try {
    const credits = await getUserCredits(userId);
    if (!credits) return;
    
    let totalCredits = 0;
    if (credits.plan === 'free') {
      totalCredits = CREDIT_LIMITS.free;
    } else if (credits.plan === 'basic') {
      totalCredits = credits.billingPeriod === 'monthly' ? CREDIT_LIMITS.basic.monthly : CREDIT_LIMITS.basic.yearly;
    } else if (credits.plan === 'pro') {
      totalCredits = credits.billingPeriod === 'monthly' ? CREDIT_LIMITS.pro.monthly : CREDIT_LIMITS.pro.yearly;
    }
    
    const creditsRef = doc(db, 'userCredits', userId);
    await updateDoc(creditsRef, {
      creditsRemaining: totalCredits,
      lastReset: new Date()
    });
    
    console.log('✅ Credits reset to:', totalCredits);
  } catch (error) {
    console.error('❌ Failed to reset credits:', error);
    throw error;
  }
};
