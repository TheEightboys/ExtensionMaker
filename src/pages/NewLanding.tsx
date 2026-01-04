// src/pages/NewLanding.tsx - PREMIUM LANDING PAGE WITH GSAP ANIMATIONS
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FloatingProfile } from '../components/FloatingProfile';
import { ArrowRight, Check, Menu, X, Play } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Animated SVG Blob Component
const AnimatedBlob = ({ className = '', color1 = '#ff6b35', color2 = '#f7c59f' }: { className?: string; color1?: string; color2?: string }) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;

    const paths = [
      "M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,339Q39,271,56.5,192.5Q74,114,144,69Q214,24,290.5,54Q367,84,420.5,138Q474,192,466,256Q458,320,440.5,320.5Z",
      "M453.5,320Q425,390,357,423Q289,456,222,432.5Q155,409,100,346Q45,283,64,212.5Q83,142,140.5,89.5Q198,37,275,46Q352,55,410,106Q468,157,468.5,228.5Q469,300,453.5,320Z",
      "M411,314Q392,378,332.5,423.5Q273,469,204,446Q135,423,87,358Q39,293,66,223Q93,153,149,104Q205,55,275,59Q345,63,395.5,115.5Q446,168,442,234Q438,300,411,314Z"
    ];

    let currentPath = 0;

    const morphBlob = () => {
      if (!pathRef.current) return; // Null check to prevent GSAP warnings
      currentPath = (currentPath + 1) % paths.length;
      gsap.to(pathRef.current, {
        attr: { d: paths[currentPath] },
        duration: 4,
        ease: "sine.inOut",
        onComplete: morphBlob
      });
    };

    morphBlob();
  }, []);

  return (
    <svg className={className} viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`blobGrad-${color1}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,339Q39,271,56.5,192.5Q74,114,144,69Q214,24,290.5,54Q367,84,420.5,138Q474,192,466,256Q458,320,440.5,320.5Z"
        fill={`url(#blobGrad-${color1})`}
      />
    </svg>
  );
};

