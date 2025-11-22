import React from 'react';
import { GridRow } from '../design-system/components/GridRow';

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
    <GridRow showRails={viewMode === 'grid'} maxWidth={800} centerStyle={{ padding: '24px 16px' }}>
    <div
        style={{ width: '100%', background: 'var(--background-main)', cursor: 'pointer' }}
      onClick={() => onClick(id)}
    >
            <p 
              style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }} 
              className={expanded ? '' : 'line-clamp-2'}
            >
              {capitalizeText(content)}
            </p>
          </div>
    </GridRow>
  );
} 