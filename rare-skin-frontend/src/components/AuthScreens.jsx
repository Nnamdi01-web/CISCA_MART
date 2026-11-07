import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail, User } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

export default function AuthScreens({ onAuthSuccess }) {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const token = res.data.token || res.data.accessToken || res.data.data?.token;
      if (token) {
        localStorage.setItem('ciscamart_token', token);
        onAuthSuccess(res.data.user || { email });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        email,
        password,
        full_name: fullName
      });
      const token = res.data.token || res.data.accessToken || res.data.data?.token;
      if (token) {
        localStorage.setItem('ciscamart_token', token);
        onAuthSuccess(res.data.user || { email, full_name: fullName });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-creamBg">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-roseBrand-100 overflow-hidden p-8">
        
        {/* --- SCREEN 1: WELCOME / SPLASH SCREEN --- */}
        {currentScreen === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-roseBrand-50 rounded-full flex items-center justify-center border-2 border-roseBrand-100 shadow-sm">
              <Sparkles className="w-10 h-10 text-roseBrand-500" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Rare Skin <span className="text-roseBrand-500">Consult</span>
              </h1>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mt-1">
                by Cisca Mart
              </p>
            </div>

            <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
              Know your skin. Get your personalized, specialist-approved skincare routine.
            </p>

            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => setCurrentScreen('signup')}
                className="w-full py-4 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-semibold rounded-2xl shadow-lg shadow-roseBrand-500/30 flex items-center justify-center space-x-2 transition duration-200"
              >
                <span>Start Consultation</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentScreen('login')}
                className="w-full py-3.5 bg-roseBrand-50 hover:bg-roseBrand-100 text-roseBrand-600 font-semibold rounded-2xl border border-roseBrand-100 transition duration-200"
              >
                Already have a routine? Log In
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Certified Dermatology & Aesthetic Formulation</span>
            </div>
          </div>
        )}

        {/* --- SCREEN 2: LOGIN --- */}
        {currentScreen === 'login' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-xs text-gray-500 mt-1">Login to view your custom skin routine</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-roseBrand-500 focus:bg-white outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-roseBrand-500 focus:bg-white outline-none text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-semibold rounded-xl shadow-md shadow-roseBrand-500/20 transition duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Log In'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentScreen('signup')}
                className="text-xs text-roseBrand-600 hover:underline font-semibold"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </div>
        )}

        {/* --- SCREEN 2: SIGN UP --- */}
        {currentScreen === 'signup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
              <p className="text-xs text-gray-500 mt-1">Start your skin consultation profile</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-roseBrand-500 focus:bg-white outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-roseBrand-500 focus:bg-white outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-roseBrand-500 focus:bg-white outline-none text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-semibold rounded-xl shadow-md shadow-roseBrand-500/20 transition duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Profile...' : 'Sign Up & Continue'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentScreen('login')}
                className="text-xs text-roseBrand-600 hover:underline font-semibold"
              >
                Already have an account? Log In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}