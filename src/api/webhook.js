// api/webhook.js

import { db } from '../lib/FirebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;
    const signature = req.headers['dodo-signature'];

    if (!signature || !DODO_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Parse webhook data
    const event = req.body;
    console.log('Received webhook:', event);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdate(event.data);
        break;

      case 'subscription.deleted':
        await handleSubscriptionCancelled(event.data);
        break;
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ 
      error: 'Webhook handler failed',
      message: error.message 
    });
  }
}

async function handleSuccessfulPayment(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  const userRef = doc(db, 'userCredits', metadata.userId);
  const now = new Date();
  const nextRenewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Set pro plan data
  await setDoc(userRef, {
    plan: 'pro',
    credits: 200,
    creditsRemaining: 200,
    totalCredits: 200,
    maxCredits: 200,
    billingPeriod: metadata.billingPeriod || 'monthly',
    subscriptionPlan: '200 credits/month',
    subscriptionDate: now.toISOString(),
    lastPaymentDate: now.toISOString(),
    lastReset: now.toISOString(),
    nextResetDate: nextRenewal.toISOString(),
    paymentId: data.id,
    paymentAmount: parseFloat(metadata.amount),
    paymentCurrency: metadata.currency || 'USD',
    dailyPromptsUsed: 0,
    lastDailyReset: now.toISOString(),
    monthlyCreditsUsed: 0,
    lastMonthlyReset: now.toISOString(),
  }, { merge: true });
}

async function handleSubscriptionUpdate(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  const userRef = doc(db, 'userCredits', metadata.userId);
  await setDoc(userRef, {
    subscriptionStatus: data.status,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

async function handleSubscriptionCancelled(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  const userRef = doc(db, 'userCredits', metadata.userId);
  const now = new Date();

  // Revert to free plan at the end of billing period
  await setDoc(userRef, {
    plan: 'free',
    credits: 30,
    creditsRemaining: 30,
    totalCredits: 30,
    maxCredits: 30,
    billingPeriod: 'monthly',
    subscriptionStatus: 'cancelled',
    cancelledAt: now.toISOString(),
  }, { merge: true });
}