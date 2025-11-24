'use client'

import React, { ReactNode, HTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GridRow } from './GridRow'

interface PageContentStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  autoPad?: boolean
  rowHeight?: number
  fillerMaxWidth?: number
  fillerSeparators?: boolean
}

// Wraps page content rows and adds horizontal separators between direct children
export function PageContentStack({ 
  children, 
  className = '', 
  autoPad = false,
  rowHeight = 48,
  fillerMaxWidth,
  fillerSeparators,
  ...rest 
}: PageContentStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fillerCount, setFillerCount] = useState(0)

  useLayoutEffect(() => {
    if (!autoPad) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const measureAndSet = () => {
      // Prefer measuring the PageShell content scroll container (has fixed available height)
      const scrollContainer = (container.closest('[data-pageshell-content]') as HTMLElement) || container.parentElement || container
      const containerHeight = scrollContainer.getBoundingClientRect().height
      const contentHeight = content.getBoundingClientRect().height
      const remainingPx = containerHeight - contentHeight
      // Subtract 1px to account for hairlines/dividers to avoid underfilling
      const remainingRows = Math.ceil((remainingPx - 1) / rowHeight)
      setFillerCount(remainingRows > 0 ? remainingRows : 0)
    }

    // Initial measure after mount
    // Ensure layout has settled
    requestAnimationFrame(() => measureAndSet())

    // Observe size changes for both container and content
    const ro = new ResizeObserver(() => {
      measureAndSet()
    })
    // Observe both content and its scroll container
    try { ro.observe(content) } catch {}
    try {
      const scrollContainer = (container.closest('[data-pageshell-content]') as HTMLElement) || container.parentElement || container
      ro.observe(scrollContainer)
    } catch {}
    ro.observe(content)

    // Fallback on window resize
    const onResize = () => measureAndSet()
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      try { ro.disconnect() } catch {}
      window.removeEventListener('resize', onResize)
    }
  }, [autoPad, rowHeight, children])

  return (
    <div
      ref={containerRef}
      className={`ds-stack ${className}`}
      style={{ minHeight: autoPad ? '100%' as const : undefined, height: autoPad ? '100%' : undefined }}
      {...rest}
    >
      <div ref={contentRef} className="ds-stack">
        {children}
      </div>
      {autoPad && fillerCount > 0 && (
        <>
          {Array.from({ length: fillerCount }).map((_, i) => (
            <GridRow
              key={`filler-${i}`}
              maxWidth={fillerMaxWidth ?? 800}
              minHeight={rowHeight}
              separators={fillerSeparators}
            >
              <div />
            </GridRow>
          ))}
        </>
      )}
    </div>
  )
}



