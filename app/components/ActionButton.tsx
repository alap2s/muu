import React from 'react'

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  children: React.ReactNode
}

export function ActionButton({
  iconLeft,
  iconRight,
  children,
  className = '',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center px-4 h-12 min-h-[48px] rounded border border-border bg-[var(--background-main)] text-[var(--text-primary)] font-medium text-base transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{ height: 48 }}
      {...props}
    >
      {iconLeft && <span className="mr-2 flex items-center">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="ml-2 flex items-center">{iconRight}</span>}
    </button>
  )
} 