import React from 'react';
import { usePrice } from '../hooks/usePrice';
import { Currency } from '../context/CurrencyContext';
import { GridRow } from '../design-system/components/GridRow';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: Currency;
  category: string;
  dietaryRestrictions: string[];
}

interface MenuItemRowProps {
  item: MenuItem;
  expanded: boolean;
  onClick: (id: string) => void;
  getDietaryIcons: (item: MenuItem) => React.ReactNode;
  viewMode: 'grid' | 'list';
}

// Function to properly capitalize text
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split('. ')
    .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
    .join('. ');
};

export function MenuItemRow({ item, expanded, onClick, getDietaryIcons, viewMode }: MenuItemRowProps) {
  const { formattedPrice, isLoading } = usePrice(item.price, item.currency || 'EUR');
  return (
    <GridRow showRails={viewMode === 'grid'} maxWidth={800} centerStyle={{ padding: '24px 16px' }}>
    <div
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', background: 'var(--background-main)', cursor: 'pointer' }}
      onClick={() => onClick(item.id)}
    >
        <div style={{ flex: 1, minWidth: 0, background: 'var(--background-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, margin: 0 }}>
                  <span className={expanded ? '' : 'line-clamp-1'}>{capitalizeText(item.name)}</span>
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{getDietaryIcons(item)}</div>
              </div>
              {item.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }} className={expanded ? '' : 'line-clamp-2'}>{capitalizeText(item.description)}</p>
              )}
            </div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: 16, fontSize: 14, flex: 'none' }}>
              {isLoading ? '...' : formattedPrice}
            </span>
      </div>
    </GridRow>
  );
} 