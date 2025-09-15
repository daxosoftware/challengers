import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  variant?: 'default' | 'glass' | 'frog';
  hover?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = true, 
  variant = 'default',
  hover = true 
}: CardProps) {
  const baseClasses = 'rounded-2xl transition-all duration-300 relative overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-glass',
    glass: 'card-glass',
    frog: 'card-frog',
  };

  const hoverClasses = hover ? 'hover:transform hover:-translate-y-2 hover:shadow-2xl' : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}