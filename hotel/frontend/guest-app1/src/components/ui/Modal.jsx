import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * Shared overlay shell for ItemDetailSheet, CartDrawer, and PaymentSheet.
 *
 * On phones this is always a bottom sheet that slides up — matches the
 * reference design exactly. On desktop (md+) it switches presentation based
 * on `variant`, because a phone-style sheet slapped across a wide screen
 * looks broken:
 *   - variant="panel" (CartDrawer): docks to the right edge as a tall side
 *     panel, like a standard desktop cart/checkout flyout.
 *   - variant="dialog" (ItemDetailSheet): becomes a centered, rounded
 *     modal card instead of covering the full width.
 */
export default function Modal({ open, onClose, title, children, footer, heightClass = 'max-h-[85vh]', variant = 'dialog' }) {
  const sheetRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
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

  const desktopPanel = isDesktop && variant === 'panel';
  const desktopDialog = isDesktop && variant === 'dialog';

  const wrapperClass = desktopPanel
    ? 'fixed inset-y-0 right-0 z-50 flex'
    : desktopDialog
    ? 'fixed inset-0 z-50 flex items-center justify-center p-6'
    : 'fixed left-1/2 -translate-x-1/2 bottom-0 z-50 w-full max-w-[480px]';

  const cardClass = desktopPanel
    ? `h-full w-[420px] bg-cream-card shadow-sheet flex flex-col outline-none`
    : desktopDialog
    ? `w-full max-w-lg max-h-[85vh] bg-cream-card rounded-[28px] shadow-sheet flex flex-col outline-none`
    : `w-full bg-cream-card rounded-t-[28px] shadow-sheet ${heightClass} flex flex-col outline-none`;

  const motionProps = desktopPanel
    ? {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'spring', damping: 32, stiffness: 320 },
      }
    : desktopDialog
    ? {
        initial: { opacity: 0, scale: 0.96, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
        transition: { duration: 0.18, ease: 'easeOut' },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        transition: { type: 'spring', damping: 32, stiffness: 320 },
      };

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
          <div className={wrapperClass}>
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              className={cardClass}
              {...motionProps}
            >
              {!desktopPanel && (
                <div className="flex items-center justify-center pt-3 pb-1 shrink-0 md:hidden">
                  <div className="h-1.5 w-10 rounded-full bg-line" />
                </div>
              )}
              {(title || desktopPanel || desktopDialog) && (
                <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                  {title ? <h2 className="font-display text-lg font-semibold">{title}</h2> : <span />}
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
              {footer && (
                <div
                  className="shrink-0 p-4 bg-cream-card border-t border-line"
                  style={
                    desktopPanel || desktopDialog
                      ? undefined
                      : { paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }
                  }
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
