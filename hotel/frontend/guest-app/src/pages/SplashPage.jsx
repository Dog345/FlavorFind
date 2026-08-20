import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveSession } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

export default function SplashPage() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const setToken     = useSessionStore((s) => s.setToken);
  const setSession   = useSessionStore((s) => s.setSession);
  const setError     = useSessionStore((s) => s.setError);

  useEffect(() => {
    if (!token) return;
    setToken(token);

    resolveSession(token)
      .then(({ data }) => {
        setSession(data);
        navigate('/menu', { replace: true });
      })
      .catch((err) => {
        const status = err?.response?.status;
        let msg = 'Something went wrong. Please scan again.';
        if (status === 404) msg = 'Table not found. Ask your waiter.';
        if (status === 410) msg = 'This session has ended. Ask your waiter.';
        setError(msg);
      });
  }, [token]);

  const error = useSessionStore((s) => s.error);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 px-6">
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
          <span className="text-3xl">🍽️</span>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-[#f5f5f0] tracking-wide">
            Mamba Hotel
          </h1>
          <p className="text-[#888] text-sm mt-1">Fine Dining Experience</p>
        </div>
      </div>

      {!error ? (
        /* Loading spinner */
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#f5c842] rounded-full animate-spin" />
          <p className="text-[#888] text-sm">Opening your table…</p>
        </div>
      ) : (
        /* Error state */
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-2xl">⚠️</div>
          <p className="text-[#f5f5f0] text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[#f5c842] text-[#0a0a0a] text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
