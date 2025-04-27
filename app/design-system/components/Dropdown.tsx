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
  const [isTransitioning, setIsTransitioning] = useState(false)

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
      setIsTransitioning(true)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [isOpen])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full h-12 border-r border-[#FF373A]/20 pl-4 pr-4 appearance-none bg-[#F4F2F8] text-[#FF373A] font-mono flex items-center justify-between ${isOpen ? 'border-t border-b border-l' : ''} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#FF373A] flex-none transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      <div 
        className={`fixed inset-0 bg-[#F4F2F8]/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          clipPath: isOpen && buttonRect ? `polygon(0% 0%, 100% 0%, 100% ${buttonRect.top}px, ${buttonRect.right}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.top}px, ${buttonRect.left}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.bottom}px, ${buttonRect.right}px ${buttonRect.top}px, 100% ${buttonRect.top}px, 100% 100%, 0% 100%)` : 'none'
        }}
        onClick={() => setIsOpen(false)}
      />

      <div 
        className={`fixed left-0 w-screen z-[9999] transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{
          top: position === 'bottom' ? `${buttonRect?.bottom}px` : 'auto',
          bottom: position === 'top' ? `${window.innerHeight - (buttonRect?.top || 0)}px` : 'auto'
        }}
      >
        <div className="w-[calc(100vw-64px)] mx-auto bg-[#F4F2F8] border-[#FF373A]/20 border-t border-b border-r border-l">
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
    </div>
  )
}
 