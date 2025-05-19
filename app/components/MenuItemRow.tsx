import React from 'react';
import { usePrice } from '../hooks/usePrice';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  dietary?: string[];
}

interface MenuItemRowProps {
  item: MenuItem;
  expanded: boolean;
  onClick: (id: string) => void;
  getDietaryIcons: (dietary: string[]) => React.ReactNode;
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
        <div style={{ flex: 1, maxWidth: 1024, borderBottom: '1px solid var(--border-main)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', height: 48, position: 'relative' }}>
          <div className="flex flex-col w-full px-3">
            <span className="font-mono font-bold" style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: '18px', marginBottom: 4 }}>{item.name}</span>
            {item.description && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                {item.description}
              </span>
            )}
            {item.dietary && item.dietary.length > 0 && (
              <div className="flex gap-1 mt-2">
                {getDietaryIcons(item.dietary)}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isLoading ? (
              <span className="font-mono text-[14px]" style={{ color: 'var(--text-secondary)' }}>...</span>
            ) : (
              <span className="font-mono text-[14px]" style={{ color: 'var(--text-primary)' }}>{formattedPrice}</span>
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