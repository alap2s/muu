'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  disabled?: boolean
  rightContent?: React.ReactNode
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
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
        className={`w-full h-12 border-r border-primary-border/10 dark:border-dark-primary-border/10 pl-4 pr-4 appearance-none bg-primary-light dark:bg-dark-background-main text-primary dark:text-dark-primary font-mono flex items-center justify-between text-sm ${isOpen ? 'border-t border-b border-l' : ''} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        {!hideChevron && (
          <ChevronDown className={`w-4 h-4 text-primary dark:text-dark-primary flex-none ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
        )}
      </button>

      <div 
        className={`fixed inset-0 bg-primary-light/50 dark:bg-dark-background-main/70 backdrop-blur-sm z-[9998] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          clipPath: isOpen && buttonRect ? `polygon(0% 0%, 100% 0%, 100% ${buttonRect.top}px, ${buttonRect.right}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.top}px, 100% ${buttonRect.top}px, 100% 100%, 0% 100%)` : 'none'
        }}
        onClick={() => setIsOpen(false)}
      />

      <div 
        className={`fixed left-0 w-screen z-[9999] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: position === 'bottom' ? `${buttonRect?.bottom}px` : 'auto',
          bottom: position === 'top' ? `${window.innerHeight - (buttonRect?.top || 0)}px` : 'auto'
        }}
      >
        <div className="w-[calc(100vw-64px)] md:max-w-4xl md:mx-auto md:w-full mx-auto bg-primary-light dark:bg-dark-background-main border-primary-border/10 dark:border-dark-primary-border/10 border-t border-b border-r border-l">
          {options.filter(option => !option.hideInList).map((option, index, filteredOptions) => (
            <div
              key={option.value}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary/5 dark:hover:bg-dark-primary/10 border-b border-primary-border/10 dark:border-dark-primary-border/10 last:border-b-0 ${
                option.value === value ? 'bg-primary/10 dark:bg-dark-primary/10' : ''
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
                {option.value === value && <Check className="w-4 h-4 text-primary dark:text-dark-primary flex-none" strokeWidth={2} />}
                <div className="min-w-0">
                  <div className={`truncate ${option.value === value ? 'text-primary dark:text-dark-primary' : 'text-[#1e1e1e] dark:text-dark-text-primary'}`}>{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-[#1e1e1e]/50 dark:text-white/50 whitespace-normal">{option.description}</div>
                  )}
                </div>
              </div>
              {option.rightContent && <div className="flex-none">{option.rightContent}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
 