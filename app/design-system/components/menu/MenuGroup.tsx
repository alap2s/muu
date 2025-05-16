import React from 'react';
import { cn } from '../../utils/cn';
import { MenuItem, MenuItemProps } from './MenuItem';

export interface MenuGroupProps {
  title: string;
  items: MenuItemProps[];
  className?: string;
  sticky?: boolean;
}

export const MenuGroup = React.forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ title, items, className, sticky = true }, ref) => {
    return (
      <div ref={ref} className={cn('mb-6', className)}>
        <h3 className={cn(
          'text-xl font-semibold mb-3 bg-white py-2 text-black z-10',
          sticky && 'sticky top-0'
        )}>
          {title}
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </div>
      </div>
    );
  }
);

MenuGroup.displayName = 'MenuGroup'; 