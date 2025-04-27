'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  leftIcon?: React.ReactNode
  className?: string
  position?: 'top' | 'bottom'
  align?: 'left' | 'right'
}

export function Dropdown({ value, onChange, options, leftIcon, className = '', position = 'bottom', align = 'left' }: DropdownProps) {
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
        className={`w-full h-12 border-r border-[#FF373A]/20 pl-4 pr-4 appearance-none bg-[#F4F2F8] text-[#FF373A] font-mono flex items-center justify-between ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#FF373A] flex-none transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {isOpen && buttonRect && (
        <div 
          className="fixed left-0 w-screen z-[9999]"
          style={{
            top: position === 'bottom' ? `${buttonRect.bottom}px` : 'auto',
            bottom: position === 'top' ? `${window.innerHeight - buttonRect.top}px` : 'auto'
          }}
        >
          <div className="w-[calc(100vw-64px)] mx-auto bg-[#F4F2F8] border-[#FF373A]/20 border-t border-b border-r">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                className={`w-full flex justify-between items-center h-12 px-4 font-mono hover:bg-[#FF373A]/5 ${
                  option.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : option.value === value 
                      ? 'text-[#FF373A]' 
                      : 'text-[#1e1e1e]'
                } ${index === options.length - 1 ? '' : 'border-b border-[#FF373A]/20'}`}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value)
                    setIsOpen(false)
                  }
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && !option.disabled && (
                  <Check className="w-4 h-4 text-[#FF373A] flex-none ml-4" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
 