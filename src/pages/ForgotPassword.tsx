import React, { useState } from "react";
import { auth } from "./../../src/lib/FirebaseClient";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        const firebaseError = error as any;
        switch (firebaseError.code) {
          case "auth/user-not-found":
            setError("No account found with this email");
            break;
          case "auth/invalid-email":
            setError("Invalid email address");
            break;
          default:
            setError("Failed to send reset email. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Reset Password</h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your email to receive a password reset link
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-blue-600 text-sm hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
