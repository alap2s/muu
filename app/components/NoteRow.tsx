import React from 'react';

interface NoteRowProps {
  id: string;
  content: string;
  expanded: boolean;
  onClick: (id: string) => void;
  viewMode: 'grid' | 'list';
}

// Function to properly capitalize text (same as MenuItemRow)
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split('. ')
    .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
    .join('. ');
};

export function NoteRow({ id, content, expanded, onClick, viewMode }: NoteRowProps) {
  return (
    <div
      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', background: 'var(--background-main)' }}
      onClick={() => onClick(id)}
    >
      <div className="flex justify-center" style={{ background: 'var(--background-main)' }}>
        <div
          style={{
            width: 32,
            borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
            background: 'var(--background-main)'
          }}
        />
        <div style={{ flex: 1, maxWidth: 800, background: 'var(--background-main)' }}>
          <div style={{ padding: '24px 16px', background: 'var(--background-main)' }}>
            <p 
              style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }} 
              className={expanded ? '' : 'line-clamp-2'}
            >
              {capitalizeText(content)}
            </p>
          </div>
        </div>
        <div
          style={{
            width: 32,
            borderLeft: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
            background: 'var(--background-main)'
          }}
        />
      </div>
    </div>
  );
} 