import { Currency } from '../context/CurrencyContext';

export function convertPrice(
  price: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<Currency, number>
): number {
  if (fromCurrency === toCurrency) return price;
  
  // Convert to EUR first (our base currency)
  const priceInEUR = fromCurrency === 'EUR' 
    ? price 
    : price / exchangeRates[fromCurrency];
  
  // Then convert to target currency
  return toCurrency === 'EUR'
    ? priceInEUR
    : priceInEUR * exchangeRates[toCurrency];
}

export function formatPrice(price: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
} 