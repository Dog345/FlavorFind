'use client';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingStars({ 
  rating, 
  reviewCount,
  size = 'md'
}: RatingStarsProps) {
  const sizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className={`fas fa-star text-yellow-400 ${sizeMap[size]}`}></i>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <i className={`fas fa-star-half-alt text-yellow-400 ${sizeMap[size]}`}></i>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className={`fas fa-star text-gray-600 ${sizeMap[size]}`}></i>
        ))}
      </div>
      
      <span className="text-gray-400">
        {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount})`}
      </span>
    </div>
  );
}
