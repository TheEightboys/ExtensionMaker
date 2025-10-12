// src/pages/PaymentSuccess.tsx - FIXED FOR DODO SUBSCRIPTIONS
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/FirebaseClient';
import { useAuth } from '../contexts/AuthContext';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        console.log('========================================');
        console.log('🚀 PAYMENT SUCCESS PAGE LOADED');
        console.log('========================================');
        
        // Get URL parameters from Dodo
        const subscriptionId = searchParams.get('subscription_id');
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        
        console.log('📋 URL Parameters:', {
          subscription_id: subscriptionId,
          payment_id: paymentId,
          status: status
        });

        // Check if payment was successful
        if (status !== 'active' && !subscriptionId && !paymentId) {
          throw new Error('Payment not confirmed. Status: ' + (status || 'unknown'));
        }

        // Check if user is logged in
        if (!user) {
          console.error('❌ No user logged in');
          throw new Error('User not authenticated. Please log in.');
        }

        console.log('👤 User:', user.email, user.uid);

        // Get pending purchase from localStorage
        const pendingPurchaseStr = localStorage.getItem('pendingPurchase');
        
        if (!pendingPurchaseStr) {
          console.error('❌ No pending purchase in localStorage');
          throw new Error('Payment information not found. Please contact support.');
        }

        const pendingPurchase = JSON.parse(pendingPurchaseStr);
        console.log('💾 Purchase data:', pendingPurchase);
        setPurchaseDetails(pendingPurchase);

        // Verify user matches
        if (pendingPurchase.userId !== user.uid) {
          console.error('❌ User ID mismatch');
          console.error('Expected:', pendingPurchase.userId);
          console.error('Got:', user.uid);
          throw new Error('User verification failed');
        }

        // Get purchased credits
        const purchasedCredits = parseInt(pendingPurchase.credits);
        console.log('💳 Credits to set:', purchasedCredits);

        // Prepare Firebase data
        const userRef = doc(db, 'userCredits', user.uid);
        console.log('📂 Firebase path: userCredits/' + user.uid);
        
        const now = new Date();
        const nextRenewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const subscriptionData = {
          plan: 'pro',
          
          // Set credits (all variations)
          credits: purchasedCredits,
          creditsRemaining: purchasedCredits,
          totalCredits: purchasedCredits,
          maxCredits: purchasedCredits,
          
          billingPeriod: pendingPurchase.billingPeriod || 'monthly',
          subscriptionPlan: `${purchasedCredits} credits/month`,
          
          subscriptionDate: now.toISOString(),
          lastPaymentDate: now.toISOString(),
          lastReset: now.toISOString(),
          nextResetDate: nextRenewal.toISOString(),
          
          // Store Dodo subscription ID
          subscriptionId: subscriptionId || paymentId || 'dodo_' + Date.now(),
          paymentId: paymentId || subscriptionId || 'dodo_' + Date.now(),
          paymentStatus: status || 'active',
          paymentAmount: parseFloat(pendingPurchase.amount),
          paymentCurrency: 'USD',
          
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        console.log('📝 Data to write:', subscriptionData);

        // Write to Firebase
        await setDoc(userRef, subscriptionData, { merge: true });
        console.log('✅ Firebase write completed');

        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify write
        const verifyDoc = await getDoc(userRef);
        if (!verifyDoc.exists()) {
          throw new Error('Verification failed: Document not created');
        }
        
        const verifyData = verifyDoc.data();
        console.log('🔍 Verification:', {
          plan: verifyData?.plan,
          creditsRemaining: verifyData?.creditsRemaining,
          totalCredits: verifyData?.totalCredits
        });

        if (verifyData?.plan !== 'pro') {
          throw new Error(`Plan verification failed. Expected 'pro', got '${verifyData?.plan}'`);
        }

        if (verifyData?.creditsRemaining !== purchasedCredits) {
          console.warn(`⚠️ Credits mismatch. Expected ${purchasedCredits}, got ${verifyData?.creditsRemaining}`);
        }

        console.log('========================================');
        console.log('✅✅✅ SUCCESS - SUBSCRIPTION ACTIVATED ✅✅✅');
        console.log('========================================');

        // Clear pending purchase
        localStorage.removeItem('pendingPurchase');
        
        setSuccess(true);
        setProcessing(false);
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);

      } catch (error: any) {
        console.error('========================================');
        console.error('❌ PAYMENT PROCESSING ERROR');
        console.error(error);
        console.error('========================================');
        setError(error.message);
        setProcessing(false);
      }
    };

    // Start processing after 1 second
    const timer = setTimeout(processPayment, 1000);
    return () => clearTimeout(timer);
  }, [user, searchParams, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Activating Your Subscription...
          </h2>
          {purchaseDetails && (
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-4">
              <p className="text-lg font-bold text-gray-900 mb-2">Setting Up</p>
              <p className="text-gray-700">{purchaseDetails.credits} credits/month</p>
              <p className="text-gray-600">${purchaseDetails.amount}/month</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            ✓ Payment confirmed<br/>
            ✓ Updating your account<br/>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Activation Error</h1>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Payment was received, but account activation failed.</strong>
            </p>
            <p className="text-xs text-gray-600">
              • Your payment is safe<br/>
              • Check console (F12) for details<br/>
              • Contact support with subscription ID: {searchParams.get('subscription_id')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        
        <h1 className="text-6xl font-black text-gray-900 mb-4">
          Welcome to Pro! 🎉
        </h1>
        
        {purchaseDetails && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <p className="text-2xl font-black text-gray-900 mb-6">Subscription Activated!</p>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">Credits:</span>
                <span className="text-2xl font-black text-green-600">{purchaseDetails.credits}/month</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">Amount:</span>
                <span className="text-xl font-bold text-gray-900">${purchaseDetails.amount}/month</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">Billing:</span>
                <span className="text-lg font-bold text-gray-900 capitalize">{purchaseDetails.billingPeriod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Status:</span>
                <span className="text-lg font-black text-green-600">✓ ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 text-lg mb-6">
          Redirecting to your dashboard in 3 seconds...
        </p>
        
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl"
        >
          Go to Dashboard Now →
        </button>
      </div>
    </div>
  );
};
