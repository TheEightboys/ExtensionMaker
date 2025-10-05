import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './../../src/lib/FirebaseClient';
import { CheckCircle, User, Mail, Calendar, CreditCard, LogOut, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(true);

  useEffect(() => {
    // Hide success message after 3 seconds
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in shadow-lg">
            <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
            <div>
              <h3 className="font-bold text-green-900">Successfully Signed In!</h3>
              <p className="text-sm text-green-700">Welcome back to ExtensionBuilder</p>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold"
              >
                <LogOut className="w-4 h-4" />
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
                    className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.displayName || 'User'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined {new Date(user.metadata.creationTime!).toLocaleDateString()}
                    </span>
                  </div>
                  {user.emailVerified && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Email Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Extensions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">0</div>
                <div className="text-sm text-gray-600">Templates Used</div>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Current Plan</h3>
              <CreditCard className="w-6 h-6" />
            </div>

            <div className="mb-6">
              <div className="text-4xl font-black mb-2">Free</div>
              <div className="text-sm opacity-90">₹0 / month</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">3 extensions per month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">All browser targets</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Community support</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/#pricing')}
              className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">New Extension</div>
                <div className="text-xs text-gray-600">Start building now</div>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Browse Templates</div>
                <div className="text-xs text-gray-600">Explore templates</div>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-pink-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">View Projects</div>
                <div className="text-xs text-gray-600">See your work</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
