import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
        isDark ? 'bg-[#1B2A4A] border border-[#7DD3FC]/20' : 'bg-[#E8EEF7] border border-[#CBD5E1]'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>

      {/* Background Icons */}
      <div className="w-full flex justify-between px-1.5 text-[10px] items-center">
        <Sun className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-slate-500 opacity-40' : 'text-amber-500 opacity-100'}`} />
        <Moon className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-sky-300 opacity-100' : 'text-slate-400 opacity-40'}`} />
      </div>

      {/* Floating Toggle Knob with Motion Spring */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        animate={{ x: isDark ? 28 : 0 }}
        className={`absolute left-1 top-1 h-7 w-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
          isDark
            ? 'bg-gradient-to-tr from-[#3A7DFF] to-[#7DD3FC] text-slate-900 shadow-[#3A7DFF]/30'
            : 'bg-white text-amber-500 shadow-slate-300'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-slate-950 fill-current" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 fill-current" />
        )}
      </motion.div>
    </button>
  );
};
