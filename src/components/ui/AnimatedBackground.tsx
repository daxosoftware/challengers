import React from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedBackground({ children, className = '' }: AnimatedBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Animated liquid background */}
      <div className="absolute inset-0 animated-liquid-bg">
        {/* Floating liquid orbs */}
        <div className="liquid-orb"></div>
        <div className="liquid-orb"></div>
        <div className="liquid-orb"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-frog-primary rounded-full opacity-20 animate-liquid-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-frog-secondary rounded-full opacity-30 animate-liquid-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-gradient-frog-accent rounded-full opacity-25 animate-liquid-bounce" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
