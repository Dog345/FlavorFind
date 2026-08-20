/**
 * Primary tactile button used for every CTA in the app (Add to cart, Place
 * Order, Pay). Gives visual feedback on tap via the .tap-shrink utility.
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  ariaLabel,
}) {
  const base =
    'tap-shrink inline-flex items-center justify-center gap-2 rounded-xl2 font-sans font-semibold text-[15px] px-5 py-3.5 min-h-[44px] shadow-tap disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-primary text-white',
    outline: 'bg-transparent text-ink border border-line',
    ghost: 'bg-transparent text-ink',
    dark: 'bg-ink text-cream',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
