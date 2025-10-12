// src/App.tsx - WITH GLOBAL SIDEBAR

import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GlobalSidebar } from "./components/GlobalSidebar";
import { NewNavbar } from "./components/NewNavbar";
import { NewLanding } from "./../src/pages/NewLanding";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import { PaymentSuccess } from './pages/PaymentSuccess';
import { Menu } from 'lucide-react';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`main-layout ${sidebarOpen ? 'with-sidebar' : ''}`}>
        {/* Menu button for mobile */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
          >
            <Menu size={24} />
          </button>
        )}

        <NewNavbar />
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
      </div>

      <style>{`
        .main-layout {
          transition: margin-left 0.3s ease;
        }

        .main-layout.with-sidebar {
          margin-left: 280px;
        }

        @media (max-width: 768px) {
          .main-layout.with-sidebar {
            margin-left: 0;
          }
        }

        .mobile-menu-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 997;
          background: #1a1f26;
          border: none;
          color: white;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }

        .mobile-menu-btn:hover {
          background: #2d3748;
          transform: scale(1.05);
        }

        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none;
          }
        }
      `}</style>
    </>
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
