import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Shared bottom-sheet shell for ItemDetailSheet, CartDrawer, and
 * PaymentSheet. Slides up from the bottom, traps focus while open, and
 * closes on Escape or backdrop tap.
 */
export default function Modal({ open, onClose, title, children, heightClass = 'max-h-[85vh]' }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Simple focus trap: keep Tab cycling within the sheet.
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-ink/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] bg-cream-card rounded-t-[28px] shadow-sheet z-50 ${heightClass} flex flex-col outline-none`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <div className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pb-2 shrink-0">
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="tap-shrink h-9 w-9 flex items-center justify-center rounded-full bg-line/70"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto grow">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
