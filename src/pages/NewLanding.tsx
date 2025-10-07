import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Check, Search } from 'lucide-react';

export const NewLanding = () => {
  const [promptValue, setPromptValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const navigate = useNavigate();

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

  const { user } = useAuth();

  const handleSubscribe = (plan: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    alert(`Subscribe to ${plan} plan. Stripe integration pending.`);
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Try ExtensionBuilder',
      color: 'from-blue-200 to-blue-300',
      buttonColor: 'bg-gradient-to-r from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400 text-gray-900',
      features: [
        '3 extensions per month',
        'All browser targets',
        'Live preview',
        'Code export',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/ month',
      description: 'For serious developers',
      color: 'from-blue-300 to-blue-400',
      buttonColor: 'bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white',
      popular: true,
      features: [
        '50 extensions per month',
        'All browser targets',
        'Live preview',
        'Priority generation',
        'Advanced customization',
        'Email support',
        'No watermarks',
      ],
    },
    {
      name: 'Team',
      price: '₹999',
      period: '/ month',
      description: 'For teams & agencies',
      color: 'from-blue-400 to-blue-500',
      buttonColor: 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white',
      features: [
        'Unlimited extensions',
        'All browser targets',
        'Live preview',
        'Priority support',
        'Custom templates',
        'Team collaboration',
        'API access',
        'Dedicated account manager',
      ],
    },
  ];

  const templates = [
    {
      id: 1,
      name: "Discount Reminder",
      category: "Shopping",
      description:
        "Automatically notifies users of discount codes and promotions while browsing e-commerce websites in real-time.",
      tags: ["React", "Chrome API", "Notifications"],
      image: "https://via.placeholder.com/300x200?text=Discount+Reminder",
    },
    {
      id: 2,
      name: "Grammar Correction",
      category: "Writing",
      description:
        "Smart browser extension that underlines grammatical mistakes and suggests corrections on the go.",
      tags: ["JavaScript", "Content Scripts", "AI"],
      image: "https://via.placeholder.com/300x200?text=Grammar+Correction",
    },
    {
      id: 3,
      name: "Tab Organizer",
      category: "Productivity",
      description:
        "Manage and group your browser tabs intelligently to boost your workflow and reduce clutter.",
      tags: ["React", "State Management", "Tabs API"],
      image: "https://via.placeholder.com/300x200?text=Tab+Organizer",
    },
    {
      id: 4,
      name: "Password Manager",
      category: "Security",
      description:
        "Securely save and autofill your passwords, generate strong credentials, and monitor breaches.",
      tags: ["Security", "Browser Storage", "Encryption"],
      image: "https://via.placeholder.com/300x200?text=Password+Manager",
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = () => {
    if (!user) {
      navigate('/signup');
    } else {
      navigate('/dashboard');
    }
  };

  // Browser logos data
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
        {/* CONTENT */}
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
                className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-default"
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

          {/* Browser Logos Section - NEW */}
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
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(28px);}
              to { opacity: 1; transform: translateY(0);}
            }
            .animate-fade-in-up {
              animation: fade-in-up 0.9s cubic-bezier(.23,1.01,.73,1.04) both;
            }
            @keyframes spin {
              to { transform: rotate(360deg) }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
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
                    {/* Placeholder for image */}
                    <span className="text-blue-600 font-bold">{title.charAt(0)}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>
                <p className="text-gray-700 text-center max-w-md">{description}</p>
                <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
{/* Pricing Section */}
{/* Pricing Section */}
{/* Pricing Section */}
<section id="pricing" className="py-20 px-6 md:px-12 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
        Go Premium 
      </h2>
      <p className="text-base text-gray-600">1 Credit = 1 Prompt | Get more prompts with yearly plans!</p>
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      {/* Free Plan */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
        <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-gray-200 text-black text-base" style={{ letterSpacing: "0.02em" }}>
          Free Forever
        </span>
        <h3 className="text-3xl mt-16 font-bold text-gray-600 mb-1">Free</h3>
        <div className="text-xl font-bold text-gray-900">$0</div>
        <div className="text-sm text-gray-600 mb-6">Forever free</div>
        
        {/* Credits badge */}
        <div className="bg-gray-100 rounded-lg p-3 mb-4 border border-gray-300">
          <div className="text-2xl font-black text-gray-700 mb-1">10 Credits</div>
          <div className="text-xs text-gray-600">10 prompts per month</div>
        </div>

        <ul className="mb-8 mt-2 text-gray-800 text-base space-y-3" style={{ minHeight: 110 }}>
          <li>10 prompts per month</li>
          <li>All browser compatibility</li>
          <li>Code export & live preview</li>
          <li>Community support</li>
        </ul>
        <button 
          onClick={() => {
            if (!user) {
              navigate('/signup');
            } else {
              navigate('/dashboard');
            }
          }}
          className="w-full py-4 rounded-full font-bold bg-gray-200 text-black text-lg mt-auto mb-3 hover:bg-gray-300 transition"
        >
          Get Started Free
        </button>
        <button className="w-full py-4 rounded-full font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition">
          Continue with Free
        </button>
      </div>

      {/* Basic Plan */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
        <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-pink-200 text-black text-base" style={{ letterSpacing: "0.02em" }}>
          $6 per month
        </span>
        <h3 className="text-3xl mt-16 font-bold text-pink-600 mb-1">Basic</h3>
        <div className="text-xl font-bold text-gray-900">$6 per month</div>
        <div className="text-sm text-gray-600 mb-6">$36/year (save 50%)</div>
        
        {/* Credits badge */}
        <div className="bg-pink-100 rounded-lg p-3 mb-4 border border-pink-300">
          <div className="text-2xl font-black text-pink-700 mb-1">100 Credits</div>
          <div className="text-xs text-pink-600">
            <span className="font-semibold">Monthly:</span> 100 prompts/month<br />
            <span className="font-semibold">Yearly:</span> 150 prompts/month
          </div>
        </div>

        <ul className="mb-8 mt-2 text-gray-800 text-base space-y-3" style={{ minHeight: 110 }}>
          <li>100 prompts/month (150 yearly)</li>
          <li>All browser compatibility</li>
          <li>Priority generation queue</li>
          <li>Advanced customization</li>
          <li>Email support</li>
        </ul>
        <button 
          onClick={() => {
            if (!user) {
              navigate('/signup');
            } else {
              window.location.href = 'YOUR_BASIC_MONTHLY_STRIPE_LINK';
            }
          }}
          className="w-full py-4 rounded-full font-bold bg-pink-200 text-black text-lg mt-auto mb-3 hover:bg-pink-300 transition"
        >
          Start Basic - $6/month
        </button>
        <button 
          onClick={() => {
            if (!user) {
              navigate('/signup');
            } else {
              window.location.href = 'YOUR_BASIC_YEARLY_STRIPE_LINK';
            }
          }}
          className="w-full py-4 rounded-full font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Get 150 prompts - $36/year
        </button>
      </div>

      {/* Pro Plan */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-300 flex flex-col p-8 shadow-lg">
        <span className="absolute left-7 top-7 px-4 py-1 rounded-md font-semibold bg-purple-200 text-black text-base" style={{ letterSpacing: "0.02em" }}>
          $12 per month
        </span>
        <h3 className="text-3xl mt-16 font-bold text-purple-600 mb-1">Pro</h3>
        <div className="text-xl font-bold text-gray-900">$12 per month</div>
        <div className="text-sm text-gray-600 mb-6">$72/year (save 50%)</div>
        
        {/* Credits badge */}
        <div className="bg-purple-100 rounded-lg p-3 mb-4 border border-purple-300">
          <div className="text-2xl font-black text-purple-700 mb-1">500 Credits</div>
          <div className="text-xs text-purple-600">
            <span className="font-semibold">Monthly:</span> 500 prompts/month<br />
            <span className="font-semibold">Yearly:</span> 750 prompts/month
          </div>
        </div>

        <ul className="mb-8 mt-2 text-gray-800 text-base space-y-3" style={{ minHeight: 110 }}>
          <li>500 prompts/month (750 yearly)</li>
          <li>Everything in Basic, plus:</li>
          <li>4x faster generation</li>
          <li>Advanced AI models</li>
          <li>Priority 24/7 support</li>
          <li>Team collaboration</li>
        </ul>
        <button 
          onClick={() => {
            if (!user) {
              navigate('/signup');
            } else {
              window.location.href = 'YOUR_PRO_MONTHLY_STRIPE_LINK';
            }
          }}
          className="w-full py-4 rounded-full font-bold bg-purple-200 text-black text-lg mt-auto mb-3 hover:bg-purple-300 transition"
        >
          Start Pro - $12/month
        </button>
        <button 
          onClick={() => {
            if (!user) {
              navigate('/signup');
            } else {
              window.location.href = 'YOUR_PRO_YEARLY_STRIPE_LINK';
            }
          }}
          className="w-full py-4 rounded-full font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Get 750 prompts - $72/year
        </button>
      </div>
    </div>

    {/* Credits explanation */}
    <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-3">💡 How Credits Work</h3>
      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
        <div>
          <strong>1 Credit = 1 Prompt</strong><br />
          Each prompt generates one complete browser extension.
        </div>
        <div>
          <strong>Yearly Bonus:</strong><br />
          Get 50% more prompts when you choose yearly billing!
        </div>
        <div>
          <strong>Rollover:</strong><br />
          Unused credits roll over to next month (up to 2x limit).
        </div>
      </div>
    </div>
  </div>
</section>



    
      {/* <section id="templates" className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">Browser Extension Templates</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Kickstart your extension projects with ready-to-use, handpicked templates for popular use cases.
            </p>
          </div>

       
          <div className="flex flex-col md:flex-row md:justify-between gap-4 items-center mb-8">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-800 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

      
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredTemplates.map((temp) => (
              <div
                key={temp.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 flex flex-col cursor-pointer overflow-hidden transition-all duration-300 hover:border-blue-200"
              >
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={temp.image}
                    alt={temp.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-semibold mb-2 px-2 py-1 self-start rounded-full bg-blue-100 text-blue-700 uppercase">
                    {temp.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{temp.name}</h3>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{temp.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {temp.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-700 text-xs font-semibold rounded px-3 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={handleUseTemplate}
                    className="self-start bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No templates found matching your criteria.</p>
            </div>
          )}
        </div>
      </section> */}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-gray-600 text-sm">
          <p>&copy; 2025 ExtensionBuilder. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
};
