'use client'

import { useState, useRef, useEffect } from 'react'
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
  preventCloseOnOptionClick = false
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
      <button
        type="button"
        className={`w-full h-12 border-r border-border-main dark:border-dark-border-main pl-4 pr-4 appearance-none bg-background-secondary dark:bg-dark-background-secondary ${selectedOption ? 'text-primary dark:text-dark-text-primary' : 'text-black dark:text-dark-text-primary'} font-mono flex items-center justify-between text-sm ${isOpen ? 'border-t border-b border-l' : ''} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        {!hideChevron && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      <div 
        className={`fixed inset-0 bg-primary-light/50 dark:bg-dark-background-main/70 backdrop-blur-md z-[9998] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          clipPath: isOpen && buttonRect ? `polygon(0% 0%, 100% 0%, 100% ${buttonRect.top}px, ${buttonRect.right}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.top}px, 100% ${buttonRect.top}px, 100% 100%, 0% 100%)` : 'none'
        }}
        onClick={() => setIsOpen(false)}
      />

      <div 
        className={`fixed left-0 w-screen z-[9999] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: position === 'bottom' ? `${buttonRect?.bottom}px` : 'auto',
          bottom: position === 'top' ? `${window.innerHeight - (buttonRect?.top || 0)}px` : 'auto'
        }}
      >
        <div className="w-[calc(100vw-64px)] md:max-w-4xl md:mx-auto md:w-full mx-auto bg-background-secondary dark:bg-dark-background-secondary border border-primary/20 dark:border-dark-border-main border-t border-b border-r border-l">
          {options.filter(option => !option.hideInList).map((option, index, filteredOptions) => (
            <div
              key={option.value}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-background-tertiary dark:hover:bg-dark-background-tertiary border-b border-primary/20 dark:border-dark-border-main last:border-b-0 transition-colors ${
                option.value === value ? 'bg-background-tertiary dark:bg-dark-background-tertiary' : ''
              } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value)
                  if (!preventCloseOnOptionClick) {
                    setIsOpen(false)
                  }
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {option.leftContent && (
                  <div className={`flex-none ${option.value === value ? 'text-primary dark:text-dark-text-primary' : 'text-black dark:text-dark-text-primary'}`}>
                    {option.leftContent}
                  </div>
                )}
                <div className="min-w-0">
                  <div className={`truncate ${option.value === value ? 'text-primary dark:text-dark-text-primary' : 'text-black dark:text-dark-text-primary'}`}>{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 dark:text-white/50 whitespace-normal">{option.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none">
                {option.rightContent && (
                  <div className={`flex-none ${option.value === value ? 'text-primary dark:text-dark-text-primary' : 'text-black dark:text-dark-text-primary'}`}>
                    {option.rightContent}
                  </div>
                )}
                {option.value === value && <Check className="w-4 h-4 text-primary dark:text-dark-text-primary" strokeWidth={2} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
 