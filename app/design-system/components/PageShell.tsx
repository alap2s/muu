'use client'

import React, { ReactNode } from 'react'
import { PageContentStack } from './PageContentStack'
import { HDivider } from './HDivider'

interface PageShellProps {
  header?: ReactNode
  bottomBar?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

// CSS Grid-based page shell: header (auto) | content (1fr, scrollable) | footer (auto)
export function PageShell({
  header,
  bottomBar,
  children,
  className = '',
  contentClassName = '',
}: PageShellProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        height: '100svh',
        background: 'var(--background-main)',
      }}
    >
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {header ? (
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--background-main)' }}>
            <PageContentStack>
              {header}
            </PageContentStack>
            <HDivider />
          </div>
        ) : null}
      </div>
      <div
        className={contentClassName}
        style={{
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {children}
      </div>
      <HDivider />
      {bottomBar ? (
        <div style={{ position: 'sticky', bottom: 0, zIndex: 50, background: 'var(--background-main)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <PageContentStack>
            {bottomBar}
          </PageContentStack>
        </div>
      ) : null}
    </div>
  )
}



