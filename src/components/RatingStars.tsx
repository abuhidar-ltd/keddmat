import { Star } from 'lucide-react';

interface RatingStarsProps { rating: number; maxRating?: number; size?: number; interactive?: boolean; onRate?: (rating: number) => void; }

const RatingStars = ({ rating, maxRating = 5, size = 16, interactive = false, onRate }: RatingStarsProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          style={{ width: size, height: size }}
          fill={i < rating ? '#f59e0b' : 'none'}
          stroke={i < rating ? '#f59e0b' : 'currentColor'}
          strokeWidth={1.5}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default RatingStars;