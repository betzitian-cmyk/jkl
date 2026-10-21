import { useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  theme: 'dark' | 'light';
  children: ReactNode;
  language?: 'fr' | 'en';
}

export default function Drawer({ isOpen, onClose, title, theme, children, language = 'fr' }: DrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const panelBg = theme === 'light'
    ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-2xl'
    : 'bg-zinc-950/95 border-zinc-800 text-white shadow-black/80 shadow-2xl';

  const overlayBg = theme === 'light'
    ? 'bg-zinc-900/30 backdrop-blur-md'
    : 'bg-black/60 backdrop-blur-md';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        onClick={onClose}
        className={`fixed inset-0 z-[9999] ${overlayBg}`}
      />

      {/* Slideout Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ x: '100%', scale: 0.98, opacity: 0.9 }}
        animate={{ x: 0, scale: 1, opacity: 1 }}
        exit={{ x: '100%', scale: 0.98, opacity: 0.9 }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 240,
          mass: 0.8,
        }}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md md:max-w-lg z-[10000] flex flex-col border-l backdrop-blur-xl ${panelBg}`}
      >
        {/* Drawer Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          theme === 'light' ? 'border-zinc-100' : 'border-zinc-800/60'
        }`}>
          <div className="flex flex-col text-left">
            <span className={`text-[10px] font-mono tracking-wider uppercase ${
              theme === 'light' ? 'text-zinc-400 font-semibold' : 'text-zinc-500'
            }`}>
              {language === 'fr' ? 'Console Copilote' : 'Copilot Console'}
            </span>
            <h3 className="text-lg font-bold tracking-tight uppercase font-sans mt-0.5">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              theme === 'light'
                ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                : 'hover:bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {children}
        </div>
      </motion.div>
    </>
  );
}
