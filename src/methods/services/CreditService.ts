// src/methods/services/CreditService.ts - UPDATED WITH NEW CREDIT SYSTEM

import { db } from '../../lib/FirebaseClient';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { CREDITS_PER_PROMPT, FREE_PLAN } from '../../types/plans';

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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Free trial tracking
  hasUsedFreeTrial: boolean;
  freeTrialUsedAt?: string;

  // User info fields
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: string;
}

// Initialize user credits with email/name
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
      // Create new user with FREE plan credits (1 prompt = 3 credits)
      const now = new Date();
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: FREE_PLAN.credits,  // 3 credits = 1 prompt
        maxCredits: FREE_PLAN.credits,
        billingPeriod: 'monthly',
        lastResetDate: now.toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        hasUsedFreeTrial: false,
        // User info
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || undefined,
        lastLogin: now.toISOString()
      };

      await setDoc(userRef, {
        ...defaultCredits,
        creditsRemaining: FREE_PLAN.credits,
        totalCredits: FREE_PLAN.credits
      });

      console.log('✅ User credits initialized for:', email);
    } else {
      // Update existing user's login time and info
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || undefined,
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
      // Create default free user
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: FREE_PLAN.credits,
        maxCredits: FREE_PLAN.credits,
        billingPeriod: 'monthly',
        lastResetDate: new Date().toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasUsedFreeTrial: false
      };

      await setDoc(userRef, {
        ...defaultCredits,
        creditsRemaining: FREE_PLAN.credits,
        totalCredits: FREE_PLAN.credits
      });

      return defaultCredits;
    }

    const data = userDoc.data();
    const userPlan = (data.plan || 'free') as 'free' | 'pro';
    const maxCredits = data.totalCredits || data.maxCredits || FREE_PLAN.credits;
    const currentCredits = data.creditsRemaining ?? data.credits ?? maxCredits;

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
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      hasUsedFreeTrial: data.hasUsedFreeTrial || false,
      freeTrialUsedAt: data.freeTrialUsedAt,
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

// Check if user has enough credits for a prompt
export async function hasCreditsAvailable(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return false;

  // Need at least CREDITS_PER_PROMPT credits to generate
  return credits.credits >= CREDITS_PER_PROMPT;
}

// Check if free user needs to upgrade (used their 1 free prompt)
export async function needsUpgrade(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return true;

  // Free users who have used their trial need to upgrade
  if (credits.plan === 'free' && credits.hasUsedFreeTrial) {
    return true;
  }

  // Anyone with insufficient credits needs to upgrade
  return credits.credits < CREDITS_PER_PROMPT;
}

// Use credits for a prompt (costs CREDITS_PER_PROMPT = 3)
export async function useCredit(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;

    const data = userDoc.data();
    const currentCredits = data.creditsRemaining ?? data.credits ?? 0;
    const userPlan = data.plan || 'free';

    if (currentCredits < CREDITS_PER_PROMPT) {
      console.error('[CREDITS] Not enough credits. Need:', CREDITS_PER_PROMPT, 'Have:', currentCredits);
      return false;
    }

    const newCredits = currentCredits - CREDITS_PER_PROMPT;

    // Update credits and mark free trial as used if applicable
    const updateData: Record<string, unknown> = {
      creditsRemaining: newCredits,
      credits: newCredits,
      updatedAt: new Date().toISOString()
    };

    // If free user using their only prompt, mark trial as used
    if (userPlan === 'free' && !data.hasUsedFreeTrial) {
      updateData.hasUsedFreeTrial = true;
      updateData.freeTrialUsedAt = new Date().toISOString();
    }

    await updateDoc(userRef, updateData);

    console.log('[CREDITS] Used', CREDITS_PER_PROMPT, 'credits. Remaining:', newCredits);
    return true;
  } catch (error) {
    console.error('[CREDITS] Error using credit:', error);
    return false;
  }
}

// Add credits after purchase
export async function addCredits(userId: string, creditsToAdd: number, plan: 'free' | 'pro' = 'pro'): Promise<boolean> {
  try {
    const userRef = doc(db, 'userCredits', userId);
    const userDoc = await getDoc(userRef);

    const existingData = userDoc.exists() ? userDoc.data() : {};
    const currentCredits = existingData.creditsRemaining ?? existingData.credits ?? 0;
    const newCredits = currentCredits + creditsToAdd;

    await setDoc(userRef, {
      ...existingData,
      plan: plan,
      credits: newCredits,
      creditsRemaining: newCredits,
      maxCredits: Math.max(newCredits, existingData.maxCredits || 0),
      totalCredits: Math.max(newCredits, existingData.totalCredits || 0),
      updatedAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      nextResetDate: getNextResetDate()
    }, { merge: true });

    console.log('[CREDITS] Added', creditsToAdd, 'credits. New total:', newCredits);
    return true;
  } catch (error) {
    console.error('[CREDITS] Error adding credits:', error);
    return false;
  }
}

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
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
    const maxCredits = data.totalCredits || data.maxCredits || FREE_PLAN.credits;

    await updateDoc(userRef, {
      creditsRemaining: maxCredits,
      credits: maxCredits,
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

// Get prompts remaining (credits / CREDITS_PER_PROMPT)
export function getPromptsRemaining(credits: number): number {
  return Math.floor(credits / CREDITS_PER_PROMPT);
}
