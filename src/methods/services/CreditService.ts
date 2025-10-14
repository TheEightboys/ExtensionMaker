// src/methods/services/CreditService.ts - FINAL VERSION WITH USER INFO

import { db } from '../../lib/FirebaseClient';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export interface UserCredits {
  plan: 'free' | 'pro';
  credits: number;
  maxCredits: number;
  billingPeriod: 'monthly' | 'yearly';
  lastResetDate: string;
  nextResetDate: string;
  createdAt: string;
  updatedAt: string;
  subscriptionDate?: string;
  paymentAmount?: number;
  
  // Daily limit fields
  dailyCreditsUsed?: number;
  lastDailyResetDate?: string;
  dailyLimit?: number;
  
  // User info fields - NEW
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: string;
}

// Initialize user credits with email/name - NEW FUNCTION
export async function initializeUserCredits(
  userId: string, 
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user with credits
      const now = new Date();
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: 30,
        maxCredits: 30,
        billingPeriod: 'monthly',
        lastResetDate: now.toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dailyCreditsUsed: 0,
        lastDailyResetDate: getTodayDate(),
        dailyLimit: 5,
        // User info
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        lastLogin: now.toISOString()
      };
      
      await setDoc(userRef, {
        ...defaultCredits,
        creditsRemaining: 30,
        totalCredits: 30
      });
      
      console.log('✅ User credits initialized for:', email);
    } else {
      // Update existing user's login time and info
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
        email: email, // Update in case it changed
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ User info updated for:', email);
    }
  } catch (error) {
    console.error('❌ Error initializing user credits:', error);
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: 30,
        maxCredits: 30,
        billingPeriod: 'monthly',
        lastResetDate: new Date().toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dailyCreditsUsed: 0,
        lastDailyResetDate: getTodayDate(),
        dailyLimit: 5
      };
      
      await setDoc(userRef, {
        ...defaultCredits,
        creditsRemaining: 30,
        totalCredits: 30
      });
      
      return defaultCredits;
    }

    const data = userDoc.data();
    const userPlan = (data.plan || 'free') as 'free' | 'pro';
    const maxCredits = data.totalCredits || data.maxCredits || (userPlan === 'pro' ? 200 : 30);
    const currentCredits = data.creditsRemaining ?? data.credits ?? maxCredits;

    // Check if daily limit needs reset (new day)
    const lastDailyReset = data.lastDailyResetDate || getTodayDate();
    const today = getTodayDate();
    const needsDailyReset = lastDailyReset !== today;

    if (needsDailyReset && userPlan === 'free') {
      // Reset daily counter
      await updateDoc(userRef, {
        dailyCreditsUsed: 0,
        lastDailyResetDate: today,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      plan: userPlan,
      credits: currentCredits,
      maxCredits: maxCredits,
      billingPeriod: data.billingPeriod || 'monthly',
      lastResetDate: data.lastReset || data.lastResetDate || new Date().toISOString(),
      nextResetDate: data.nextResetDate || getNextResetDate(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      subscriptionDate: data.subscriptionDate,
      paymentAmount: data.paymentAmount,
      dailyCreditsUsed: needsDailyReset ? 0 : (data.dailyCreditsUsed || 0),
      lastDailyResetDate: today,
      dailyLimit: userPlan === 'free' ? 5 : 999999,
      // User info
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      lastLogin: data.lastLogin
    };
  } catch (error) {
    console.error('[CREDITS] Error:', error);
    return null;
  }
}

export async function hasCreditsAvailable(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return false;
  
  // For free users, check both monthly credits AND daily limit
  if (credits.plan === 'free') {
    const dailyLimitReached = (credits.dailyCreditsUsed || 0) >= (credits.dailyLimit || 5);
    return credits.credits > 0 && !dailyLimitReached;
  }
  
  // Pro users only check monthly credits
  return credits.credits > 0;
}

export async function useCredit(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;

    const data = userDoc.data();
    const currentCredits = data.creditsRemaining ?? data.credits ?? 0;
    const userPlan = data.plan || 'free';

    if (currentCredits <= 0) return false;

    // Check daily limit for free users
    if (userPlan === 'free') {
      const dailyUsed = data.dailyCreditsUsed || 0;
      const dailyLimit = data.dailyLimit || 5;
      
      if (dailyUsed >= dailyLimit) {
        console.error('[CREDITS] Daily limit reached');
        return false;
      }

      // Deduct credit and increment daily counter
      await updateDoc(userRef, {
        creditsRemaining: currentCredits - 1,
        credits: currentCredits - 1,
        dailyCreditsUsed: dailyUsed + 1,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Pro users - just deduct credit
      await updateDoc(userRef, {
        creditsRemaining: currentCredits - 1,
        credits: currentCredits - 1,
        updatedAt: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('[CREDITS] Error using credit:', error);
    return false;
  }
}

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns "2025-10-14"
}

function getNextResetDate(): string {
  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + 30);
  return nextReset.toISOString();
}

export function getDaysUntilReset(nextResetDate: string): number {
  const now = new Date();
  const resetDate = new Date(nextResetDate);
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export async function resetCredits(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;

    const data = userDoc.data();
    const maxCredits = data.totalCredits || data.maxCredits || 30;

    await updateDoc(userRef, {
      creditsRemaining: maxCredits,
      credits: maxCredits,
      dailyCreditsUsed: 0,
      lastDailyResetDate: getTodayDate(),
      lastReset: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      nextResetDate: getNextResetDate(),
      updatedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('[CREDITS] Error resetting:', error);
    return false;
  }
}

export function formatResetDate(nextResetDate: string): string {
  const date = new Date(nextResetDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
