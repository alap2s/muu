'use client'

import React, { useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
}

export function Input({ 
  label, 
  error, 
  icon: Icon,
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
          border: `1px solid ${error ? '#f87171' : isFocused ? 'var(--accent)' : 'var(--border-main)'}`,
          transition: 'border-color 0.2s',
        }}
      >
        {Icon && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 48,
              color: error ? '#f87171' : isFocused ? 'var(--accent)' : 'var(--accent)',
            }}
          >
            <Icon size={16} />
          </div>
        )}
        <input
          style={{
            width: '100%',
            height: '100%',
            paddingLeft: Icon ? 0 : 16,
            paddingRight: 16,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
          className={className}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: '#f87171' }}>{error}</p>
      )}
    </div>
  )
} 