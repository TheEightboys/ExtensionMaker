// api/stripe-webhook.ts - Vercel serverless function for Stripe webhooks

import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (for server-side)
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });
    } catch (error) {
        console.error('Firebase Admin init error:', error);
    }
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
    api: {
        bodyParser: false // Stripe needs raw body for signature verification
    }
};

// Helper to read raw body
async function getRawBody(req: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'];

        if (!signature || !endpointSecret) {
            console.error('Missing webhook signature or secret');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log('📨 Received Stripe webhook:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        return res.status(500).json({
            error: 'Webhook handler failed',
            message: error.message
        });
    }
}

// Handle successful checkout - add credits to user
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.userId) {
        console.error('No userId in session metadata');
        return;
    }

    const userId = metadata.userId;
    const credits = parseInt(metadata.credits || '0', 10);
    const packageId = metadata.packageId;

    console.log(`✅ Checkout complete for user ${userId}: ${credits} credits`);

    const userRef = db.collection('userCredits').doc(userId);
    const userDoc = await userRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};
    const currentCredits = existingData?.creditsRemaining || existingData?.credits || 0;
    const newCredits = currentCredits + credits;
    const now = new Date();

    await userRef.set({
        ...existingData,
        plan: 'pro',
        credits: newCredits,
        creditsRemaining: newCredits,
        maxCredits: Math.max(newCredits, existingData?.maxCredits || 0),
        totalCredits: Math.max(newCredits, existingData?.totalCredits || 0),
        billingPeriod: metadata.billingPeriod || 'monthly',
        subscriptionDate: now.toISOString(),
        lastPaymentDate: now.toISOString(),
        lastResetDate: now.toISOString(),
        nextResetDate: getNextResetDate(metadata.billingPeriod as string),
        stripeCustomerId: session.customer as string,
        stripeSessionId: session.id,
        packageId: packageId,
        updatedAt: now.toISOString()
    }, { merge: true });

    console.log(`✅ User ${userId} now has ${newCredits} credits`);
}

// Handle subscription invoice paid - renewal credits
async function handleInvoicePaid(invoice: Stripe.Invoice) {
    // Get subscription to find metadata
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const metadata = subscription.metadata;

    if (!metadata || !metadata.userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    const userId = metadata.userId;
    const credits = parseInt(metadata.credits || '0', 10);

    console.log(`✅ Invoice paid for user ${userId}: renewing ${credits} credits`);

    const userRef = db.collection('userCredits').doc(userId);
    const now = new Date();

    // Reset credits to purchased amount on renewal
    await userRef.set({
        credits: credits,
        creditsRemaining: credits,
        maxCredits: credits,
        totalCredits: credits,
        lastPaymentDate: now.toISOString(),
        lastResetDate: now.toISOString(),
        nextResetDate: getNextResetDate(metadata.billingPeriod as string),
        updatedAt: now.toISOString()
    }, { merge: true });

    console.log(`✅ User ${userId} credits renewed to ${credits}`);
}

// Handle subscription update
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    if (!metadata || !metadata.userId) return;

    const userId = metadata.userId;
    const userRef = db.collection('userCredits').doc(userId);

    await userRef.set({
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    if (!metadata || !metadata.userId) return;

    const userId = metadata.userId;
    const userRef = db.collection('userCredits').doc(userId);
    const now = new Date();

    // Downgrade to free plan
    await userRef.set({
        plan: 'free',
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        cancelledAt: now.toISOString(),
        updatedAt: now.toISOString()
        // Keep existing credits until they run out
    }, { merge: true });

    console.log(`✅ Subscription cancelled for user ${userId}`);
}

function getNextResetDate(billingPeriod: string): string {
    const nextReset = new Date();
    if (billingPeriod === 'yearly') {
        nextReset.setFullYear(nextReset.getFullYear() + 1);
    } else {
        nextReset.setMonth(nextReset.getMonth() + 1);
    }
    return nextReset.toISOString();
}
