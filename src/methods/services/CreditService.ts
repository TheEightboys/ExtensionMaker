// src/services/CreditService.ts - COMPLETE FIXED VERSION

import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './../../lib/FirebaseClient';

export interface UserCredits {
  plan: 'free' | 'basic' | 'pro';
  credits: number;
  maxCredits: number;
  billingPeriod: 'monthly' | 'yearly';
  lastResetDate: string;
  nextResetDate: string;
  createdAt: string;
  updatedAt: string;
}

// Credit limits by plan
const CREDIT_LIMITS = {
  free: 30,
  basic: { monthly: 130 },
  pro: { monthly: 999999 }
};

// Calculate next reset date (first day of next month)
const getNextResetDate = (billingPeriod: 'monthly' | 'yearly'): Date => {
  const now = new Date();
  const nextReset = new Date(now);
  
  if (billingPeriod === 'monthly') {
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);
  } else {
    nextReset.setFullYear(nextReset.getFullYear() + 1);
    nextReset.setMonth(0);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);
  }
  
  return nextReset;
};

// Get days until next reset
export const getDaysUntilReset = (nextResetDate: string): number => {
  const now = new Date();
  const resetDate = new Date(nextResetDate);
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Initialize user credits on signup
export const initializeUserCredits = async (userId: string): Promise<void> => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    
    const existing = await getDoc(creditsRef);
    if (existing.exists()) {
      console.log('✅ Credits already initialized');
      return;
    }
    
    const now = new Date();
    const nextReset = getNextResetDate('monthly');
    
    const initialCredits: UserCredits = {
      plan: 'free',
      credits: CREDIT_LIMITS.free,
      maxCredits: CREDIT_LIMITS.free,
      billingPeriod: 'monthly',
      lastResetDate: now.toISOString(),
      nextResetDate: nextReset.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    await setDoc(creditsRef, initialCredits);
    
    console.log('✅ Credits initialized:', initialCredits);
  } catch (error) {
    console.error('❌ Failed to initialize credits:', error);
    throw error;
  }
};

// Check if reset is needed and perform reset
const checkAndResetCredits = async (userId: string, credits: UserCredits): Promise<UserCredits> => {
  const now = new Date();
  const nextResetDate = new Date(credits.nextResetDate);
  
  // Check if reset is due
  if (now >= nextResetDate) {
    console.log('🔄 Resetting credits...');
    
    const newNextReset = getNextResetDate(credits.billingPeriod);
    const creditsRef = doc(db, 'userCredits', userId);
    
    const updatedCredits: UserCredits = {
      ...credits,
      credits: credits.maxCredits,
      lastResetDate: now.toISOString(),
      nextResetDate: newNextReset.toISOString(),
      updatedAt: now.toISOString()
    };
    
    await updateDoc(creditsRef, {
      credits: credits.maxCredits,
      lastResetDate: now.toISOString(),
      nextResetDate: newNextReset.toISOString(),
      updatedAt: now.toISOString()
    });
    
    console.log('✅ Credits reset to:', credits.maxCredits);
    return updatedCredits;
  }
  
  return credits;
};

// Get user credits
export const getUserCredits = async (userId: string): Promise<UserCredits | null> => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    const creditsSnap = await getDoc(creditsRef);
    
    if (creditsSnap.exists()) {
      const data = creditsSnap.data() as UserCredits;
      
      // Check if reset is needed
      const updatedCredits = await checkAndResetCredits(userId, data);
      
      console.log('💳 User credits:', {
        plan: updatedCredits.plan,
        credits: updatedCredits.credits,
        maxCredits: updatedCredits.maxCredits
      });
      
      return updatedCredits;
    }
    
    // Initialize if doesn't exist
    console.log('⚠️ Credits not found, initializing...');
    await initializeUserCredits(userId);
    
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

// Check if user has credits available
export const hasCreditsAvailable = async (userId: string): Promise<boolean> => {
  try {
    const credits = await getUserCredits(userId);
    const hasCredits = credits ? credits.credits > 0 : false;
    console.log('💳 Credits available:', hasCredits, 'Remaining:', credits?.credits);
    return hasCredits;
  } catch (error) {
    console.error('❌ Failed to check credits:', error);
    return false;
  }
};

// Use a credit (deduct 1)
export const useCredit = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔄 Attempting to use credit for user:', userId);
    
    const credits = await getUserCredits(userId);
    
    if (!credits) {
      console.error('❌ No credits found for user');
      return false;
    }
    
    if (credits.credits <= 0) {
      console.error('❌ No credits remaining');
      return false;
    }
    
    const creditsRef = doc(db, 'userCredits', userId);
    
    // Deduct 1 credit
    await updateDoc(creditsRef, {
      credits: increment(-1),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Credit used! New balance:', credits.credits - 1);
    return true;
  } catch (error) {
    console.error('❌ Failed to use credit:', error);
    return false;
  }
};

// Add extra credits (for one-time purchases)
export const addExtraCredits = async (userId: string, creditsToAdd: number): Promise<boolean> => {
  try {
    console.log(`🔄 Adding ${creditsToAdd} extra credits to user:`, userId);
    
    const creditsRef = doc(db, 'userCredits', userId);
    const creditsSnap = await getDoc(creditsRef);
    
    if (!creditsSnap.exists()) {
      console.error('❌ User credits not found');
      return false;
    }
    
    await updateDoc(creditsRef, {
      credits: increment(creditsToAdd),
      updatedAt: new Date().toISOString(),
      [`purchases.${Date.now()}`]: {
        credits: creditsToAdd,
        date: new Date().toISOString(),
        type: 'one-time'
      }
    });
    
    console.log(`✅ Added ${creditsToAdd} extra credits`);
    return true;
  } catch (error) {
    console.error('❌ Failed to add extra credits:', error);
    return false;
  }
};

// Upgrade user plan
export const upgradePlan = async (
  userId: string, 
  plan: 'basic' | 'pro', 
  billingPeriod: 'monthly' | 'yearly'
): Promise<void> => {
  try {
    const creditsRef = doc(db, 'userCredits', userId);
    
    let totalCredits = 0;
    if (plan === 'basic') {
      totalCredits = CREDIT_LIMITS.basic.monthly;
    } else if (plan === 'pro') {
      totalCredits = CREDIT_LIMITS.pro.monthly;
    }
    
    const now = new Date();
    const nextReset = getNextResetDate(billingPeriod);
    
    await updateDoc(creditsRef, {
      plan,
      billingPeriod,
      credits: totalCredits,
      maxCredits: totalCredits,
      lastResetDate: now.toISOString(),
      nextResetDate: nextReset.toISOString(),
      updatedAt: now.toISOString()
    });
    
    console.log('✅ Plan upgraded to:', plan, 'with', totalCredits, 'credits');
  } catch (error) {
    console.error('❌ Failed to upgrade plan:', error);
    throw error;
  }
};

// Reset credits manually (admin function)
export const resetCreditsManually = async (userId: string): Promise<void> => {
  try {
    const credits = await getUserCredits(userId);
    if (!credits) return;
    
    const creditsRef = doc(db, 'userCredits', userId);
    await updateDoc(creditsRef, {
      credits: credits.maxCredits,
      lastResetDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Credits manually reset');
  } catch (error) {
    console.error('❌ Failed to reset credits:', error);
    throw error;
  }
};
