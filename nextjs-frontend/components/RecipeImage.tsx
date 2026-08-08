'use client';
const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

export default function RecipeImage({ src, alt, className, style }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties;
}) {
  return (
    <img src={src} alt={alt} className={className} style={style}
      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
  );
}
