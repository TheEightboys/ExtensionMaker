import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPayment } from './../../src/services/paymentservice';
import { Check, Zap, Crown, Loader2, ArrowRight, Home } from 'lucide-react';
import '../styles/Pricing.css';

const plans = [
  {
    name: 'Free',
    type: 'free' as const,
    monthlyPrice: 0,
    yearlyPrice: 0,
    prompts: 10,
    features: [
      '10 prompts per month',
      'All browsers supported',
      'Code export & download',
      'Community support',
      'Basic templates'
    ]
  },
  {
    name: 'Basic',
    type: 'basic' as const,
    monthlyPrice: 499,
    yearlyPrice: 4999,
    prompts: 100,
    features: [
      '100 prompts per month',
      'Priority generation speed',
      'All browser support',
      'Email support',
      'Advanced templates',
      'Code export & download'
    ]
  },
  {
    name: 'Pro',
    type: 'pro' as const,
    monthlyPrice: 999,
    yearlyPrice: 9999,
    prompts: 500,
    popular: true,
    features: [
      '500 prompts per month',
      'Fastest generation',
      'Custom branding',
      'Priority support 24/7',
      'API access',
      'Team collaboration',
      'Advanced analytics'
    ]
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (plan.type === 'free') {
      navigate('/builder');
      return;
    }

    setLoading(plan.type);

    try {
      const amount = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      
      const paymentSession = await createPayment(user.uid, user.email!, {
        amount,
        currency: 'INR',
        planName: plan.name,
        planType: plan.type,
        billingPeriod
      });

      window.location.href = paymentSession.url;
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.message || 'Please try again'));
      setLoading(null);
    }
  };

  return (
    <div className="pricing-page">
      {/* Header Navigation */}
      <div className="pricing-nav">
        <button onClick={() => navigate('/')} className="nav-home-btn">
          <Home size={20} />
          Home
        </button>
      </div>

      <div className="pricing-container">
        {/* Header */}
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Simple, transparent pricing. Upgrade or downgrade anytime.</p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={billingPeriod === 'monthly' ? 'active' : ''}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={billingPeriod === 'yearly' ? 'active' : ''}
            >
              Yearly
              <span className="discount-badge">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
              
              <div className="plan-header">
                {plan.type === 'free' ? <Zap size={40} /> : <Crown size={40} />}
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">₹</span>
                  <span className="price">
                    {billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="period">
                    /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && plan.yearlyPrice > 0 && (
                  <p className="yearly-note">
                    ₹{Math.round(plan.yearlyPrice / 12)}/month billed yearly
                  </p>
                )}
              </div>

              <div className="prompts-badge">
                <strong>{plan.prompts}</strong> prompts/{billingPeriod === 'monthly' ? 'month' : 'year'}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={18} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`plan-button ${plan.type !== 'free' ? 'primary' : ''}`}
                disabled={loading === plan.type}
              >
                {loading === plan.type ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {plan.type === 'free' ? 'Get Started' : 'Subscribe Now'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="trust-section">
          <div className="trust-item">
            <span className="trust-icon">✅</span>
            <span>Secure Payment</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>256-bit SSL</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">💳</span>
            <span>UPI, Cards, Net Banking</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🇮🇳</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </div>
  );
}
