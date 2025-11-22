'use client'

import React from 'react'

export function HDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 'var(--border-hairline)',
        background: 'var(--border-main)',
        width: '100%',
        flexShrink: 0,
      }}
    />
  )
}


