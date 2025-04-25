'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
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
        className={`w-full h-12 border-r border-[#6237FF]/20 pl-8 pr-8 appearance-none bg-[#F4F2F8] text-[#6237FF] font-mono flex items-center justify-between ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <div className="absolute left-2 flex-none">{leftIcon}</div>}
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#6237FF] absolute right-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {isOpen && buttonRect && (
        <div 
          className="fixed left-0 w-screen bg-[#F4F2F8] border-[#6237FF]/20 border-t border-b z-[9999]"
          style={{
            top: position === 'bottom' ? `${buttonRect.bottom}px` : 'auto',
            bottom: position === 'top' ? `${window.innerHeight - buttonRect.top}px` : 'auto'
          }}
        >
          <div className="max-w-4xl mx-auto">
            {options.map((option, index) => (
              <div key={option.value} className="flex">
                <div className="w-8 border-r border-[#6237FF]/20" />
                <button
                  type="button"
                  className={`flex-1 h-12 px-8 flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} font-mono hover:bg-[#6237FF]/5 ${option.value === value ? 'text-[#6237FF]' : 'text-[#1e1e1e]'} ${index === options.length - 1 ? '' : 'border-b border-[#6237FF]/20'}`}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  <div className={`min-w-0 flex-1 flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span className="truncate">{option.label}</span>
                  </div>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-[#6237FF] flex-none ml-4" strokeWidth={2} />
                  )}
                </button>
                <div className="w-8 border-l border-[#6237FF]/20" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
 