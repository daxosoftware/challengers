/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Frog effect colors
        'frog-primary': '#00d4aa',
        'frog-secondary': '#00a8cc',
        'frog-accent': '#ff6b6b',
        'frog-glow': 'rgba(0, 212, 170, 0.3)',
        
        // Glass colors
        'glass-bg': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'glass-strong': 'rgba(255, 255, 255, 0.15)',
      },
      backdropBlur: {
        'glass': '8px',
        'glass-strong': '16px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-strong': '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
        'frog-glow': '0 0 20px rgba(0, 212, 170, 0.3)',
        'frog-glow-strong': '0 0 40px rgba(0, 212, 170, 0.5)',
      },
      animation: {
        'liquid-flow': 'liquid-flow 20s linear infinite',
        'liquid-bounce': 'liquid-bounce 4s ease-in-out infinite',
        'liquid-pulse': 'liquid-pulse 2s ease-in-out infinite',
        'liquid-rotate': 'liquid-rotate 20s linear infinite',
        'frog-shimmer': 'frog-shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        'liquid-flow': {
          '0%': { transform: 'translateX(-100%) rotate(0deg)' },
          '50%': { transform: 'translateX(0%) rotate(180deg)' },
          '100%': { transform: 'translateX(100%) rotate(360deg)' },
        },
        'liquid-bounce': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
        },
        'liquid-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        'liquid-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'frog-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-frog': 'linear-gradient(45deg, #00d4aa, #00a8cc, #ff6b6b)',
        'gradient-frog-primary': 'linear-gradient(45deg, #00d4aa, #00a8cc)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
    },
  },
  plugins: [],
};
