'use client'

import React, { useState } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: boolean
  warning?: boolean
  rows?: number
}

export function TextArea({ 
  label,
  error = false,
  warning = false,
  rows = 20,
  className = '',
  ...props 
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }

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
          width: '100%',
          background: 'var(--background-main)',
          border: `1px solid ${error ? 'hsl(var(--destructive))' : warning ? 'hsl(var(--warning))' : isFocused ? 'var(--accent)' : 'var(--border-main)'}`,
          transition: 'border-color 0.2s',
        }}
      >
        <textarea
          {...props}
          rows={rows}
          style={{
            width: '100%',
            padding: 16,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            minHeight: '320px',
            lineHeight: '16px'
          }}
          className={className}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-mono" style={{ color: 'hsl(var(--destructive))' }}>
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="mt-2 text-sm font-mono" style={{ color: 'hsl(var(--warning))' }}>
          {warning}
        </p>
      )}
    </div>
  )
} 