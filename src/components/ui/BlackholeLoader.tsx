'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const BlackholeLoader = ({ size = "w-4 h-4" }: { size?: string }) => {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Outer Glowing Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/30"
        animate={{
          scale: [1, 1.2, 1],
          rotate: 360,
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Inner Rotating Accretion Disk Segment */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="white"
          strokeWidth="10"
          strokeDasharray="60 190"
          strokeLinecap="round"
          fill="none"
          className="opacity-80"
        />
      </motion.svg>

      {/* Central Singularity */}
      <div className="absolute inset-[30%] bg-black rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
    </div>
  );
};
