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
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full h-12 border-r border-[#FF373A]/20 pl-4 pr-4 appearance-none bg-[#F4F2F8] text-[#FF373A] font-mono flex items-center justify-between text-sm ${isOpen ? 'border-t border-b border-l' : ''} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        {!hideChevron && (
          <ChevronDown className={`w-4 h-4 text-[#FF373A] flex-none ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
        )}
      </button>

      <div 
        className={`fixed inset-0 bg-[#F4F2F8]/50 backdrop-blur-sm z-[9998] ${
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
        <div className="w-[calc(100vw-64px)] mx-auto bg-[#F4F2F8] border-[#FF373A]/20 border-t border-b border-r border-l">
          {options.filter(option => !option.hideInList).map((option, index, filteredOptions) => (
            <div
              key={option.value}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#FF373A]/5 border-b border-[#FF373A]/20 last:border-b-0 ${
                option.value === value ? 'bg-[#FF373A]/10' : ''
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
                {option.value === value && <Check className="w-4 h-4 text-[#FF373A] flex-none" strokeWidth={2} />}
                <div className="min-w-0">
                  <div className="truncate">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-[#FF373A]/70 truncate">{option.description}</div>
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
 