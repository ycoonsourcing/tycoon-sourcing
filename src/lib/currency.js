// Currency context and utilities for AUD / LKR / USD
export const CURRENCIES = {
  AUD: { symbol: 'AUD', flag: '🇦🇺', label: 'Australian Dollar', locale: 'en-AU' },
  LKR: { symbol: 'LKR', flag: '🇱🇰', label: 'Sri Lankan Rupee', locale: 'si-LK' },
  USD: { symbol: 'USD', flag: '🇺🇸', label: 'US Dollar', locale: 'en-US' },
};

// Fallback rates (AUD base). Updated periodically.
export const FALLBACK_RATES = { AUD: 1, LKR: 200, USD: 0.64 };

export function convertAUD(amountAUD, toCurrency, rates = FALLBACK_RATES) {
  return amountAUD * (rates[toCurrency] || FALLBACK_RATES[toCurrency]);
}

export function formatCurrency(amount, currency, rates = FALLBACK_RATES) {
  const converted = convertAUD(amount, currency, rates);
  const decimals = currency === 'LKR' ? 0 : 2;
  return `${CURRENCIES[currency].symbol} ${converted.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
