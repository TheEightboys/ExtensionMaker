// src/pages/Login.tsx - COMPLETE WITH STYLING

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../lib/FirebaseClient';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Mail, Lock, Chrome, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login successful:', result.user);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
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
      console.log('Login successful:', result.user);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
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
        .auth-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          position: relative;
        }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          border: none;
          border-radius: 10px;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          transform: translateX(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }

        .auth-header p {
          color: #6b7280;
          font-size: 14px;
        }

        .error-alert {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #9ca3af;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
          outline: none;
        }

        .input-wrapper input:focus {
          border-color: #667eea;
        }

        .input-wrapper input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .forgot-link {
          text-align: right;
          margin-top: -8px;
        }

        .forgot-link a {
          color: #667eea;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .forgot-link a:hover {
          text-decoration: underline;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .google-btn {
          width: 100%;
          padding: 14px;
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .google-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-link {
          text-align: center;
          margin-top: 24px;
          color: #6b7280;
          font-size: 14px;
        }

        .auth-link a {
          color: #667eea;
          font-weight: 700;
          text-decoration: none;
        }

        .auth-link a:hover {
          text-decoration: underline;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 32px 24px;
          }

          .auth-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
