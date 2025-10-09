// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        
        // Semantic colors for light/dark mode
        background: {
          light: '#ffffff',
          dark: '#000000',
        },
        card: {
          light: '#f8fafc',
          dark: '#0f0f0f',
        },
        elevated: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        text: {
          primary: {
            light: '#000000',
            dark: '#ffffff',
          },
          secondary: {
            light: '#6b7280',
            dark: '#9ca3af',
          },
          tertiary: {
            light: '#9ca3af',
            dark: '#6b7280',
          },
        },
        border: {
          light: '#e5e7eb',
          dark: '#374151',
        },
        system: {
          red: '#ef4444',
          green: '#10b981',
          orange: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          yellow: '#eab308',
        }
      },
    },
  },
  plugins: [],
}