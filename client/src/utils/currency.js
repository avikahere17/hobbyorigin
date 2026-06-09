import { CURRENCIES } from '../i18n';

/**
 * Format an integer amount (in minor units or whole) to a localised currency string.
 * Tips/coins are stored as whole integers (e.g. 10 = £10 / $10 / ₹100).
 * For INR, divide by 1 (we treat coins as rupees directly).
 */
export function formatCurrency(amount, currency = 'GBP', opts = {}) {
  const cur = CURRENCIES[currency] || CURRENCIES.GBP;
  const { compact = false } = opts;

  try {
    if (compact && amount >= 1000) {
      const val = amount >= 100000
        ? (amount / 100000).toFixed(1) + (currency === 'INR' ? 'L' : 'K')  // lakh for INR
        : (amount / 1000).toFixed(1) + 'K';
      return cur.symbol + val;
    }
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur.symbol}${amount}`;
  }
}

/**
 * Get just the currency symbol for a currency code.
 */
export function currencySymbol(currency = 'GBP') {
  return (CURRENCIES[currency] || CURRENCIES.GBP).symbol;
}

/**
 * Format a ticket price — shows "Free" when 0.
 */
export function formatTicketPrice(amount, currency = 'GBP', freeLabel = 'Free') {
  if (!amount || amount === 0) return freeLabel;
  return formatCurrency(amount, currency);
}

/**
 * Approximate conversion rates (for display only, not for financial transactions).
 * Real app would use a live FX API.
 */
const FX_RATES = { GBP: 1, USD: 1.27, INR: 105.8 };

export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  const inGBP = amount / (FX_RATES[fromCurrency] || 1);
  return Math.round(inGBP * (FX_RATES[toCurrency] || 1));
}

/**
 * Get display info for a currency code.
 */
export function getCurrencyInfo(currency) {
  return CURRENCIES[currency] || CURRENCIES.GBP;
}

export const CURRENCY_OPTIONS = [
  { value: 'GBP', label: '🇬🇧 British Pound (£)', symbol: '£' },
  { value: 'USD', label: '🇺🇸 US Dollar ($)',     symbol: '$' },
  { value: 'INR', label: '🇮🇳 Indian Rupee (₹)',  symbol: '₹' },
];
