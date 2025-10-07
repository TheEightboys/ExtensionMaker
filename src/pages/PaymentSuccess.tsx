// src/pages/PaymentSuccess.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addExtraCredits, upgradePlan, getUserCredits } from './../methods/services/CreditService';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const credits = parseInt(searchParams.get('credits') || '0');
      const plan = searchParams.get('plan');
      
      console.log('🔄 Processing payment:', { sessionId, credits, plan });

      if (!sessionId || !user) {
        console.error('❌ Missing session ID or user');
        setStatus('error');
        return;
      }

      try {
        // Check if already processed
        const processed = localStorage.getItem(`payment_${sessionId}`);
        if (processed) {
          console.log('✅ Payment already processed');
          setStatus('success');
          setCreditsAdded(credits || (plan === 'basic' ? 130 : 999999));
          return;
        }

        // Check for pending plan subscription (after credit purchase)
        const pendingPlan = localStorage.getItem('pendingPlanSubscription');
        
        if (pendingPlan) {
          const pending = JSON.parse(pendingPlan);
          console.log('🔄 Processing pending subscription:', pending);
          
          // User just paid for credits, now redirect to plan subscription
          localStorage.removeItem('pendingPlanSubscription');
          await addExtraCredits(user.uid, credits);
          
          // Redirect to plan subscription
          window.location.href = pending.planUrl;
          return;
        }

        // Process payment based on type
        if (plan === 'basic' || plan === 'pro') {
          console.log(`🔄 Upgrading to ${plan} plan`);
          await upgradePlan(user.uid, plan, 'monthly');
          setCreditsAdded(plan === 'basic' ? 130 : 999999);
        } else if (credits > 0) {
          console.log(`🔄 Adding ${credits} credits`);
          await addExtraCredits(user.uid, credits);
          setCreditsAdded(credits);
        }

        // Mark as processed
        localStorage.setItem(`payment_${sessionId}`, 'processed');
        console.log('✅ Payment processed successfully');
        setStatus('success');
      } catch (error) {
        console.error('❌ Payment processing error:', error);
        setStatus('error');
      }
    };

    if (user) {
      processPayment();
    } else {
      console.log('⏳ Waiting for user authentication...');
    }
  }, [searchParams, user]);

  // Countdown and redirect
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/builder');
    }
  }, [status, countdown, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md">
          <Loader2 size={64} className="animate-spin mx-auto text-blue-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Please try again or contact support.
          </p>
          <button
            onClick={() => navigate('/#pricing')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md">
        <CheckCircle size={64} className="mx-auto text-green-600 mb-6 animate-bounce" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! You've received <strong>{creditsAdded}</strong> credits.
        </p>
        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">
            Redirecting to builder in {countdown} seconds...
          </p>
        </div>
        <button
          onClick={() => navigate('/builder')}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Go to Builder Now
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
