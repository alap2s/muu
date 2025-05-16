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
      <div ref={ref} className={cn('border-b pb-4', className)} style={{ borderColor: 'var(--border-main)' }}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{name}</h4>
            {description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            €{price.toFixed(2)}
          </span>
        </div>
        {dietaryRestrictions && dietaryRestrictions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {dietaryRestrictions.includes('vegetarian') && (
              <span className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                <Leaf className="w-4 h-4 mr-1" />
                Vegetarian
              </span>
            )}
            {dietaryRestrictions.includes('vegan') && (
              <span className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
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