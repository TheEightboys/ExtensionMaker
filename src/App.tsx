// src/App.tsx - CLEAN WITHOUT SIDEBAR
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NewLanding from "./pages/NewLanding";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import { PaymentSuccess } from './pages/PaymentSuccess';
import { Sparkles } from 'lucide-react';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-icon">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="loading-text">Loading...</div>
          <div className="loading-bar"><div className="loading-progress"></div></div>
        </div>

        <style>{`
          .app-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0a0a0a;
          }

          .loading-content {
            text-align: center;
          }

          .loading-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            border-radius: 16px;
            color: white;
            animation: pulse 1.5s ease-in-out infinite;
          }

          .loading-text {
            font-size: 16px;
            font-weight: 600;
            color: #a3a3a3;
            margin-bottom: 24px;
          }

          .loading-bar {
            width: 200px;
            height: 4px;
            background: #262626;
            border-radius: 4px;
            overflow: hidden;
          }

          .loading-progress {
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #f97316, transparent);
            animation: loading 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<NewLanding />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/builder"
        element={user ? <Builder /> : <Navigate to="/signup" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