// Floating Code Block with Animation
const FloatingCode = () => {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!codeRef.current) return;

    gsap.to(codeRef.current, {
      y: -15,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }, []);

  return (
    <div ref={codeRef} className="nl-floating-code">
      <div className="nl-code-window">
        <div className="nl-code-bar">
          <span className="nl-dot nl-red"></span>
          <span className="nl-dot nl-yellow"></span>
          <span className="nl-dot nl-green"></span>
        </div>
        <pre className="nl-code-content">
          <code>
            {`{
  "name": "awesome-extension",
  "version": "1.0.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}`}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default function NewLanding() {
  const [prompt, setPrompt] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Custom cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Navbar entrance
      gsap.from('.nl-navbar', { y: -100, duration: 1, ease: 'power3.out' });

      // Hero blob animation
      gsap.from('.nl-hero-blob', {
        scale: 0,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.3
      });

      // Hero content stagger
      gsap.from('.nl-hero-content > *', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.5,
        ease: 'power3.out'
      });

      // Floating code entrance
      gsap.from('.nl-floating-code', {
        x: 100,
        opacity: 0,
        duration: 1.2,
        delay: 0.8,
        ease: 'power3.out'
      });

      // Simple fade-in animations for sections - NO opacity animations to ensure visibility
      gsap.from('.nl-feature-card', {
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        delay: 1.2,
        ease: 'power2.out'
      });

      gsap.from('.nl-step-item', {
        x: -30,
        duration: 0.5,
        stagger: 0.15,
        delay: 1.4,
        ease: 'power2.out'
      });

      gsap.from('.nl-pricing-card', {
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        delay: 1.6,
        ease: 'power2.out'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate(`/builder?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  const features = [
    { title: 'AI-Powered', desc: 'Natural language to production code in seconds', icon: '⚡' },
    { title: 'Manifest V3', desc: 'Always up-to-date with Chrome standards', icon: '🛡️' },
    { title: 'Live Preview', desc: 'See your extension working in real-time', icon: '👁️' },
    { title: 'Export Ready', desc: 'Download and publish to any store', icon: '📦' },
    { title: 'Code Editor', desc: 'VS Code-like editing experience', icon: '✏️' },
    { title: 'Multi-Browser', desc: 'Works on Chrome, Firefox, Edge', icon: '🌐' },
  ];

  const steps = [
    { num: '01', title: 'Describe your idea', desc: 'Just tell us what you want in plain English' },
    { num: '02', title: 'AI generates code', desc: 'Complete extension files created instantly' },
    { num: '03', title: 'Preview & customize', desc: 'Edit in our built-in VS Code editor' },
    { num: '04', title: 'Download & ship', desc: 'Ready to publish to browser stores' },
  ];

  return (
    <div className="nl-app" ref={containerRef}>
      {user && <FloatingProfile />}

      {/* Custom cursor glow */}
      <div
        className="nl-cursor-glow"
        style={{
          transform: `translate(${cursorPos.x - 200}px, ${cursorPos.y - 200}px)`
        }}
      />

      {/* Navbar */}
      <nav className="nl-navbar">
        <div className="nl-navbar-inner">
          <a href="/" className="nl-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2.5" />
              <path d="M12 16L16 20L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>ExtensionBuilder</span>
          </a>

          <div className="nl-nav-menu">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="nl-nav-cta">
            {user ? (
              <button onClick={() => navigate('/builder')} className="nl-btn nl-primary">
                Open Builder
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="nl-btn nl-ghost">Log in</button>
                <button onClick={() => navigate('/signup')} className="nl-btn nl-primary">
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>

          <button className="nl-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="nl-mobile-menu">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <button onClick={() => navigate('/signup')} className="nl-btn nl-primary nl-full">Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="nl-hero">
        <AnimatedBlob className="nl-hero-blob nl-blob-1" color1="#ff6b35" color2="#f7c59f" />
        <AnimatedBlob className="nl-hero-blob nl-blob-2" color1="#1a535c" color2="#4ecdc4" />

        <div className="nl-hero-inner">
          <div className="nl-hero-content">
            <div className="nl-hero-badge">
              <span className="nl-badge-dot"></span>
              Now with real-time preview
            </div>

            <h1 className="nl-hero-title">
              Build browser extensions with AI
            </h1>

            <p className="nl-hero-subtitle">
              Describe your idea. Get working code. Ship in minutes.
              <br />
              No coding experience required.
            </p>

            <form onSubmit={handleSubmit} className="nl-hero-form">
              <div className="nl-input-group">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Create a dark mode toggle..."
                />
                <button type="submit" className="nl-btn nl-primary">
                  <Play size={18} />
                  Generate
                </button>
              </div>
              <div className="nl-input-examples">
                <span>Try:</span>
                <button type="button" onClick={() => setPrompt('Tab manager with groups')}>Tab manager</button>
                <button type="button" onClick={() => setPrompt('Screenshot capture tool')}>Screenshot tool</button>
                <button type="button" onClick={() => setPrompt('Bookmark organizer')}>Bookmarks</button>
              </div>
            </form>

            <div className="nl-hero-stats">
              <div className="nl-stat">
                <span className="nl-stat-number">10K+</span>
                <span className="nl-stat-label">Extensions built</span>
              </div>
              <div className="nl-stat">
                <span className="nl-stat-number">30s</span>
                <span className="nl-stat-label">Avg. build time</span>
              </div>
              <div className="nl-stat">
                <span className="nl-stat-number">4.9</span>
                <span className="nl-stat-label">User rating</span>
              </div>
            </div>
          </div>

          <div className="nl-hero-visual">
            <FloatingCode />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="nl-features-section" id="features">
        <div className="nl-section-header">
          <span className="nl-section-label">Features</span>
          <div className="nl-section-line"></div>
          <h2>Everything you need</h2>
          <p>Powerful tools that make extension development effortless</p>
        </div>

        <div className="nl-features-grid">
          {features.map((f, i) => (
            <div key={i} className="nl-feature-card">
              <span className="nl-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="nl-steps-section" id="how-it-works">
        <div className="nl-section-header">
          <span className="nl-section-label">How it works</span>
          <div className="nl-section-line"></div>
          <h2>From idea to extension</h2>
        </div>

        <div className="nl-steps-grid">
          {steps.map((s, i) => (
            <div key={i} className="nl-step-item">
              <div className="nl-step-number">{s.num}</div>
              <div className="nl-step-content">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="nl-pricing-section" id="pricing">
        <div className="nl-section-header">
          <span className="nl-section-label">Pricing</span>
          <div className="nl-section-line"></div>
          <h2>Simple pricing</h2>
          <p>Start free, upgrade as you grow. 1 prompt = 3 credits.</p>
        </div>

        <div className="nl-pricing-grid">
          {/* Free Card */}
          <div className="nl-pricing-card">
            <h3>Free</h3>
            <p className="nl-pricing-desc">Try it out</p>
            <div className="nl-price">$0<span>/forever</span></div>
            <ul>
              <li><Check size={18} /> 1 free prompt</li>
              <li><Check size={18} /> All browsers supported</li>
              <li><Check size={18} /> Code export & download</li>
              <li><Check size={18} /> Community support</li>
            </ul>
            <button onClick={() => navigate('/signup')} className="nl-btn nl-outline nl-full">Start Free</button>
          </div>

          {/* Pro Card with Tier Selection */}
          <div className="nl-pricing-card nl-featured">
            <div className="nl-featured-badge">Popular</div>
            <h3>Pro</h3>
            <p className="nl-pricing-desc">For serious builders</p>
            <div className="nl-price">$5<span>+/mo</span></div>
            <div className="nl-tier-note">Starting at 25 prompts</div>
            <ul>
              <li><Check size={18} /> 25-1000+ prompts/month</li>
              <li><Check size={18} /> Unlimited daily use</li>
              <li><Check size={18} /> Full code editing access</li>
              <li><Check size={18} /> Priority AI models</li>
              <li><Check size={18} /> Project history & saves</li>
              <li><Check size={18} /> Priority support</li>
            </ul>
            <button onClick={() => navigate('/signup')} className="nl-btn nl-primary nl-full">Get Pro</button>
            <p className="nl-tier-options">$5/mo (25) • $10/mo (50) • $20/mo (100) • Save 10% yearly</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="nl-cta-section">
        <AnimatedBlob className="nl-cta-blob" color1="#ff6b35" color2="#f7c59f" />
        <div className="nl-cta-content">
          <h2>Ready to build?</h2>
          <p>Join thousands of developers shipping extensions faster</p>
          <button onClick={() => navigate('/signup')} className="nl-btn nl-primary nl-large">
            Start Building Free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="nl-footer">
        <div className="nl-footer-inner">
          <div className="nl-footer-brand">
            <a href="/" className="nl-logo">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 16L16 20L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>ExtensionBuilder</span>
            </a>
            <p>Build browser extensions in seconds.</p>
          </div>
          <div className="nl-footer-links">
            <div className="nl-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How it works</a>
            </div>
            <div className="nl-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="nl-footer-bottom">
          <span>© 2024 ExtensionBuilder. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
