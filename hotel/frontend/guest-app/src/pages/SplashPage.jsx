import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { useSessionStore } from '../stores/sessionStore';

/**
 * Route: /table/:token — the URL embedded in the table's QR code.
 * Validates the token, then hands off to /menu. Shows a friendly, terminal
 * error screen (no retry) if the session is invalid or closed.
 */
export default function SplashPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isSuccess } = useSession(token);
  const error = useSessionStore((s) => s.error);
  const hotel = useSessionStore((s) => s.hotel);

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => navigate('/menu', { replace: true }), 500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, navigate]);

  const bg = hotel?.primary_color || '#2B2119';

  if (error) {
    return (
      <div
        className="app-shell flex flex-col items-center justify-center px-8 text-center text-white"
        style={{ background: bg }}
      >
        <div className="h-16 w-16 rounded-full bg-white/15 flex items-center justify-center mb-6">
          <span className="font-display text-2xl">!</span>
        </div>
        <h1 className="font-display text-xl font-semibold mb-2">
          {error.status === 410 ? 'Session closed' : 'QR code not recognized'}
        </h1>
        <p className="text-[14px] text-white/80 max-w-[280px]">
          This QR code is no longer active. Please ask your waiter for assistance.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="app-shell flex flex-col items-center justify-center text-white"
      style={{ background: bg }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="h-20 w-20 rounded-full bg-white/15 flex items-center justify-center mb-6"
        >
          <span className="font-display text-3xl font-semibold">
            {hotel?.name?.[0] || 'M'}
          </span>
        </motion.div>
        <h1 className="font-display text-xl font-semibold mb-8">
          {hotel?.name || 'Loading your table...'}
        </h1>
        <div className="flex gap-1.5" aria-label="Loading" role="status">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-white animate-pulseDot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
