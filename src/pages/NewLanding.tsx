// src/components/NewLanding.tsx - SPOTIFY-STYLE WITH ANIMATIONS

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Check } from 'lucide-react';
import { FloatingProfile } from './../../src/components/FloatingProfile';

export const NewLanding = () => {
  const [promptValue, setPromptValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [proSelectedCredits, setProSelectedCredits] = useState(200);
  const [loading, setLoading] = useState<string | null>(null);

  // COMPLETE DODO PRODUCT IDs
  const DODO_PRODUCT_IDS: Record<number, { monthly: string; yearly: string }> = {
    200: { 
      monthly: 'pdt_liJ8yOzgaQsrLn13Cfz2l',
      yearly: 'pdt_g21xcO89Y49Eclki32zoe'
    },
    400: { 
      monthly: 'pdt_t1RjSD0AcujKuMG29MLWO',
      yearly: 'pdt_NStUCC2VQGxxrNHEwYxVi'
    },
    800: { 
      monthly: 'pdt_SvFnZ2TFVE5LlEXQNRFaR',
      yearly: 'pdt_Ca7MwDjY70LLD0UPyNNar'
    },
    1000: { 
      monthly: 'pdt_Dd34uUeSVDNqOhJQUnow1',
      yearly: 'pdt_5NBIzH8JY4uqQEiVTqvNw'
    },
    1200: { 
      monthly: 'pdt_w5NtV4D5IY1Xgw1FstmiP',
      yearly: 'pdt_miCaEqeDSmKxkiWiKQLkA'
    },
    2000: { 
      monthly: 'pdt_KPx0Y7jgrU43TvMwJA0Y8',
      yearly: 'pdt_0nTME0rK7rKRLl5aCeXeK'
    },
    3000: { 
      monthly: 'pdt_CyFSrKJuq3yMq3Egf304z',
      yearly: 'pdt_wwaFBqnjWYmG3fXkVny0D'
    },
    4000: { 
      monthly: 'pdt_powJsk4UOjTTh804wyzId',
      yearly: 'pdt_PyUVylEHufWlV2D7NFCRd'
    },
    5000: { 
      monthly: 'pdt_uu5ezzZDmBSe3RyVMpZo3',
      yearly: 'pdt_b3OFihe2COIxb6QVaifF3'
    }
  };

  const getCreditsPrice = (credits: number, billing: 'monthly' | 'yearly'): number => {
    const monthlyPrices: Record<number, number> = {
      200: 11.99,
      400: 23.99,
      800: 47.99,
      1000: 59.99,
      1200: 71.99,
      2000: 119.99,
      3000: 179.99,
      4000: 239.99,
      5000: 299.99
    };
    
    const monthlyPrice = monthlyPrices[credits] || 11.99;
    
    if (billing === 'yearly') {
      return monthlyPrice * 6; // 50% off
    }
    
    return monthlyPrice;
  };

  const calculateYearlySavings = (credits: number): number => {
    const monthlyPrice = {
      200: 11.99, 400: 23.99, 800: 47.99, 1000: 59.99, 1200: 71.99,
      2000: 119.99, 3000: 179.99, 4000: 239.99, 5000: 299.99
    }[credits] || 11.99;
    
    return monthlyPrice * 6;
  };

  const handleProSubscribe = () => {
    if (!user) {
      alert('Please sign in to subscribe');
      navigate('/signup');
      return;
    }

    if (!user.email) {
      alert('Email is required for checkout');
      return;
    }
    
    setLoading('pro');
    
    const productId = DODO_PRODUCT_IDS[proSelectedCredits]?.[billingPeriod];
    
    if (!productId) {
      alert('Product configuration error');
      setLoading(null);
      return;
    }

    const purchaseData = {
      userId: user.uid,
      userEmail: user.email,
      credits: proSelectedCredits,
      billingPeriod: billingPeriod,
      amount: getCreditsPrice(proSelectedCredits, billingPeriod).toFixed(2),
      productId: productId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('pendingPurchase', JSON.stringify(purchaseData));
    console.log('💾 Purchase data saved:', purchaseData);

    const redirectUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
    const checkoutUrl = `https://test.checkout.dodopayments.com/buy/${productId}?quantity=1&redirect_url=${redirectUrl}`;

    console.log('🔗 Redirecting to:', checkoutUrl);
    window.location.href = checkoutUrl;
  };

  const placeholderTexts = [
    "Create a tab manager that groups tabs by domain...",
    "Build a password manager with auto-fill and encryption...",
    "Make a screenshot tool with annotation and sharing...",
    "Develop a productivity timer with Pomodoro technique...",
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholderTexts.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptValue.trim()) {
      if (!user) {
        navigate('/signup');
      } else {
        navigate(`/builder?prompt=${encodeURIComponent(promptValue)}`);
      }
    }
  };

  const features = [
    {
      title: "AI Code Generation",
      description: "Instantly turn your prompt into full code with contextual understanding.",
      icon: "🤖"
    },
    {
      title: "Live Preview & IDE",
      description: "Write code, see previews instantly, no setup or reloads needed.",
      icon: "⚡"
    },
    {
      title: "One-Click Deployment",
      description: "Deploy your app globally with a click, including SSL and CDN.",
      icon: "🚀"
    },
    {
      title: "Full Stack Integration",
      description: "Compose your frontend, backend, and database seamlessly.",
      icon: "🔗"
    },
  ];

  const browsers = [
    { name: 'Chrome', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg', color: '#4285F4' },
    { name: 'Firefox', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg', color: '#FF6611' },
    { name: 'Edge', logo: 'https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/edge.svg', color: '#0078D7' },
    { name: 'Safari', logo: 'https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/safari.svg', color: '#006CFF' },
    { name: 'Opera', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opera/opera-original.svg', color: '#FF1B2D' },
    { name: 'Brave', logo: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg', color: '#FB542B' }
  ];

  return (
    <>
    <FloatingProfile />
      {/* Hero Section */}
      <div id="home" className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center w-full max-w-5xl">
          <div className="inline-block mb-6 px-5 py-2 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
            ✨ AI-Powered Extension Builder
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-5 leading-tight text-center text-gray-900">
            Build Extensions For <br/>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Any Browser
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl text-center">
            Create browser extensions by chatting in plain English. No coding required.
          </p>

          {/* Prompt Box */}
          <form onSubmit={handleSubmit} className="max-w-2xl w-full">
            <div className="rounded-2xl bg-white border-2 border-gray-300 shadow-lg flex items-center p-3 hover:border-gray-400 transition-all">
              <button type="button" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center" tabIndex={-1}>
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
              <textarea
                placeholder={placeholderTexts[currentPlaceholder]}
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                rows={2}
                className="flex-1 min-h-[48px] resize-none bg-transparent border-none outline-none text-base px-4 placeholder-gray-400 text-gray-900"
                onKeyDown={e => {
                  if ((e.key === "Enter") && (e.metaKey || e.ctrlKey)) {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!promptValue.trim()}
                className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 transition-all"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </form>

          {/* Animated Browser Logos */}
          <div className="mt-16 w-full">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide text-center mb-8">
              Works with all major browsers
            </p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {browsers.map((browser, index) => (
                <div
                  key={browser.name}
                  className="browser-logo group flex flex-col items-center gap-3 cursor-pointer"
                  style={{
                    animation: `floatIn 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div
                    className="relative w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:-translate-y-2"
                    style={{
                      boxShadow: `0 4px 20px ${browser.color}20`
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                      style={{
                        background: `radial-gradient(circle, ${browser.color}40 0%, transparent 70%)`
                      }}
                    />
                    <img
                      src={browser.logo}
                      alt={browser.name}
                      className="relative z-10 w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span
                    className="text-sm font-bold transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: browser.color
                    }}
                  >
                    {browser.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map(({ title, description, icon }, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - SPOTIFY STYLE */}
      <section id="pricing" className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 text-center">
            Choose your plan
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Pick the plan that's right for you
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-8 mb-16">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`text-lg font-bold transition-all ${billingPeriod === 'monthly' ? 'text-gray-900 underline decoration-4 underline-offset-8' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Monthly
            </button>
            
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`text-lg font-bold transition-all ${billingPeriod === 'yearly' ? 'text-gray-900 underline decoration-4 underline-offset-8' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Yearly
              <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Save 50%</span>
            </button>
          </div>

          {/* Pricing Cards - Spotify Colors */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Free Plan - Blue */}
            <div 
              className="rounded-3xl p-8 text-white relative overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-3">Free</h3>
                <div className="mb-6">
                  <span className="text-6xl font-black">$0</span>
                  <span className="text-xl text-white/80 ml-2">/ forever</span>
                </div>
                
                <div className="space-y-3 mb-8">
                  {[
                    '30 credits/month',
                    '5 credits daily limit',
                    'Create up to 5 projects',
                    'Chrome extensions only',
                    'Preview & download'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => user ? navigate('/builder') : navigate('/signup')}
                  className="w-full py-4 rounded-full font-bold bg-white text-blue-600 hover:bg-blue-50 transition-all"
                >
                  {user ? 'Current plan' : 'Get started'}
                </button>
              </div>
            </div>

            {/* Pro Plan - Green (Spotify) */}
            <div 
              className="rounded-3xl p-8 text-white relative overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
              }}
            >
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                Popular
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4">Pro</h3>
                
                {/* Credits Selector */}
                <select
                  value={proSelectedCredits}
                  onChange={(e) => setProSelectedCredits(parseInt(e.target.value))}
                  className="w-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/40 rounded-2xl px-4 py-3 mb-6 font-bold cursor-pointer hover:bg-white/30 transition appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  {[200, 400, 800, 1000, 1200, 2000, 3000, 4000, 5000].map(credits => (
                    <option key={credits} value={credits} style={{color: '#000', backgroundColor: '#fff', fontWeight: 'bold'}}>
                      {credits} credits/month
                    </option>
                  ))}
                </select>

                <div className="mb-4">
                  <span className="text-6xl font-black">
                    ${getCreditsPrice(proSelectedCredits, billingPeriod)}
                  </span>
                  <span className="text-xl text-white/80 ml-2">
                    / {billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {billingPeriod === 'yearly' && (
                  <div className="mb-6 bg-yellow-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-black inline-block">
                    Save ${calculateYearlySavings(proSelectedCredits).toFixed(2)}/year 🎉
                  </div>
                )}
                
                <div className="space-y-3 mb-8">
                  {[
                    `${proSelectedCredits} credits/month`,
                    'No daily limit',
                    'Unlimited projects',
                    'Edit code & preview',
                    'All browser extensions',
                    'Priority email support'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleProSubscribe}
                  disabled={loading === 'pro'}
                  className="w-full py-4 rounded-full font-black bg-white text-green-600 hover:bg-green-50 transition-all disabled:opacity-50"
                >
                  {loading === 'pro' ? 'Processing...' : `Get Pro`}
                </button>
                
                <p className="text-xs text-white/70 mt-4 text-center">
                  Cancel anytime. No commitments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-black mb-2">ExtensionBuilder</h3>
          <p className="text-gray-400 mb-6">Build extensions with AI</p>
          <p className="text-sm text-gray-500">&copy; 2025 ExtensionBuilder. All rights reserved.</p>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes floatIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .browser-logo:hover img {
          animation: wiggle 0.5s ease-in-out;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg) scale(1.1); }
          75% { transform: rotate(5deg) scale(1.1); }
        }
      `}</style>
    </>
  );
};
