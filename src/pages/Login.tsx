// src/pages/Login.tsx - GUARANTEED USER INFO UPDATE

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../lib/FirebaseClient';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, Chrome, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateUserInFirestore = async (userId: string, userEmail: string, displayName?: string, photoURL?: string) => {
    try {
      const userRef = doc(db, 'userCredits', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          email: userEmail,
          displayName: displayName || userEmail.split('@')[0],
          photoURL: photoURL || null,
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new user (shouldn't happen, but just in case)
        const now = new Date();
        const nextReset = new Date(now);
        nextReset.setDate(nextReset.getDate() + 30);
        
        await setDoc(userRef, {
          email: userEmail,
          displayName: displayName || userEmail.split('@')[0],
          photoURL: photoURL || null,
          plan: 'free',
          credits: 30,
          creditsRemaining: 30,
          maxCredits: 30,
          totalCredits: 30,
          dailyCreditsUsed: 0,
          dailyLimit: 5,
          lastDailyResetDate: now.toISOString().split('T')[0],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          lastLogin: now.toISOString(),
          lastResetDate: now.toISOString(),
          nextResetDate: nextReset.toISOString(),
          billingPeriod: 'monthly'
        });
      }
      
      console.log('✅ User updated in Firestore:', userEmail);
    } catch (error) {
      console.error('❌ Error updating user:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await updateUserInFirestore(
        user.uid,
        user.email!,
        user.displayName || undefined,
        user.photoURL || undefined
      );
      
      console.log('✅ Google login successful:', user.email);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      await updateUserInFirestore(
        user.uid,
        user.email!,
        user.displayName || email.split('@')[0],
        user.photoURL || undefined
      );
      
      console.log('✅ Email login successful:', user.email);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Failed to login. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button onClick={() => navigate('/')} className="back-btn">
        <ArrowLeft size={20} />
        Back to Home
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue building extensions</p>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="forgot-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={18} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleSignIn} className="google-btn" disabled={loading}>
          <Chrome size={18} />
          Continue with Google
        </button>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>

 


<style>{`
  /* Premium Auth Container with Animated Background */
  .auth-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  /* Animated Background Circles */
  .auth-container::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
    top: -200px;
    right: -200px;
    animation: float 20s infinite ease-in-out;
  }

  .auth-container::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    border-radius: 50%;
    bottom: -100px;
    left: -100px;
    animation: float 15s infinite ease-in-out reverse;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -50px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }

  /* Glassmorphism Back Button */
  .back-btn {
    position: absolute;
    top: 30px;
    left: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-8px) scale(1.05);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  }

  /* Glassmorphism Card with 3D Effect */
  .auth-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 32px;
    padding: 48px;
    width: 100%;
    max-width: 460px;
    box-shadow: 
      0 30px 90px rgba(0, 0, 0, 0.25),
      0 0 1px rgba(255, 255, 255, 0.5) inset;
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
    animation: cardEntrance 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .auth-card:hover {
    box-shadow: 
      0 40px 110px rgba(0, 0, 0, 0.3),
      0 0 1px rgba(255, 255, 255, 0.6) inset;
  }

  /* Animated Header */
  .auth-header {
    text-align: center;
    margin-bottom: 40px;
    animation: fadeInDown 0.6s ease-out 0.2s both;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-header h1 {
    font-size: 32px;
    font-weight: 900;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .auth-header p {
    color: #6b7280;
    font-size: 15px;
    font-weight: 500;
  }

  /* Premium Error Alert */
  .error-alert {
    background: linear-gradient(135deg, #fee 0%, #fdd 100%);
    border: 2px solid rgba(239, 68, 68, 0.3);
    color: #dc2626;
    padding: 14px 18px;
    border-radius: 16px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 600;
    animation: shake 0.5s ease-in-out, fadeIn 0.3s ease-out;
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Form Animations */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: slideInLeft 0.5s ease-out both;
  }

  .input-group:nth-child(1) { animation-delay: 0.3s; }
  .input-group:nth-child(2) { animation-delay: 0.4s; }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .input-group label {
    font-size: 14px;
    font-weight: 700;
    color: #374151;
    letter-spacing: 0.3px;
  }

  /* Premium Input Fields */
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 18px;
    color: #9ca3af;
    pointer-events: none;
    transition: all 0.3s ease;
  }

  .input-wrapper input {
    width: 100%;
    padding: 16px 16px 16px 52px;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    background: white;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .input-wrapper input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 20px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
  }

  .input-wrapper input:focus + .input-icon,
  .input-wrapper:focus-within .input-icon {
    color: #667eea;
    transform: scale(1.1);
  }

  .input-wrapper input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .input-hint {
    font-size: 12px;
    color: #9ca3af;
    margin: 0;
    font-weight: 500;
  }

  /* Forgot Password Link */
  .forgot-link {
    text-align: right;
    margin-top: -12px;
    animation: fadeIn 0.5s ease-out 0.5s both;
  }

  .forgot-link a {
    color: #667eea;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
  }

  .forgot-link a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: #667eea;
    transition: width 0.3s ease;
  }

  .forgot-link a:hover::after {
    width: 100%;
  }

  /* Premium Submit Button */
  .submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    animation: fadeIn 0.5s ease-out 0.6s both;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }

  .submit-btn:hover::before {
    left: 100%;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(-1px) scale(0.98);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  /* Stylish Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 32px 0;
    color: #9ca3af;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    animation: fadeIn 0.5s ease-out 0.7s both;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  }

  /* Premium Google Button */
  .google-btn {
    width: 100%;
    padding: 16px;
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    animation: fadeIn 0.5s ease-out 0.8s both;
  }

  .google-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.1);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .google-btn:hover::before {
    width: 400px;
    height: 400px;
  }

  .google-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #667eea;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }

  .google-btn:active:not(:disabled) {
    transform: translateY(-1px);
  }

  .google-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Auth Link with Animation */
  .auth-link {
    text-align: center;
    margin-top: 28px;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    animation: fadeIn 0.5s ease-out 0.9s both;
  }

  .auth-link a {
    color: #667eea;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
  }

  .auth-link a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
  }

  .auth-link a:hover {
    color: #764ba2;
  }

  .auth-link a:hover::after {
    width: 100%;
  }

  /* Loading Spinner */
  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .auth-card {
      padding: 36px 28px;
      border-radius: 28px;
    }

    .auth-header h1 {
      font-size: 26px;
    }

    .back-btn {
      top: 20px;
      left: 20px;
      padding: 10px 18px;
    }

    .input-wrapper input {
      padding: 14px 14px 14px 48px;
    }

    .submit-btn, .google-btn {
      padding: 14px;
    }
  }

  /* Smooth Transitions for Everything */
  * {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
`}</style>

    </div>
  );
}
