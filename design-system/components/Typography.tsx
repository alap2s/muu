import React from 'react';
import { cn } from '../utils/cn';

export interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export const H1 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          'text-4xl font-bold text-black tracking-tight',
          className
        )}
      >
        {children}
      </h1>
    );
  }
);

export const H2 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          'text-3xl font-bold text-black tracking-tight',
          className
        )}
      >
        {children}
      </h2>
    );
  }
);

export const H3 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-2xl font-bold text-black tracking-tight',
          className
        )}
      >
        {children}
      </h3>
    );
  }
);

export const H4 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className }, ref) => {
    return (
      <h4
        ref={ref}
        className={cn(
          'text-xl font-semibold text-black tracking-tight',
          className
        )}
      >
        {children}
      </h4>
    );
  }
);

export const P = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-base text-black leading-7', className)}
      >
        {children}
      </p>
    );
  }
);

const Blockquote = React.forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        'mt-6 border-l-2 border-border-main pl-6 italic text-black',
        className
      )}
      {...props}
    />
  )
);
Blockquote.displayName = 'Blockquote';

const List = React.forwardRef<HTMLUListElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    />
  )
);
List.displayName = 'List';

const InlineCode = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        'relative rounded bg-background-secondary px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-black',
        className
      )}
      {...props}
    />
  )
);
InlineCode.displayName = 'InlineCode';

const Lead = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xl text-gray-600', className)}
      {...props}
    />
  )
);
Lead.displayName = 'Lead';

const Large = React.forwardRef<HTMLDivElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-lg font-semibold text-black', className)}
      {...props}
    />
  )
);
Large.displayName = 'Large';

const Small = React.forwardRef<HTMLSmallElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn('text-sm text-gray-600', className)}
      {...props}
    />
  )
);
Small.displayName = 'Small';

const Muted = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600', className)}
      {...props}
    />
  )
);
Muted.displayName = 'Muted';

export {
  Blockquote,
  List,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted,
}; 