'use client';

import { useState, useMemo } from 'react';
import { generatePlaceholderImage } from '@/lib/image-utils';

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
  const placeholderSvg = useMemo(() => generatePlaceholderImage(alt), [alt]);
  const [imageSrc, setImageSrc] = useState(src || placeholderSvg);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setImageSrc(placeholderSvg);
    }
  };

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className} 
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
}
