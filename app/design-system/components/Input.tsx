'use client'

import React, { useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean
  warning?: boolean
  icon?: LucideIcon
  iconClassName?: string
}

export function Input({ 
  label, 
  error, 
  warning,
  icon: Icon,
  iconClassName,
  className = '', 
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 48,
          background: 'var(--background-main)',
          border: `1px solid ${error ? 'hsl(var(--destructive))' : warning ? 'hsl(var(--warning))' : isFocused ? 'var(--accent)' : 'var(--border-main)'}`,
          transition: 'border-color 0.2s',
        }}
      >
        {Icon && (
          <div 
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            style={{ 
              color: error ? 'hsl(var(--destructive))' : warning ? 'hsl(var(--warning))' : 'var(--accent)'
            }}
          >
            <Icon className={`w-4 h-4 ${iconClassName || ''}`} />
          </div>
        )}
        <input
          style={{
            width: '100%',
            height: '100%',
            paddingLeft: Icon ? 40 : 16,
            paddingRight: 16,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
          className={className}
          {...props}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
        />
      </div>
    </div>
  )
} 