import { useEffect, useState } from 'react';

/** True once the viewport is at least `px` wide. Used to switch a handful of
 * components (bottom sheets → centered/side dialogs, tab bar → top nav)
 * between their mobile and desktop presentation without duplicating markup. */
export function useMediaQuery(query = '(min-width: 768px)') {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
