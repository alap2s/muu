import React from 'react';
import { Leaf, Vegan } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MenuItemProps {
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions?: string[];
  className?: string;
}

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
  ({ name, description, price, dietaryRestrictions, className }, ref) => {
    return (
      <div ref={ref} className={cn('border-b pb-4', className)}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-black">{name}</h4>
            {description && (
              <p className="text-gray-600 text-sm mt-1">
                {description}
              </p>
            )}
          </div>
          <span className="font-medium text-black">
            €{price.toFixed(2)}
          </span>
        </div>
        {dietaryRestrictions && dietaryRestrictions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {dietaryRestrictions.includes('vegetarian') && (
              <span className="flex items-center text-black text-sm">
                <Leaf className="w-4 h-4 mr-1" />
                Vegetarian
              </span>
            )}
            {dietaryRestrictions.includes('vegan') && (
              <span className="flex items-center text-black text-sm">
                <Vegan className="w-4 h-4 mr-1" />
                Vegan
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

MenuItem.displayName = 'MenuItem'; 