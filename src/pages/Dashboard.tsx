// src/pages/Dashboard.tsx - PREMIUM ORANGE/RED THEME
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/FirebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  CheckCircle, Calendar, CreditCard, LogOut,
  Settings, Zap, TrendingUp, Crown, Sparkles, AlertTriangle, ArrowRight
} from 'lucide-react';
import ProjectHistory from '../components/ProjectHistory';

interface UserData {
  email?: string;
  displayName?: string;
  photoURL?: string;
  plan: 'free' | 'pro';
  credits: number;
  maxCredits: number;
  billingPeriod?: 'monthly' | 'yearly';
  paymentAmount?: number;
  nextResetDate?: string;
  dailyCreditsUsed?: number;
  dailyLimit?: number;
  lastDailyResetDate?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const userRef = doc(db, 'userCredits', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData({
          email: data.email || user.email || '',
          displayName: data.displayName || user.displayName || '',
          photoURL: data.photoURL || user.photoURL || '',
          plan: data.plan || 'free',
          credits: data.creditsRemaining || data.credits || 30,
          maxCredits: data.maxCredits || data.totalCredits || 30,
          billingPeriod: data.billingPeriod || 'monthly',
          paymentAmount: data.paymentAmount,
          nextResetDate: data.nextResetDate,
          dailyCreditsUsed: data.dailyCreditsUsed || 0,
          dailyLimit: data.dailyLimit || 5,
          lastDailyResetDate: data.lastDailyResetDate,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || !userData || !user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const isPro = userData.plan === 'pro';
  const creditsPercentage = userData.maxCredits > 0 ? (userData.credits / userData.maxCredits) * 100 : 0;
  const dailyRemaining = Math.max(0, (userData.dailyLimit || 5) - (userData.dailyCreditsUsed || 0));

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <a href="/" className="brand-logo">
              <Sparkles className="w-6 h-6" />
              <span>ExtensionBuilder</span>
            </a>
          </div>
          <div className="header-right">
            <button onClick={() => navigate('/builder')} className="header-btn primary">
              <Sparkles className="w-4 h-4" />
              New Extension
            </button>
            <button onClick={handleLogout} className="header-btn logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome Message */}
        {showSuccess && (
          <div className="welcome-alert">
            <CheckCircle className="w-6 h-6" />
            <div>
              <strong>Welcome back, {userData.displayName || 'User'}!</strong>
              <span>{isPro ? 'Your Pro subscription is active' : `${dailyRemaining} daily prompts remaining`}</span>
            </div>
          </div>
        )}

        {/* Daily Limit Warning */}
        {!isPro && dailyRemaining === 0 && (
          <div className="warning-alert">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <strong>Daily Limit Reached</strong>
              <span>You've used all 5 daily prompts. Come back tomorrow or upgrade!</span>
            </div>
            <button onClick={() => navigate('/#pricing')}>Upgrade</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Credits Card */}
          <div className="stat-card credits-card">
            <div className="card-header">
              <h3>Available Credits</h3>
              <Zap className="w-5 h-5" />
            </div>
            <div className="credits-display">
              <span className="credits-number">{userData.credits}</span>
              <span className="credits-max">/ {userData.maxCredits}</span>
            </div>
            <div className="credits-bar">
              <div className="credits-fill" style={{ width: `${creditsPercentage}%` }}></div>
            </div>
            {!isPro && (
              <div className="daily-prompts">
                <div className="daily-header">
                  <span>Today's Prompts</span>
                  <span className="daily-count">{userData.dailyCreditsUsed}/{userData.dailyLimit}</span>
                </div>
                <p className="daily-remaining">{dailyRemaining} remaining today</p>
              </div>
            )}
          </div>

          {/* Plan Card */}
          <div className={`stat-card plan-card ${isPro ? 'pro' : 'free'}`}>
            <div className="plan-badge">
              {isPro ? <Crown className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              <span>{isPro ? 'Pro Plan' : 'Free Plan'}</span>
            </div>
            <div className="plan-price">
              <span className="price-amount">{isPro ? '$12' : '$0'}</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="plan-features">
              <li><CheckCircle className="w-4 h-4" /> {isPro ? '200 credits/month' : '30 credits/month'}</li>
              <li><CheckCircle className="w-4 h-4" /> {isPro ? 'Unlimited daily prompts' : '5 prompts/day'}</li>
              <li><CheckCircle className="w-4 h-4" /> {isPro ? 'Code editing access' : 'Read-only code'}</li>
            </ul>
            {!isPro && (
              <button onClick={() => navigate('/#pricing')} className="upgrade-btn">
                <TrendingUp className="w-4 h-4" />
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Profile Card */}
          <div className="stat-card profile-card">
            <div className="profile-header">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(userData.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-info">
                <h4>{userData.displayName || 'User'}</h4>
                <p>{userData.email || user.email}</p>
              </div>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(userData.createdAt)}</span>
              </div>
              {user.emailVerified && (
                <div className="detail-item verified">
                  <CheckCircle className="w-4 h-4" />
                  <span>Email Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/builder')} className="action-card">
              <div className="action-icon orange">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="action-content">
                <h4>New Extension</h4>
                <p>Start building with AI</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button onClick={() => navigate('/builder')} className="action-card">
              <div className="action-icon red">
                <Settings className="w-6 h-6" />
              </div>
              <div className="action-content">
                <h4>My Projects</h4>
                <p>View saved extensions</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button onClick={() => navigate('/#pricing')} className="action-card">
              <div className="action-icon yellow">
                <Crown className="w-6 h-6" />
              </div>
              <div className="action-content">
                <h4>Upgrade Plan</h4>
                <p>Get more credits</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* My Projects */}
        <section className="projects-section" id="projects">
          <ProjectHistory maxItems={5} showTitle={true} />
        </section>
      </main>

      <style>{`
        .dashboard-page {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Header */
        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e4e4e7;
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          text-decoration: none;
        }

        .brand-logo svg {
          color: #f97316;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-btn.primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .header-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }

        .header-btn.logout {
          background: #f4f4f5;
          color: #52525b;
        }

        .header-btn.logout:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Main */
        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        /* Alerts */
        .welcome-alert, .warning-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          border-radius: 16px;
          margin-bottom: 32px;
        }

        .welcome-alert {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #86efac;
        }

        .welcome-alert svg {
          color: #22c55e;
          flex-shrink: 0;
        }

        .welcome-alert strong {
          display: block;
          color: #166534;
          font-size: 15px;
        }

        .welcome-alert span {
          color: #14532d;
          font-size: 13px;
        }

        .warning-alert {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fbbf24;
        }

        .warning-alert svg {
          color: #d97706;
          flex-shrink: 0;
        }

        .warning-alert strong {
          display: block;
          color: #92400e;
          font-size: 15px;
        }

        .warning-alert span {
          color: #78350f;
          font-size: 13px;
        }

        .warning-alert button {
          margin-left: auto;
          padding: 8px 16px;
          background: #f97316;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #e4e4e7;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        /* Credits Card */
        .credits-card .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .credits-card .card-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: #52525b;
        }

        .credits-card .card-header svg {
          color: #f97316;
        }

        .credits-display {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 16px;
        }

        .credits-number {
          font-size: 48px;
          font-weight: 800;
          color: #18181b;
        }

        .credits-max {
          font-size: 20px;
          font-weight: 600;
          color: #a1a1aa;
        }

        .credits-bar {
          height: 8px;
          background: #e4e4e7;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .credits-fill {
          height: 100%;
          background: linear-gradient(90deg, #f97316, #ea580c);
          border-radius: 4px;
          transition: width 0.5s;
        }

        .daily-prompts {
          padding: 16px;
          background: #fff7ed;
          border-radius: 12px;
          border: 1px solid #fed7aa;
        }

        .daily-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #78350f;
        }

        .daily-count {
          color: #ea580c;
        }

        .daily-remaining {
          font-size: 12px;
          color: #92400e;
          margin: 0;
        }

        /* Plan Card */
        .plan-card {
          background: linear-gradient(135deg, #f97316, #ea580c, #dc2626);
          color: white;
        }

        .plan-card.free {
          background: linear-gradient(135deg, #3f3f46, #27272a);
        }

        .plan-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .plan-price {
          margin-bottom: 20px;
        }

        .price-amount {
          font-size: 42px;
          font-weight: 800;
        }

        .price-period {
          font-size: 16px;
          opacity: 0.8;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .plan-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          padding: 8px 0;
          opacity: 0.9;
        }

        .upgrade-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: white;
          color: #18181b;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upgrade-btn:hover {
          transform: scale(1.02);
        }

        /* Profile Card */
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .profile-avatar {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          object-fit: cover;
          border: 3px solid #f97316;
        }

        .profile-avatar-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 800;
        }

        .profile-info h4 {
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 4px 0;
        }

        .profile-info p {
          font-size: 13px;
          color: #71717a;
          margin: 0;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #52525b;
        }

        .detail-item svg {
          color: #a1a1aa;
        }

        .detail-item.verified {
          color: #22c55e;
        }

        .detail-item.verified svg {
          color: #22c55e;
        }

        /* Quick Actions */
        .quick-actions h2 {
          font-size: 22px;
          font-weight: 800;
          color: #18181b;
          margin-bottom: 24px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: white;
          border: 2px solid #e4e4e7;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .action-card:hover {
          border-color: #f97316;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }

        .action-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-icon.orange {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          color: #f97316;
        }

        .action-icon.red {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          color: #ef4444;
        }

        .action-icon.yellow {
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          color: #f59e0b;
        }

        .action-content {
          flex: 1;
        }

        .action-content h4 {
          font-size: 16px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 4px 0;
        }

        .action-content p {
          font-size: 13px;
          color: #71717a;
          margin: 0;
        }

        .action-card > svg {
          color: #a1a1aa;
          transition: transform 0.2s;
        }

        .action-card:hover > svg {
          transform: translateX(4px);
          color: #f97316;
        }

        /* Loading */
        .dashboard-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fafafa;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e4e4e7;
          border-top-color: #f97316;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dashboard-loading p {
          color: #52525b;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .stats-grid, .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
