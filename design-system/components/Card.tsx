import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border-main bg-background-main shadow-sm',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
      >
        {children}
      </div>
    );
  }
);

export const CardTitle = React.forwardRef<HTMLParagraphElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-2xl font-bold text-black', className)}
      >
        {children}
      </h3>
    );
  }
);

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-600', className)}
      >
        {children}
      </p>
    );
  }
);

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)}>
        {children}
      </div>
    );
  }
);

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
      >
        {children}
      </div>
    );
  }
); 