'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  disabled?: boolean
  rightContent?: React.ReactNode
  leftContent?: React.ReactNode
  description?: string
  subItems?: string[]
  hideInList?: boolean
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  leftIcon?: React.ReactNode
  className?: string
  position?: 'top' | 'bottom'
  align?: 'left' | 'right'
  hideChevron?: boolean
  preventCloseOnOptionClick?: boolean
  disabled?: boolean
  isIconOnly?: boolean
}

export function Dropdown({ 
  value, 
  onChange, 
  options, 
  leftIcon, 
  className = '', 
  position = 'bottom', 
  align = 'left',
  hideChevron = false,
  preventCloseOnOptionClick = false,
  disabled = false,
  isIconOnly = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      setButtonRect(rect)
    }
  }, [isOpen])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative w-full md:max-w-4xl md:mx-auto" ref={dropdownRef}>
      {/* Blur overlay, rendered first and behind the button and dropdown */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            opacity: 1,
            pointerEvents: 'auto',
            zIndex: 9997,
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.2s',
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* Dropdown trigger button */}
      {isIconOnly ? (
        <button
          type="button"
          style={{
            width: 48,
            height: 48,
            border: '1px solid var(--border-main)',
            background: isOpen ? 'var(--accent)' : 'var(--background-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            position: 'relative',
          }}
          className={className}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={selectedOption?.label || 'Open menu'}
        >
          {leftIcon && <div style={{ color: isOpen ? 'var(--background-main)' : (disabled ? '#B9A5FF' : 'var(--accent)') }}>{leftIcon}</div>}
        </button>
      ) : (
        <button
          type="button"
          style={{
            width: '100%',
            height: 48,
            borderLeft: '1px solid var(--border-main)',
            borderRight: '1px solid var(--border-main)',
            paddingLeft: 16,
            paddingRight: 16,
            background: isOpen ? 'var(--accent)' : 'var(--background-main)',
            color: isOpen ? 'var(--background-main)' : (selectedOption ? 'var(--accent)' : 'var(--text-primary)') ,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 9998,
            position: 'relative',
          }}
          className={className}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            {leftIcon && <div style={{ flex: 'none', color: isOpen ? 'var(--background-main)' : (disabled ? '#B9A5FF' : 'var(--accent)') }}>{leftIcon}</div>}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isOpen ? 'var(--background-main)' : (selectedOption ? 'var(--accent)' : 'var(--text-primary)') }}>{selectedOption?.label || 'Select...'}</span>
          </div>
          {!hideChevron && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              style={{ color: isOpen ? 'var(--background-main)' : 'var(--accent)' }}
            />
          )}
        </button>
      )}

      <div 
        style={{
          position: 'fixed',
          left: 0,
          width: '100vw',
          zIndex: 9999,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          top: position === 'bottom' ? `${buttonRect?.bottom}px` : 'auto',
          bottom: position === 'top' ? `${window.innerHeight - (buttonRect?.top || 0)}px` : 'auto',
          transition: 'opacity 0.2s',
        }}
      >
        <div style={{ 
          width: 'calc(100vw - 64px)', 
          maxWidth: 1024, 
          margin: '0 auto', 
          background: 'var(--background-secondary)', 
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border-main)',
        }}>
          {options.filter(option => !option.hideInList).map((option, index, filteredOptions) => (
            <div
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                background: option.value === value ? 'var(--background-tertiary)' : 'var(--background-secondary)',
                borderBottom: index === filteredOptions.length - 1 ? 'none' : '1px solid var(--border-main)',
                color: 'var(--text-primary)',
                opacity: option.disabled ? 0.5 : 1,
                transition: 'background 0.2s',
              }}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value)
                  if (!preventCloseOnOptionClick) {
                    setIsOpen(false)
                  }
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                {option.leftContent && (
                  <div style={{ flex: 'none', color: option.disabled
                    ? '#B9A5FF'
                    : option.value === value
                      ? 'var(--accent)'
                      : 'var(--text-primary)'
                  }}>
                    {option.leftContent}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    color: option.value === value ? 'var(--accent)' : 'var(--text-primary)',
                    fontSize: 14
                  }}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'normal' }}>
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                {option.rightContent && (
                  <div style={{ flex: 'none', color: option.disabled
                    ? '#B9A5FF'
                    : option.value === value
                      ? 'var(--accent)'
                      : 'var(--text-primary)'
                  }}>
                    {option.rightContent}
                  </div>
                )}
                {option.value === value && (
                  <Check 
                    className="w-4 h-4" 
                    style={{ color: option.disabled ? '#B9A5FF' : 'var(--accent)' }} 
                    strokeWidth={2} 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
 