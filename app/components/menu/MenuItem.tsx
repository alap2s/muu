import { usePrice } from '../../hooks/usePrice';

interface MenuItemProps {
  name: string;
  description?: string;
  price: number;
  currency: 'EUR' | 'USD';
}

export function MenuItem({ name, description, price, currency, ...props }: MenuItemProps) {
  const { formattedPrice, isLoading } = usePrice(price, currency);

  return (
    <div className="flex justify-between items-start py-4 border-b border-border-main dark:border-dark-border-main">
      <div className="flex-1">
        <h3 className="text-lg font-medium">{name}</h3>
        {description && (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="ml-4 text-right">
        {isLoading ? (
          <span className="text-sm text-text-secondary dark:text-dark-text-secondary">...</span>
        ) : (
          <span className="font-medium">{formattedPrice}</span>
        )}
      </div>
    </div>
  );
} 