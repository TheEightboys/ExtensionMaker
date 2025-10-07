// src/components/NewLanding.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPayment } from './../../src/services/paymentservice';
import { ArrowRight, Plus, Loader2, Zap } from 'lucide-react';

export const NewLanding = () => {
  const [promptValue, setPromptValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  
  // ADD THESE NEW STATE VARIABLES
  const [basicSelectedCredits, setBasicSelectedCredits] = useState(0);
  const [basicSelectedPrice, setBasicSelectedPrice] = useState(0);
  const [proSelectedCredits, setProSelectedCredits] = useState(0);
  const [proSelectedPrice, setProSelectedPrice] = useState(0);

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
  }, [placeholderTexts.length]);

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

  const handlePayment = async (plan: 'basic' | 'pro', period: 'monthly' | 'yearly') => {
  if (!user) {
    navigate('/signup');
    return;
  }

  const prices = {
    basic: { monthly: 6, yearly: 36 },    // $6/month or $36/year
    pro: { monthly: 12, yearly: 72 }      // $12/month or $72/year
  };

  setLoading(`${plan}-${period}`);

  try {
    const amount = prices[plan][period];
    
    const paymentSession = await createPayment(user.uid, user.email!, {
      amount,
      currency: 'USD',  // Changed to USD
      planName: plan.charAt(0).toUpperCase() + plan.slice(1),
      planType: plan,
      billingPeriod: period
    });

    window.location.href = paymentSession.url;
  } catch (error: any) {
    console.error('Payment error:', error);
    alert('Payment failed: ' + (error.message || 'Please try again'));
    setLoading(null);
  }
};

  const features = [
    {
      title: "AI Code Generation",
      description: "Instantly turn your prompt into full code with contextual understanding.",
      bgColor: "bg-blue-50",
    },
    {
      title: "Live Preview & IDE",
      description: "Write code, see previews instantly, no setup or reloads needed.",
      bgColor: "bg-blue-100",
    },
    {
      title: "One-Click Deployment",
      description: "Deploy your app globally with a click, including SSL and CDN.",
      bgColor: "bg-blue-50",
    },
    {
      title: "Full Stack Integration",
      description: "Composer your frontend, backend, and database seamlessly.",
      bgColor: "bg-blue-100",
    },
  ];

  const browsers = [
    {
      name: 'Chrome',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg',
      color: '#4285F4'
    },
    {
      name: 'Firefox',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg',
      color: '#FF6611'
    },
    {
      name: 'Edge',
      logo: 'https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/edge.svg',
      color: '#0078D7'
    },
    {
      name: 'Safari',
      logo: 'https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/safari.svg',
      color: '#006CFF'
    },
    {
      name: 'Opera',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opera/opera-original.svg',
      color: '#FF1B2D'
    },
    {
      name: 'Brave',
      logo: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
      color: '#FB542B'
    }
  ];

  return (
    <>
      <div
        id="home"
        className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center relative"
        style={{
          background:
            "linear-gradient(180deg, #fff 0%, #f0f4ff 35%, #d6dafe 56%, #bec5fb 72%, #97a4ed 85%, #f5b3d7 100%)",
        }}
      >
        <div className="flex flex-col items-center w-full">
          <div className="inline-block mb-8 px-5 py-2 rounded-full bg-white/70 border border-gray-200 text-sm font-medium text-gray-700 shadow-md backdrop-blur">
            Introducing ExtensionBuilder Cloud
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight text-gray-900 text-center">
            Build Extensions For{" "}
            <span
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 bg-clip-text text-transparent"
              style={{ letterSpacing: "-0.03em" }}
            >
              Any Browser
            </span>
          </h1>
          <p className="text-lg text-gray-600 font-medium mb-10 max-w-lg mx-auto text-center">
            Create browser extensions by chatting in plain English.
          </p>

          {/* Prompt Box */}
          <form onSubmit={handleSubmit} className="max-w-lg w-full mx-auto">
            <div className="rounded-3xl bg-white/85 border border-gray-100 shadow-xl flex items-center hover:shadow-2xl transition-shadow p-3 backdrop-blur-lg">
              <button
                type="button"
                aria-hidden="true"
                className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-default flex items-center justify-center"
                tabIndex={-1}
              >
                <Plus className="w-5 h-5 text-gray-600 pointer-events-none" />
              </button>
              <textarea
                placeholder={placeholderTexts[currentPlaceholder]}
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                rows={2}
                className="flex-1 min-h-[46px] resize-none bg-transparent border-none outline-none text-base font-normal pl-3 pr-4 placeholder-gray-400"
                onKeyDown={e => {
                  if (
                    (e.key === "Enter" || e.key === "NumpadEnter") &&
                    (e.metaKey || e.ctrlKey)
                  ) {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!promptValue.trim() || isTyping}
                className="ml-auto w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                aria-label="Submit"
              >
                {isTyping ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-6 h-6" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center select-none">
              Press <kbd className="px-1 font-mono bg-gray-100 rounded">⌘</kbd> + <kbd className="px-1 font-mono bg-gray-100 rounded">Enter</kbd> to send
            </p>
          </form>

          {/* Browser Logos Section */}
          <div className="mt-12 mb-8 w-full max-w-6xl px-4">
            <div className="text-center mb-6">
              <p className="inline-block text-xs font-bold text-gray-500 uppercase tracking-[0.25em] mb-3 px-6 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm">
                Works with all major browsers
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#f5b3d7] to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#f5b3d7] to-transparent z-10 pointer-events-none"></div>
              
              <div className="overflow-hidden py-4">
                <div className="flex items-center justify-center gap-6 md:gap-10 browser-scroll px-8">
                  {[...browsers, ...browsers].map((browser, index) => (
                    <div
                      key={`${browser.name}-${index}`}
                      className="group flex flex-col items-center gap-3 min-w-[100px] transition-all duration-300 hover:scale-110 cursor-pointer"
                    >
                      <div
                        className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2"
                        style={{
                          boxShadow: `0 10px 30px ${browser.color}15, 0 0 0 1px ${browser.color}10`
                        }}
                      >
                        <div 
                          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                          style={{
                            background: `radial-gradient(circle at center, ${browser.color}30 0%, transparent 70%)`
                          }}
                        />
                        <img
                          src={browser.logo}
                          alt={browser.name}
                          className="relative z-10 w-12 h-12 md:w-14 md:h-14 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                        />
                      </div>
                      <span
                        className="text-sm md:text-base font-bold text-gray-700 group-hover:text-current transition-all duration-300"
                        style={{ 
                          color: browser.color,
                          textShadow: '0 2px 10px rgba(0,0,0,0.05)'
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
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .browser-scroll {
              animation: scroll 35s linear infinite;
            }
            .browser-scroll:hover {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .browser-scroll {
                animation: scroll 25s linear infinite;
              }
            }
          `}
        </style>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Explore Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map(({ title, description, bgColor }, i) => (
              <div
                key={i}
                className={`flex flex-col items-center p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${bgColor} border border-blue-100`}
              >
                <div className="w-full flex justify-center mb-4">
                  <div className="w-32 h-32 bg-blue-200 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-4xl">{title.charAt(0)}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>
                <p className="text-gray-700 text-center max-w-md">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Pricing Section - WITH LOVABLE-STYLE DROPDOWN */}
{/* Pricing Section - FIXED WITH WORKING PAYMENT */}
{/* Pricing Section - COMPLETE FIXED VERSION */}
<section id="pricing" className="py-20 px-6 md:px-12 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
        Choose Your Plan
      </h2>
      <p className="text-base text-gray-600">Start free, upgrade anytime. Cancel whenever you want.</p>
    </div>
    
    <div className="grid md:grid-cols-3 gap-8">
      {/* Free Plan */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
        <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-gray-200 text-black text-base">
          Free Forever
        </span>
        <h3 className="text-3xl mt-16 font-bold text-gray-600 mb-1">Free</h3>
        <div className="text-xl font-bold text-gray-900">$0</div>
        <div className="text-sm text-gray-600 mb-6">Forever free</div>
        
        <div className="bg-gray-100 rounded-lg p-3 mb-4 border border-gray-300">
          <div className="text-2xl font-black text-gray-700 mb-1">30 Credits/month</div>
          <div className="text-xs text-gray-600">5 credits/day limit</div>
        </div>

        <ul className="mb-8 mt-2 text-gray-800 text-base space-y-3">
          <li>✓ 30 credits per month</li>
          <li>✓ 5 credits daily limit</li>
          <li>✓ Up to 10 projects</li>
          <li>✓ Preview & download</li>
        </ul>
        
        <button 
          onClick={() => user ? navigate('/builder') : navigate('/signup')}
          className="w-full py-4 rounded-full font-bold bg-gray-200 text-black text-lg mt-auto hover:bg-gray-300 transition"
        >
          Get Started Free
        </button>
      </div>

      {/* Basic Plan */}
      <BasicPlanCard 
        user={user} 
        navigate={navigate} 
        loading={loading} 
        setLoading={setLoading}
        selectedCredits={basicSelectedCredits}
        setSelectedCredits={setBasicSelectedCredits}
        selectedPrice={basicSelectedPrice}
        setSelectedPrice={setBasicSelectedPrice}
      />

      {/* Pro Plan */}
      <ProPlanCard 
        user={user} 
        navigate={navigate} 
        loading={loading} 
        setLoading={setLoading}
        selectedCredits={proSelectedCredits}
        setSelectedCredits={setProSelectedCredits}
        selectedPrice={proSelectedPrice}
        setSelectedPrice={setProSelectedPrice}
      />
    </div>
  </div>
</section>



      {/* Beautiful Footer with Customer Support */}
<footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
  {/* Main Footer Content */}
  <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
      
      {/* Brand Section */}
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl font-black text-white">E</span>
          </div>
          <h3 className="text-2xl font-black text-white">ExtensionBuilder</h3>
        </div>
        <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
          Create amazing browser extensions with AI. No coding experience needed. 
          Build, customize, and deploy in minutes.
        </p>
        
        {/* Social Links */}
        <div className="flex gap-3">
          <a 
            href="https://twitter.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
            </svg>
          </a>
          <a 
            href="https://github.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-blue-700 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="text-white font-bold mb-4 text-lg">Quick Links</h4>
        <ul className="space-y-3">
          <li>
            <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <span className="text-blue-500">→</span> Features
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <span className="text-blue-500">→</span> Pricing
            </a>
          </li>
          <li>
            <a href="/builder" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <span className="text-blue-500">→</span> Builder
            </a>
          </li>
          <li>
            <a href="/docs" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <span className="text-blue-500">→</span> Documentation
            </a>
          </li>
        </ul>
      </div>

      {/* Customer Support */}
      <div>
        <h4 className="text-white font-bold mb-4 text-lg">Customer Support</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">Chat on WhatsApp</p>
              <a 
                href="https://wa.me/919345810919?text=Hi%2C%20I%20need%20help%20with%20ExtensionBuilder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat Now
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">Call Support</p>
              <a 
                href="tel:+919345810919"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +91 93458 10919
              </a>
              <p className="text-xs text-gray-500 mt-2">Contact: Logaprasanth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Bar */}
  <div className="border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-sm">
          &copy; 2025 ExtensionBuilder. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm">
          <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
            Terms of Service
          </a>
          <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  </div>
</footer>

    </>
  );
  // BASIC PLAN COMPONENT - ADD THIS BEFORE THE CLOSING };
// BASIC PLAN COMPONENT - COMPLETE WITH CREDIT BUNDLE
// BASIC PLAN COMPONENT - FIXED (NO REFRESH)
// BASIC PLAN COMPONENT - STATE FROM PARENT (GUARANTEED NO RESET)
function BasicPlanCard({ 
  user, 
  navigate, 
  loading, 
  setLoading, 
  selectedCredits, 
  setSelectedCredits, 
  selectedPrice, 
  setSelectedPrice 
}: any) {
  
  const creditOptions = [
    { credits: 0, price: 0, label: 'No extra credits' },
    { credits: 50, price: 5, label: '50 credits - $5' },
    { credits: 100, price: 9, label: '100 credits - $9' },
    { credits: 200, price: 15, label: '200 credits - $15' },
    { credits: 500, price: 30, label: '500 credits - $30' },
    { credits: 1000, price: 50, label: '1000 credits - $50' }
  ];

  const handleCreditChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const credits = parseInt(e.target.value);
    const selected = creditOptions.find(opt => opt.credits === credits);
    if (selected) {
      setSelectedCredits(selected.credits);
      setSelectedPrice(selected.price);
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      navigate('/signup');
      return;
    }

    setLoading('basic-monthly');

    const planUrl = import.meta.env.VITE_DODO_BASIC_PLAN;
    
    if (!planUrl) {
      alert('Payment not configured. Please add VITE_DODO_BASIC_PLAN to your .env file');
      setLoading(null);
      return;
    }

    if (selectedCredits > 0) {
      const creditUrlMap: Record<number, string> = {
        50: import.meta.env.VITE_DODO_50_CREDITS,
        100: import.meta.env.VITE_DODO_100_CREDITS,
        200: import.meta.env.VITE_DODO_200_CREDITS,
        500: import.meta.env.VITE_DODO_500_CREDITS,
        1000: import.meta.env.VITE_DODO_1000_CREDITS
      };

      const creditUrl = creditUrlMap[selectedCredits];
      
      if (!creditUrl) {
        alert(`Payment link for ${selectedCredits} credits not configured`);
        setLoading(null);
        return;
      }

      localStorage.setItem('pendingPlanSubscription', JSON.stringify({
        plan: 'basic',
        planUrl: planUrl,
        credits: selectedCredits,
        userId: user.uid,
        email: user.email
      }));

      window.location.href = creditUrl;
      return;
    }

    window.location.href = planUrl;
  };

  const totalPrice = 6 + selectedPrice;
  const totalCredits = 130 + selectedCredits;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
      <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-pink-200 text-black text-base">
        $6 per month
      </span>
      <h3 className="text-3xl mt-16 font-bold text-pink-600 mb-1">Basic</h3>
      <div className="text-xl font-bold text-gray-900">$6/month</div>
      <div className="text-sm text-gray-600 mb-6">Billed monthly</div>
      
      <div className="bg-pink-100 rounded-lg p-3 mb-4 border border-pink-300">
        <div className="text-2xl font-black text-pink-700 mb-1">
          {selectedCredits > 0 ? `${totalCredits} Credits` : '30 + 100 Credits'}
        </div>
        <div className="text-xs text-pink-600">100 credits/day limit</div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          💳 Add Extra Credits (Optional)
        </label>
        <select 
          onChange={handleCreditChange}
          value={selectedCredits}
          className="w-full py-3 px-4 bg-white border-2 border-pink-300 rounded-lg font-semibold text-gray-900 text-sm cursor-pointer hover:border-pink-400 transition focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          {creditOptions.map(option => (
            <option key={option.credits} value={option.credits}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="mb-6 mt-2 text-gray-800 text-base space-y-3">
        <li>✓ 130 total credits/month</li>
        <li>✓ 100 credits daily limit</li>
        <li>✓ Up to 100 projects</li>
        <li>✓ Preview & download</li>
      </ul>

      {selectedCredits > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-green-600" />
            <p className="text-sm font-bold text-green-800">
              +{selectedCredits} extra credits included!
            </p>
          </div>
          <p className="text-xs text-green-700">
            Total first month: ${totalPrice} (Plan $6 + Credits ${selectedPrice})
          </p>
        </div>
      )}
      
      <button 
        onClick={handleSubscribe}
        disabled={loading === 'basic-monthly'}
        className="w-full py-4 rounded-full font-bold bg-pink-200 text-black text-lg mt-auto hover:bg-pink-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading === 'basic-monthly' ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : selectedCredits > 0 ? (
          `Continue with Basic + ${selectedCredits} credits - $${totalPrice}`
        ) : (
          'Continue with Basic - $6/month'
        )}
      </button>
    </div>
  );
}

// PRO PLAN COMPONENT - STATE FROM PARENT (GUARANTEED NO RESET)
function ProPlanCard({ 
  user, 
  navigate, 
  loading, 
  setLoading,
  selectedCredits,
  setSelectedCredits,
  selectedPrice,
  setSelectedPrice
}: any) {
  
  const creditOptions = [
    { credits: 0, price: 0, label: 'No extra credits' },
    { credits: 50, price: 5, label: '50 credits - $5' },
    { credits: 100, price: 9, label: '100 credits - $9' },
    { credits: 200, price: 15, label: '200 credits - $15' },
    { credits: 500, price: 30, label: '500 credits - $30' },
    { credits: 1000, price: 50, label: '1000 credits - $50' }
  ];

  const handleCreditChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const credits = parseInt(e.target.value);
    const selected = creditOptions.find(opt => opt.credits === credits);
    if (selected) {
      setSelectedCredits(selected.credits);
      setSelectedPrice(selected.price);
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      navigate('/signup');
      return;
    }

    setLoading('pro-monthly');

    const planUrl = import.meta.env.VITE_DODO_PRO_PLAN;
    
    if (!planUrl) {
      alert('Payment not configured. Please add VITE_DODO_PRO_PLAN to your .env file');
      setLoading(null);
      return;
    }

    if (selectedCredits > 0) {
      const creditUrlMap: Record<number, string> = {
        50: import.meta.env.VITE_DODO_50_CREDITS,
        100: import.meta.env.VITE_DODO_100_CREDITS,
        200: import.meta.env.VITE_DODO_200_CREDITS,
        500: import.meta.env.VITE_DODO_500_CREDITS,
        1000: import.meta.env.VITE_DODO_1000_CREDITS
      };

      const creditUrl = creditUrlMap[selectedCredits];
      
      if (!creditUrl) {
        alert(`Payment link for ${selectedCredits} credits not configured`);
        setLoading(null);
        return;
      }

      localStorage.setItem('pendingPlanSubscription', JSON.stringify({
        plan: 'pro',
        planUrl: planUrl,
        credits: selectedCredits,
        userId: user.uid,
        email: user.email
      }));

      window.location.href = creditUrl;
      return;
    }

    window.location.href = planUrl;
  };

  const totalPrice = 12 + selectedPrice;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
      <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-purple-200 text-black text-base">
        $12 per month
      </span>
      <h3 className="text-3xl mt-16 font-bold text-purple-600 mb-1">Pro</h3>
      <div className="text-xl font-bold text-gray-900">$12/month</div>
      <div className="text-sm text-gray-600 mb-6">Billed monthly</div>
      
      <div className="bg-purple-100 rounded-lg p-3 mb-4 border border-purple-300">
        <div className="text-2xl font-black text-purple-700 mb-1">
          {selectedCredits > 0 ? `Unlimited + ${selectedCredits}` : '30 + Unlimited'}
        </div>
        <div className="text-xs text-purple-600">No daily limit</div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          💳 Add Extra Credits (Optional)
        </label>
        <select 
          onChange={handleCreditChange}
          value={selectedCredits}
          className="w-full py-3 px-4 bg-white border-2 border-purple-300 rounded-lg font-semibold text-gray-900 text-sm cursor-pointer hover:border-purple-400 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {creditOptions.map(option => (
            <option key={option.credits} value={option.credits}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="mb-6 mt-2 text-gray-800 text-base space-y-3">
        <li>✓ Unlimited credits</li>
        <li>✓ No daily limit</li>
        <li>✓ Unlimited projects</li>
        <li>✓ Edit code & preview</li>
      </ul>

      {selectedCredits > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-green-600" />
            <p className="text-sm font-bold text-green-800">
              +{selectedCredits} extra credits included!
            </p>
          </div>
          <p className="text-xs text-green-700">
            Total first month: ${totalPrice} (Plan $12 + Credits ${selectedPrice})
          </p>
        </div>
      )}
      
      <button 
        onClick={handleSubscribe}
        disabled={loading === 'pro-monthly'}
        className="w-full py-4 rounded-full font-bold bg-purple-200 text-black text-lg mt-auto hover:bg-purple-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading === 'pro-monthly' ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : selectedCredits > 0 ? (
          `Continue with Pro + ${selectedCredits} credits - $${totalPrice}`
        ) : (
          'Continue with Pro - $12/month'
        )}
      </button>
    </div>
  );
}


};
