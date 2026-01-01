'use client';

import React, { useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { Lock, UserPlus, ArrowRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UnlockScreen() {
  const { login, register, error, isLoading } = useVault();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (mode === 'register') {
      if (!email.includes('@')) return setLocalError('Invalid email');
      if (passcode.length < 12) return setLocalError('Passcode too short (min 12)');
      if (passcode !== confirmPasscode) return setLocalError('Passcodes match failed');
      await register(email, passcode);
    } else {
      await login(email, passcode);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="void-panel p-8 rounded-2xl w-full max-w-[380px] flex flex-col items-center bg-[#0a0a0a]"
      >
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <div className="w-3 h-3 bg-black rounded-full" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">
                {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-secondary mt-1">
                {mode === 'register' ? 'Zero-knowledge vault setup' : 'Enter your credentials'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-white transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="void-input w-full py-2.5 pl-10 text-sm"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-white transition-colors" />
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Master Passcode"
              className="void-input w-full py-2.5 pl-10 text-sm"
              required
            />
          </div>

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative group pt-4">
                  <Lock className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-white transition-colors" />
                  <input
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    placeholder="Confirm Passcode"
                    className="void-input w-full py-2.5 pl-10 text-sm"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(error || localError) && (
            <div className="text-red-400 text-xs text-center py-2 bg-red-900/10 rounded border border-red-900/20">
              {error || localError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full void-button py-2.5 flex items-center justify-center gap-2 mt-2 text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'register' ? 'Register' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <button 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setLocalError(null); }}
            className="mt-6 text-xs text-secondary hover:text-white transition-colors"
        >
            {mode === 'login' ? "Create an account" : "Log in to existing account"}
        </button>
      </motion.div>
    </div>
  );
}