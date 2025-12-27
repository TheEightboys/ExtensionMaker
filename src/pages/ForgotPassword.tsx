// src/pages/ForgotPassword.tsx - PREMIUM ORANGE/RED THEME
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/FirebaseClient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found': setError('No account found with this email'); break;
        case 'auth/invalid-email': setError('Invalid email address'); break;
        default: setError('Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      {/* Left Side - Branding */}
      <div className="forgot-branding">
        <div className="branding-content">
          <div className="brand-logo">
            <Sparkles className="logo-icon" />
            <span>ExtensionBuilder</span>
          </div>
          <h1>Forgot your<br /><span>password?</span></h1>
          <p>No worries! Enter your email and we'll send you a link to reset your password.</p>
        </div>
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="forgot-form-section">
        <button onClick={() => navigate('/login')} className="back-button">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>

        <div className="form-container">
          <div className="form-header">
            <h2>Reset Password</h2>
            <p>Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          {message && (
            <div className="success-box">
              <CheckCircle className="w-5 h-5" /> {message}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="form-group">
              <label>Email address</label>
              <div className="input-container">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <><Loader2 className="spin" size={18} /> Sending...</>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="login-link">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        .forgot-page {
          display: flex;
          min-height: 100vh;
          background: #fafafa;
        }

        /* Left Branding Section */
        .forgot-branding {
          flex: 1;
          background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%);
          padding: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .branding-content {
          position: relative;
          z-index: 2;
          max-width: 420px;
          color: white;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 48px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
        }

        .branding-content h1 {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 20px;
        }

        .branding-content h1 span {
          background: linear-gradient(90deg, #fef3c7, #fcd34d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .branding-content > p {
          font-size: 17px;
          opacity: 0.9;
          line-height: 1.6;
        }

        /* Background Decorations */
        .bg-gradient-1, .bg-gradient-2 {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }

        .bg-gradient-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -150px;
        }

        .bg-gradient-2 {
          width: 400px;
          height: 400px;
          bottom: -100px;
          left: -100px;
        }

        .bg-pattern {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* Right Form Section */
        .forgot-form-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 60px;
          background: white;
          position: relative;
        }

        .back-button {
          position: absolute;
          top: 32px;
          left: 32px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #f4f4f5;
          border: none;
          border-radius: 10px;
          color: #52525b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #e4e4e7;
          color: #18181b;
        }

        .form-container {
          max-width: 400px;
          margin: 0 auto;
          width: 100%;
        }

        .form-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .form-header h2 {
          font-size: 28px;
          font-weight: 800;
          color: #18181b;
          margin-bottom: 8px;
        }

        .form-header p {
          color: #71717a;
          font-size: 15px;
        }

        .error-box, .success-box {
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .success-box {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #16a34a;
        }

        .forgot-form {
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
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .input-container {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #a1a1aa;
        }

        .input-container input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: #fafafa;
          border: 2px solid #e4e4e7;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #18181b;
          transition: all 0.2s;
        }

        .input-container input:focus {
          outline: none;
          border-color: #f97316;
          background: white;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
        }

        .input-container input::placeholder {
          color: #a1a1aa;
        }

        .submit-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 10px 30px -10px rgba(249, 115, 22, 0.4);
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px -10px rgba(249, 115, 22, 0.5);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-link {
          text-align: center;
          margin-top: 28px;
          color: #71717a;
          font-size: 14px;
        }

        .login-link a {
          color: #f97316;
          font-weight: 700;
          text-decoration: none;
        }

        .login-link a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .forgot-page {
            flex-direction: column;
          }
          
          .forgot-branding {
            padding: 48px 32px;
            min-height: auto;
          }
          
          .branding-content h1 {
            font-size: 32px;
          }
          
          .forgot-form-section {
            padding: 32px 24px;
          }
          
          .back-button {
            position: static;
            margin-bottom: 24px;
            width: fit-content;
          }
        }
      `}</style>
    </div>
  );
}
