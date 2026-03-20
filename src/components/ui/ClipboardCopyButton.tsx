'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClipboardCopyButtonProps {
  value: string | undefined;
  clearTime?: number; // in milliseconds
}

export function ClipboardCopyButton({ value, clearTime = 15000 }: ClipboardCopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  const [progress, setProgress] = useState(100);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      setProgress(100);

      // Start the countdown/clear logic
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / clearTime) * 100);
        setProgress(remaining);
        
        if (elapsed >= clearTime) {
          navigator.clipboard.writeText('');
          setState('idle');
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  }, [value, clearTime]);

  return (
    <button
      onClick={handleCopy}
      className="relative p-1.5 hover:bg-white/10 rounded text-secondary hover:text-green-400 transition-colors group/copy overflow-hidden"
      title={state === 'copied' ? 'Clipboard will clear soon' : 'Copy to clipboard'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'copied' ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="w-3.5 h-3.5 text-green-400" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'copied' && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-green-500/50 w-full">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}
    </button>
  );
}
