import React from 'react';

export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
      >
        <defs>
          <linearGradient id="rim" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Rotating Accretion Disk */}
        <circle 
            cx="50" 
            cy="50" 
            r="40" 
            stroke="url(#rim)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            className="origin-center animate-spin [animation-duration:3s]" 
        />
        
        {/* Event Horizon */}
        <circle cx="50" cy="50" r="32" fill="#000" />
      </svg>
    </div>
  );
};
