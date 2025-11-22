import React from 'react';

interface DetailRowProps {
  label: string;
  value: string;
  viewMode: 'grid' | 'list';
}

export function DetailRow({ label, value, viewMode }: DetailRowProps) {
  return (
    <div
      style={{ borderBottom: 'var(--border-hairline-solid)' }}
    >
      <div className="flex justify-center">
        <div
          style={{
            width: 32,
            borderRight: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
            background: 'var(--background-main)'
          }}
        />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '24px 16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, margin: 0 }}>
                  <span className='line-clamp-1'>{label}</span>
                </h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }}>{value}</p>
            </div>
          </div>
        </div>
        <div
          style={{
            width: 32,
            borderLeft: viewMode === 'grid' ? 'var(--border-hairline-solid)' : 'none',
            background: 'var(--background-main)'
          }}
        />
      </div>
    </div>
  );
} 