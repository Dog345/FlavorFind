'use client';

export default function RecipeImage({ 
  src, 
  alt, 
  className, 
  style 
}: {
  src?: string; 
  alt: string; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style}
      loading="lazy"
    />
  );
}
