'use client';

import React, { useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { Lock, ArrowRight, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { BlackholeLoader } from '@/components/ui/BlackholeLoader';

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function UnlockScreen() {
  const { login, register, error, isLoading } = useVault();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (mode === 'register') {
      if (!email.trim() || !email.includes('@')) return setLocalError('Enter a valid email');
      const u = username.trim();
      if (u.length < USERNAME_MIN) return setLocalError(`Username must be at least ${USERNAME_MIN} characters`);
      if (u.length > USERNAME_MAX) return setLocalError(`Username must be at most ${USERNAME_MAX} characters`);
      if (!USERNAME_REGEX.test(u)) return setLocalError('Username: only letters, numbers, underscores and hyphens');
      if (passcode.length < 12) return setLocalError('Passcode too short (min 12)');
      if (passcode !== confirmPasscode) return setLocalError('Passcodes do not match');
      await register(email.trim(), u, passcode);
    } else {
      if (!emailOrUsername.trim()) return setLocalError('Enter your email or username');
      await login(emailOrUsername.trim(), passcode);
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
            <Logo className="w-16 h-16 mb-4" />
            <h1 className="text-xl font-medium tracking-tight text-white">
                {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-secondary mt-1">
                {mode === 'register' ? 'Zero-knowledge vault setup' : 'Enter your credentials'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {mode === 'register' ? (
            <>
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="void-input w-full py-2.5 pl-10 text-sm"
                  required
                  minLength={USERNAME_MIN}
                  maxLength={USERNAME_MAX}
                  autoComplete="username"
                />
              </div>
            </>
          ) : (
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Email or username"
                className="void-input w-full py-2.5 pl-10 text-sm"
                required
                autoComplete="username"
              />
            </div>
          )}

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
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs text-center py-3 px-4 rounded-xl border flex flex-col items-center gap-2 ${
                    (error || localError)?.includes('already in use') 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' 
                    : 'bg-red-950/30 border-red-500/20 text-red-400'
                }`}
            >
              {(error || localError)?.includes('already in use') && (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-1">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Lock className="w-4 h-4 text-amber-500" />
                    </motion.div>
                </div>
              )}
              <span className="leading-relaxed">
                {error || localError}
              </span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full void-button py-2.5 flex items-center justify-center gap-2 mt-2 text-sm"
          >
            {isLoading ? (
              <BlackholeLoader size="w-5 h-5" />
            ) : (
              <>
                {mode === 'register' ? 'Register' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <button 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setLocalError(null); setEmail(''); setUsername(''); setEmailOrUsername(''); }}
            className="mt-6 text-xs text-secondary hover:text-white transition-colors"
        >
            {mode === 'login' ? "Create an account" : "Log in to existing account"}
        </button>
      </motion.div>
    </div>
  );
}