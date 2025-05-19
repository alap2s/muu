import { useCurrency } from '../context/CurrencyContext';
import { convertPrice, formatPrice } from '../utils/currency';
import { Currency } from '../context/CurrencyContext';

export function usePrice(price: number, originalCurrency: Currency) {
  const { selectedCurrency, exchangeRates, isLoading, error } = useCurrency();

  const convertedPrice = exchangeRates
    ? convertPrice(price, originalCurrency, selectedCurrency, exchangeRates)
    : price;

  const formattedPrice = formatPrice(convertedPrice, selectedCurrency);

  return {
    price: convertedPrice,
    formattedPrice,
    isLoading,
    error
  };
} 