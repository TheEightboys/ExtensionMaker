// src/pages/SignUp.tsx - ULTRA CLEAN WITH ANIMATIONS
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/FirebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, Loader2, Sparkles, Zap, Shield, Gift, ArrowRight, Eye, EyeOff, Code, Palette } from 'lucide-react';
import gsap from 'gsap';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation
      gsap.from('.signup-logo', { scale: 0, rotation: -180, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' });

      // Title animation with split text effect
      gsap.from('.signup-title', { y: 50, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' });
      gsap.from('.signup-subtitle', { y: 30, opacity: 0, duration: 0.6, delay: 0.5, ease: 'power3.out' });

      // Form elements stagger
      gsap.from('.form-group', { x: -40, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.6, ease: 'power3.out' });
      gsap.from('.submit-btn', { scale: 0.9, opacity: 0, duration: 0.5, delay: 1, ease: 'back.out(1.7)' });
      gsap.from('.social-btn', { y: 20, opacity: 0, duration: 0.5, delay: 1.2, ease: 'power3.out' });

      // Feature badges
      gsap.from('.feature-badge', { scale: 0, opacity: 0, duration: 0.4, stagger: 0.1, delay: 1.4, ease: 'back.out(2)' });

      // Background orbs
      gsap.to('.bg-orb-1', { y: -25, x: 20, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.bg-orb-2', { y: 20, x: -25, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.bg-orb-3', { y: -15, x: 15, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const initializeUserCredits = async (userId: string, userEmail: string, userName: string) => {
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);

    await setDoc(doc(db, 'userCredits', userId), {
      email: userEmail,
      displayName: userName,
      plan: 'free',
      credits: 30,
      creditsRemaining: 30,
      maxCredits: 30,
      totalCredits: 30,
      dailyCreditsUsed: 0,
      dailyLimit: 5,
      lastDailyResetDate: new Date().toISOString().split('T')[0],
      billingPeriod: 'monthly',
      nextResetDate: nextReset.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await initializeUserCredits(userCredential.user.uid, email, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await initializeUserCredits(result.user.uid, result.user.email || '', result.user.displayName || '');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Google sign up failed');
    }
  };

  return (
    <div className="signup-page" ref={containerRef}>
      {/* Animated Background */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>
      <div className="bg-grid"></div>

      <div className="signup-container">
        {/* Logo */}
        <Link to="/" className="signup-logo">
          <Sparkles className="w-7 h-7" />
          <span>ExtensionBuilder</span>
        </Link>

        {/* Header */}
        <h1 className="signup-title">Create Your Account</h1>
        <p className="signup-subtitle">Start building amazing browser extensions with AI</p>

        {/* Error */}
        {error && <div className="error-alert"><span>⚠️</span> {error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <User className="input-icon" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrap">
              <Mail className="input-icon" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <Lock className="input-icon" size={18} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} disabled={loading} />
              <button type="button" className="toggle-pwd" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <><Loader2 className="spin" size={18} /> Creating...</> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Divider */}
        <div className="divider"><span>or</span></div>

        {/* Google */}
        <button onClick={handleGoogleSignUp} className="social-btn" disabled={loading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Feature Badges */}
        <div className="feature-badges">
          <div className="feature-badge"><Zap size={14} /> 30 Free Credits</div>
          <div className="feature-badge"><Shield size={14} /> Secure</div>
          <div className="feature-badge"><Code size={14} /> AI Powered</div>
        </div>

        {/* Login Link */}
        <p className="login-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>

      <style>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          padding: 40px 24px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Background Effects */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .bg-orb-1 {
          width: 500px;
          height: 500px;
          background: rgba(249, 115, 22, 0.12);
          top: -150px;
          right: -150px;
        }

        .bg-orb-2 {
          width: 400px;
          height: 400px;
          background: rgba(168, 85, 247, 0.08);
          bottom: -100px;
          left: -100px;
        }

        .bg-orb-3 {
          width: 300px;
          height: 300px;
          background: rgba(34, 197, 94, 0.06);
          top: 40%;
          left: 60%;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Container */
        .signup-container {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }

        /* Logo */
        .signup-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: white;
          text-decoration: none;
          margin-bottom: 40px;
        }

        .signup-logo svg {
          color: #f97316;
        }

        /* Header */
        .signup-title {
          font-size: 32px;
          font-weight: 800;
          color: white;
          text-align: center;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .signup-subtitle {
          font-size: 15px;
          color: #737373;
          text-align: center;
          margin-bottom: 36px;
        }

        /* Error */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid rgba(248, 81, 73, 0.3);
          border-radius: 12px;
          color: #f85149;
          font-size: 14px;
          margin-bottom: 24px;
        }

        /* Form */
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #a3a3a3;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #525252;
          pointer-events: none;
        }

        .input-wrap input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: #171717;
          border: 2px solid #262626;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          transition: all 0.25s;
        }

        .input-wrap input:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
        }

        .input-wrap input::placeholder {
          color: #525252;
        }

        .toggle-pwd {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #525252;
          cursor: pointer;
        }

        .toggle-pwd:hover { color: #a3a3a3; }

        /* Submit */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 32px rgba(249, 115, 22, 0.25);
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(249, 115, 22, 0.35);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 28px 0;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #262626;
        }

        .divider span {
          font-size: 12px;
          color: #525252;
          text-transform: uppercase;
        }

        /* Social */
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 14px;
          background: #171717;
          border: 2px solid #262626;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
        }

        .social-btn:hover {
          background: #1f1f1f;
          border-color: #3f3f3f;
        }

        /* Feature Badges */
        .feature-badges {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .feature-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(249, 115, 22, 0.08);
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          color: #fb923c;
        }

        /* Login Link */
        .login-link {
          text-align: center;
          margin-top: 28px;
          font-size: 14px;
          color: #737373;
        }

        .login-link a {
          color: #f97316;
          font-weight: 600;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .signup-title { font-size: 26px; }
          .feature-badges { gap: 8px; }
          .feature-badge { padding: 6px 12px; font-size: 11px; }
        }
      `}</style>
    </div>
  );
}
