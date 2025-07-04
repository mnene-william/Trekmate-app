/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Animation definitions for SignUp.jsx
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'bounce-in': 'bounceIn 0.7s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%, 20%, 40%, 60%, 80%, 100%': {
            '-webkit-transition-timing-function': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            'transition-timing-function': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          },
          '0%': {
            opacity: '0',
            '-webkit-transform': 'scale3d(0.3, 0.3, 0.3)',
            transform: 'scale3d(0.3, 0.3, 0.3)',
          },
          '20%': {
            '-webkit-transform': 'scale3d(1.1, 1.1, 1.1)',
            transform: 'scale3d(1.1, 1.1, 1.1)',
          },
          '40%': {
            '-webkit-transform': 'scale3d(0.9, 0.9, 0.9)',
            transform: 'scale3d(0.9, 0.9, 0.9)',
          },
          '60%': {
            opacity: '1',
            '-webkit-transform': 'scale3d(1.03, 1.03, 1.03)',
            transform: 'scale3d(1.03, 1.03, 1.03)',
          },
          '80%': {
            '-webkit-transform': 'scale3d(0.97, 0.97, 0.97)',
            transform: 'scale3d(0.97, 0.97, 0.97)',
          },
          '100%': {
            opacity: '1',
            '-webkit-transform': 'scale3d(1, 1, 1)',
            transform: 'scale3d(1, 1, 1)',
          },
        },
      },
    },
  },
  plugins: [],
};


