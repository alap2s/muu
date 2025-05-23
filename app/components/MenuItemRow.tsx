import React from 'react';
import { usePrice } from '../hooks/usePrice';
import { Currency } from '../context/CurrencyContext';

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

export function MenuItemRow({ item, expanded, onClick, getDietaryIcons, viewMode }: MenuItemRowProps) {
  const { formattedPrice, isLoading } = usePrice(item.price, item.currency || 'EUR');
  return (
    <div
      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
      onClick={() => onClick(item.id)}
    >
      <div className="flex justify-center">
        <div
          style={{
            width: 32,
            borderRight: viewMode === 'grid' ? '1px solid var(--border-main)' : 'none',
            background: 'var(--background-main)'
          }}
        />
        <div style={{ flex: 1, maxWidth: 1024, background: 'var(--background-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '24px 16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>
                  <span className={expanded ? '' : 'line-clamp-1'}>{item.name}</span>
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{getDietaryIcons(item)}</div>
              </div>
              {item.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2, marginBottom: 0 }} className={expanded ? '' : 'line-clamp-2'}>{item.description}</p>
              )}
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: 16, fontSize: 14 }}>
              {isLoading ? '...' : formattedPrice}
            </span>
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