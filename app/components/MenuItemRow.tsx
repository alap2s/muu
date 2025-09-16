import React from 'react';
import { usePrice } from '../hooks/usePrice';
import { Currency } from '../context/CurrencyContext';
import { MenuItem } from '../types';

interface MenuItemRowProps {
  item: MenuItem;
  expanded: boolean;
  onClick: (id: string) => void;
  getDietaryIcons: (item: MenuItem) => React.ReactNode;
  viewMode: 'grid' | 'list';
  endContent?: React.ReactNode;
}

// Function to properly capitalize text
const capitalizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .split('. ')
    .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
    .join('. ');
};

export function MenuItemRow({ item, expanded, onClick, getDietaryIcons, viewMode, endContent }: MenuItemRowProps) {
  const { formattedPrice, isLoading } = usePrice(item.price, item.currency || 'EUR');
  return (
    <div
      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', background: 'var(--background-main)' }}
      onClick={() => onClick(item.id)}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '24px 16px', background: 'var(--background-main)' }}>
            <div style={{ flex: 1, background: 'var(--background-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, margin: 0 }}>
                  <span className={expanded ? '' : 'line-clamp-1'}>{capitalizeText(item.name)}</span>
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{getDietaryIcons(item)}</div>
              </div>
              {item.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }} className={expanded ? '' : 'line-clamp-2'}>
                  {typeof item.description === 'string' ? capitalizeText(item.description) : item.description}
                </p>
              )}
            </div>
            {endContent ? (
              <div style={{ marginLeft: 16 }}>{endContent}</div>
            ) : (
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: 16, fontSize: 14 }}>
                {isLoading ? '...' : formattedPrice}
              </span>
            )}
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