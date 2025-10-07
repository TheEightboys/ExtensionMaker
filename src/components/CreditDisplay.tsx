// src/components/CreditsDisplay.tsx

import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreditsDisplayProps {
  credits: number;
  maxCredits: number;
  plan: 'free' | 'basic' | 'pro';
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ credits, maxCredits, plan }) => {
  const navigate = useNavigate();
  const percentage = (credits / maxCredits) * 100;
  
  const getColor = () => {
    if (percentage > 50) return 'from-green-500 to-emerald-600';
    if (percentage > 20) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getPlanColor = () => {
    if (plan === 'pro') return 'from-purple-500 to-indigo-600';
    if (plan === 'basic') return 'from-pink-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanColor()} flex items-center justify-center`}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 capitalize">{plan} Plan</h3>
            <p className="text-sm text-gray-600">Monthly Prompts</p>
          </div>
        </div>
        {plan === 'free' && (
          <button
            onClick={() => navigate('/#pricing')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <TrendingUp className="w-4 h-4" />
            Upgrade
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black text-gray-900">{credits}</span>
          <span className="text-sm font-medium text-gray-500">/ {maxCredits} prompts left</span>
        </div>
        
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {credits === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
              ⚠️ You've run out of prompts!
            </p>
            <p className="text-xs text-red-600 mt-1">
              {plan === 'free' 
                ? 'Upgrade to get more prompts or wait for monthly reset.'
                : 'Your credits will reset at the start of next billing cycle.'}
            </p>
          </div>
        )}
        
        {credits > 0 && credits <= maxCredits * 0.2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <p className="text-sm font-semibold text-yellow-700">
              ⚡ Running low on prompts!
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {plan === 'free' && 'Consider upgrading for unlimited creativity.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
