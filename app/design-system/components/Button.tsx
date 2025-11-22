'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  selected?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  loading = false,
  selected = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "h-12 font-mono transition-colors flex items-center"
  let style: React.CSSProperties = {
    minWidth: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
  };
  
  let iconColor = 'inherit'; // Default icon color

  if (variant === 'primary') {
    style.background = 'var(--accent)';
    style.color = 'var(--background-main)';
    iconColor = 'var(--background-main)';
    if (disabled) {
      style.color = 'var(--text-secondary)';
      iconColor = 'var(--text-secondary)';
    }
  } else { // secondary
    style.background = selected ? 'var(--accent)' : 'var(--background-main)';
    style.color = selected ? 'var(--background-main)' : 'var(--accent)';
    iconColor = selected ? 'var(--background-main)' : 'var(--accent)';
    // No component-level border; separators and grid rails provide structure
    style.border = 'none';
    if (disabled) {
      // For secondary disabled, use text-secondary or a specific muted color that works on both accent and background-main
      // Current globals.css has --text-secondary which is semi-transparent, might be fine with opacity-50 too.
      // Using text-secondary for consistency with how other disabled states might be handled.
      style.color = 'var(--text-secondary)'; 
      iconColor = 'var(--text-secondary)';
      // Note: The previous #B9A5FF might have been too specific or clashy depending on theme.
    }
  }

  const childArray = React.Children.toArray(children);
  const isIconOnly = variant === 'secondary' && childArray.length === 1 && React.isValidElement(childArray[0]);

  // If there is only one child and it's an icon, assume it's an icon-only button
  if (isIconOnly) {
    style.width = 48;
    style.height = 48;
    style.padding = '0';
    style.justifyContent = 'center';
  }

  return (
    <button
      className={`${baseStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={style}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className={`flex items-center gap-2 ${isIconOnly ? '' : 'w-full'} text-[14px] font-mono`}>
          {React.Children.map(children, child => {
            if (typeof child === 'string' || typeof child === 'number') {
              return <span className="text-[14px] font-mono text-left flex-1">{child}</span>;
            }
            return React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement, {
                  className: 'w-4 h-4 flex-none',
                  style: {
                    width: 16,
                    height: 16,
                    display: 'block',
                    color: iconColor, // Use the determined iconColor
                    ...((child as any).props?.style || {})
                  },
                  ...((child as any).props || {})
                })
              : child;
          })}
        </span>
      )}
    </button>
  )
} 