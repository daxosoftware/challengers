import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'glass' | 'frog';
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  variant = 'default',
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const variantClasses = {
    default: 'bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:border-frog-primary focus:ring-frog-glow',
    glass: 'input-glass',
    frog: 'input-glass border-frog-primary focus:border-frog-secondary focus:ring-frog-glow-strong',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/90"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          block w-full px-4 py-3 rounded-xl shadow-lg transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
          sm:text-sm
          ${variantClasses[variant]}
          ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-400 flex items-center" role="alert" aria-live="polite">
          <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-help`} className="text-sm text-white/70 flex items-center">
          <span className="w-1 h-1 bg-white/50 rounded-full mr-2"></span>
          {helperText}
        </p>
      )}
    </div>
  );
}