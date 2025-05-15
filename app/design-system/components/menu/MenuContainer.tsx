import React from 'react';
import { cn } from '../../utils/cn';

export interface MenuContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MenuContainer = React.forwardRef<HTMLDivElement, MenuContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'max-w-2xl mx-auto px-4 py-6 bg-white rounded-lg shadow-sm',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

MenuContainer.displayName = 'MenuContainer'; 