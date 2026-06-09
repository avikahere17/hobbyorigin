import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatTicketPrice, currencySymbol } from '../utils/currency';

/**
 * Returns currency-aware formatting helpers bound to the current user's currency.
 * Falls back to GBP for unauthenticated users.
 */
export function useCurrency() {
  const { currentUser } = useAuth();
  const currency = currentUser?.currency || 'GBP';

  return {
    currency,
    format: (amount) => formatCurrency(amount, currency),
    formatCompact: (amount) => formatCurrency(amount, currency, { compact: true }),
    formatTicket: (amount, freeLabel = 'Free') => formatTicketPrice(amount, currency, freeLabel),
    symbol: currencySymbol(currency),
  };
}
