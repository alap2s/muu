import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';
import { H2 } from '../Typography';

export interface RestaurantHeaderProps {
  name: string;
  distance: number;
  onClose?: () => void;
  className?: string;
}

export const RestaurantHeader = React.forwardRef<HTMLDivElement, RestaurantHeaderProps>(
  ({ name, distance, onClose, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex justify-between items-start mb-4', className)}>
        <div>
          <H2>{name}</H2>
          <div className="flex items-center text-gray-600 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{distance} km away</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

RestaurantHeader.displayName = 'RestaurantHeader'; 