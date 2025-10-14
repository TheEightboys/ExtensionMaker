// src/pages/Dashboard.tsx - COMPLETE WITH CORRECT DAILY PROMPTS

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/FirebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  CheckCircle, User, Mail, Calendar, CreditCard, LogOut, 
  Settings, Zap, TrendingUp, Crown, Sparkles, AlertTriangle 
} from 'lucide-react';

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

  // Real-time listener for user data
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

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
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isPro = userData.plan === 'pro';
  const creditsPercentage = userData.maxCredits > 0 ? (userData.credits / userData.maxCredits) * 100 : 0;
  const dailyUsedPercentage = userData.dailyLimit ? (userData.dailyCreditsUsed! / userData.dailyLimit) * 100 : 0;
  const dailyRemaining = Math.max(0, (userData.dailyLimit || 5) - (userData.dailyCreditsUsed || 0));

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 flex items-center gap-4 animate-fade-in shadow-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-900 text-lg">Welcome Back!</h3>
              <p className="text-sm text-green-700 font-medium">
                {isPro ? 'Your Pro subscription is active 🎉' : `You have ${dailyRemaining} daily prompts remaining today`}
              </p>
            </div>
          </div>
        )}

        {/* Daily Limit Warning for Free Users */}
        {!isPro && dailyRemaining === 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-orange-900 text-lg">Daily Limit Reached</h3>
              <p className="text-sm text-orange-700 font-medium">
                You've used all 5 daily prompts. Come back tomorrow or upgrade to Pro!
              </p>
            </div>
            <button
              onClick={() => navigate('/#pricing')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900">Profile</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-bold border border-red-200"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>

            <div className="flex items-start gap-6 mb-8">
              {/* Profile Picture */}
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-28 h-28 rounded-2xl border-4 border-blue-300 shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-black shadow-xl">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-3xl font-black text-gray-900">
                    {userData.displayName || user.displayName || 'User'}
                  </h3>
                  {isPro && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-lg">
                      <Crown className="w-3 h-3" />
                      PRO
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-medium">{userData.email || user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Member since {formatDate(userData.createdAt || user.metadata.creationTime!)}
                    </span>
                  </div>
                  {user.emailVerified && (
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">Email Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t-2 border-gray-100">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="text-4xl font-black text-blue-600 mb-1">0</div>
                <div className="text-sm text-gray-700 font-semibold">Extensions</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="text-4xl font-black text-purple-600 mb-1">0</div>
                <div className="text-sm text-gray-700 font-semibold">Projects</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                <div className="text-4xl font-black text-pink-600 mb-1">0</div>
                <div className="text-sm text-gray-700 font-semibold">Templates</div>
              </div>
            </div>
          </div>

          {/* Plan & Credits Card */}
          <div className="space-y-6">
            {/* Plan Card */}
            <div className={`${
              isPro 
                ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600' 
                : 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800'
            } rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden`}>
              
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Current Plan</h3>
                  {isPro ? <Crown className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-5xl font-black">
                      {isPro ? 'Pro' : 'Free'}
                    </div>
                    {isPro && <Sparkles className="w-8 h-8 text-yellow-300" />}
                  </div>
                  <div className="text-sm opacity-90 font-semibold">
                    {isPro 
                      ? `$${userData.paymentAmount?.toFixed(2) || '11.99'} / ${userData.billingPeriod || 'month'}`
                      : '₹0 / forever'
                    }
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {isPro 
                        ? `${userData.maxCredits} credits/month` 
                        : `${dailyRemaining} daily prompts remaining`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {isPro ? 'All browser extensions' : 'Chrome extensions only'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {isPro ? 'Priority support' : 'Community support'}
                    </span>
                  </div>
                  {isPro && userData.nextResetDate && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/20">
                      <Calendar className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs font-semibold">
                        Renews on {formatDate(userData.nextResetDate)}
                      </span>
                    </div>
                  )}
                </div>

                {!isPro && (
                  <button 
                    onClick={() => navigate('/#pricing')}
                    className="w-full bg-white text-gray-900 py-3.5 rounded-xl font-black hover:bg-gray-100 transition shadow-xl hover:scale-105 active:scale-95"
                  >
                    Upgrade to Pro
                  </button>
                )}

                {isPro && (
                  <button 
                    onClick={() => navigate('/#pricing')}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3.5 rounded-xl font-bold hover:bg-white/30 transition border-2 border-white/30"
                  >
                    Add Credits
                  </button>
                )}
              </div>
            </div>

            {/* Credits Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Available Credits</h3>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-black text-gray-900">{userData.credits}</span>
                  <span className="text-2xl font-bold text-gray-400 mb-1">/ {userData.maxCredits}</span>
                </div>
                
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                      creditsPercentage > 50 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : creditsPercentage > 20
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-red-500 to-pink-600'
                    }`}
                    style={{ width: `${creditsPercentage}%` }}
                  />
                </div>
              </div>

              {!isPro && (
                <>
                  {/* Daily Prompts Progress - UPDATED */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">Today's Prompts</span>
                      <span className={`text-lg font-black ${dailyRemaining === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {userData.dailyCreditsUsed}/{userData.dailyLimit}
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                          dailyRemaining === 0
                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                            : dailyUsedPercentage > 60
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${dailyUsedPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mt-2">
                      {dailyRemaining > 0 
                        ? `${dailyRemaining} prompts remaining today` 
                        : 'Daily limit reached • Resets tomorrow'}
                    </p>
                  </div>

                  {/* Monthly Credits Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-600">Monthly Credits</span>
                      <span className="text-sm font-bold text-gray-900">{userData.credits}/{userData.maxCredits}</span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                          userData.credits === 0
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${creditsPercentage}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-600 font-medium mb-3">
                {userData.credits > 0 
                  ? `${userData.credits} credits available for creating extensions`
                  : 'No credits remaining. Upgrade or wait for monthly reset.'}
              </p>

              {!isPro && (
                <button
                  onClick={() => navigate('/#pricing')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition hover:scale-105"
                >
                  <TrendingUp className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h3 className="text-2xl font-black text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate('/builder')}
              className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-black text-gray-900 text-lg">New Extension</div>
                <div className="text-xs text-gray-600 font-medium">Start building now</div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/templates')}
              className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-black text-gray-900 text-lg">Templates</div>
                <div className="text-xs text-gray-600 font-medium">Browse & customize</div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/projects')}
              className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-2xl hover:border-pink-400 hover:bg-pink-50 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-pink-600" />
              </div>
              <div className="text-left">
                <div className="font-black text-gray-900 text-lg">My Projects</div>
                <div className="text-xs text-gray-600 font-medium">View all work</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
