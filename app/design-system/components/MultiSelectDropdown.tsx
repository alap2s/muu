'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'

interface Option {
  value: string
  label: string
  disabled?: boolean
  rightContent?: React.ReactNode
  leftContent?: React.ReactNode
  description?: string
  hideInList?: boolean
}

interface MultiSelectDropdownProps {
  value: string[]
  onChange: (value: string[]) => void
  options: Option[]
  placeholder?: string
  leftIcon?: React.ReactNode
  className?: string
  position?: 'top' | 'bottom'
  align?: 'left' | 'right'
  hideChevron?: boolean
  preventCloseOnOptionClick?: boolean
  disabled?: boolean
}

export function MultiSelectDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  leftIcon, 
  className = '', 
  position = 'bottom', 
  align = 'left',
  hideChevron = false,
  preventCloseOnOptionClick = true,
  disabled = false
}: MultiSelectDropdownProps) {
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

  const selectedOptions = options.filter(option => value.includes(option.value))

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return

    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]

    onChange(newValue)
    if (!preventCloseOnOptionClick) {
      setIsOpen(false)
    }
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== optionValue))
  }

  return (
    <div className="relative w-full md:max-w-4xl md:mx-auto" ref={dropdownRef}>
      {/* Blur overlay */}
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
      <button
        type="button"
        style={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? 'var(--accent)' : 'var(--background-main)',
          color: isOpen ? 'var(--background-main)' : 'var(--text-primary)',
          border: '1px solid var(--border-main)',
          zIndex: 9998,
          position: 'relative',
        }}
        className={className}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value.length === 1 ? (
          // Show the selected item's icon when only one item is selected
          <div style={{ 
            color: isOpen ? 'var(--background-main)' : (disabled ? '#B9A5FF' : 'var(--accent)')
          }}>
            {options.find(opt => opt.value === value[0])?.leftContent || leftIcon}
          </div>
        ) : value.length > 1 ? (
          // Show count bubble when multiple items are selected
          <div style={{ position: 'relative' }}>
            {leftIcon}
            <div style={{
              position: 'absolute',
              top: -10,
              right: -10,
              background: 'var(--accent)',
              color: 'var(--background-main)',
              borderRadius: '50%',
              width: 20,
              height: 20,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}>
              {value.length}
            </div>
          </div>
        ) : (
          // Show default icon when no items are selected
          leftIcon && (
            <div style={{ 
              color: isOpen ? 'var(--background-main)' : (disabled ? '#B9A5FF' : 'var(--accent)')
            }}>
              {leftIcon}
            </div>
          )
        )}
      </button>

      {/* Dropdown content */}
      {isOpen && (
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
            border: '1px solid var(--accent)',
            maxHeight: '40vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              maxHeight: '40vh',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--accent) var(--background-main)',
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
                    background: value.includes(option.value) ? 'var(--background-tertiary)' : 'var(--background-secondary)',
                    borderBottom: index === filteredOptions.length - 1 ? 'none' : '1px solid var(--border-main)',
                    color: 'var(--text-primary)',
                    opacity: option.disabled ? 0.5 : 1,
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {option.leftContent && (
                      <div style={{ flex: 'none', color: option.disabled
                        ? '#B9A5FF'
                        : value.includes(option.value)
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
                        color: value.includes(option.value) ? 'var(--accent)' : 'var(--text-primary)',
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
                        : value.includes(option.value)
                          ? 'var(--accent)'
                          : 'var(--text-primary)'
                      }}>
                        {option.rightContent}
                      </div>
                    )}
                    {value.includes(option.value) && (
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
      )}
    </div>
  )
} 