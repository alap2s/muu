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
  const baseStyles = "h-12 min-w-12 w-12 font-mono transition-colors flex items-center justify-center"
  // Use CSS variables for color, background, and border
  let style: React.CSSProperties = {};
  if (variant === 'primary') {
    style.background = selected ? 'var(--accent)' : 'var(--accent)';
    style.color = 'var(--text-primary)';
    if (disabled) style.color = '#B9A5FF';
  } else {
    style.background = 'var(--background-main)';
    style.color = 'var(--text-primary)';
    style.border = '1px solid var(--border-main)';
    if (selected) {
      style.background = 'var(--accent)';
      style.color = 'var(--background-main)';
    }
    if (disabled) style.color = '#B9A5FF';
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
        <span className="flex items-center justify-center w-full h-full text-[14px] font-mono">
          {React.Children.map(children, child => {
            if (typeof child === 'string' || typeof child === 'number') {
              return <span className="text-[14px] font-mono flex items-center justify-center w-full h-full">{child}</span>;
            }
            // For icons or elements, force 16x16 and set color to brand
            return React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement, {
                  className: 'w-4 h-4',
                  style: {
                    width: 16,
                    height: 16,
                    display: 'block',
                    margin: 'auto',
                    color: disabled
                      ? '#B9A5FF'
                      : selected
                        ? 'var(--background-main)'
                        : 'var(--accent)',
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