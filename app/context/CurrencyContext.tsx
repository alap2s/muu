'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'USD';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  exchangeRates: Record<Currency, number> | null;
  isLoading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('EUR');
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    // Fetch exchange rates
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();
        setExchangeRates(data.rates);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  useEffect(() => {
    // Save currency preference
    localStorage.setItem('currency', selectedCurrency);
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, exchangeRates, isLoading, error }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 