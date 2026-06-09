import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enGB from './en-GB';
import enUS from './en-US';
import enIN from './en-IN';
import hiIN from './hi-IN';

export const SUPPORTED_LOCALES = [
  { code: 'en-GB', label: 'English (UK)',     flag: '🇬🇧', currency: 'GBP' },
  { code: 'en-US', label: 'English (US)',     flag: '🇺🇸', currency: 'USD' },
  { code: 'en-IN', label: 'English (India)',  flag: '🇮🇳', currency: 'INR' },
  { code: 'hi-IN', label: 'हिन्दी (भारत)',     flag: '🇮🇳', currency: 'INR' },
];

export const CURRENCIES = {
  GBP: { symbol: '£', name: 'British Pound',  locale: 'en-GB', flag: '🇬🇧' },
  USD: { symbol: '$', name: 'US Dollar',      locale: 'en-US', flag: '🇺🇸' },
  INR: { symbol: '₹', name: 'Indian Rupee',   locale: 'en-IN', flag: '🇮🇳' },
};

export const COUNTRY_PRESETS = {
  GB: { country: 'United Kingdom', currency: 'GBP', locale: 'en-GB', language: 'en', flag: '🇬🇧',
        cityPlaceholder: 'e.g. London, Manchester', buildingPlaceholder: 'e.g. Elm Court', postcode: 'Postcode' },
  US: { country: 'United States',  currency: 'USD', locale: 'en-US', language: 'en', flag: '🇺🇸',
        cityPlaceholder: 'e.g. New York, Chicago',   buildingPlaceholder: 'e.g. Riverside Apts', postcode: 'ZIP Code' },
  IN: { country: 'India',          currency: 'INR', locale: 'en-IN', language: 'en', flag: '🇮🇳',
        cityPlaceholder: 'e.g. Mumbai, Delhi',        buildingPlaceholder: 'e.g. Shree Krishna Society', postcode: 'PIN Code' },
};

// Detect locale from browser or default to en-GB
function detectLocale() {
  const nav = navigator.language || 'en-GB';
  if (nav.startsWith('hi')) return 'hi-IN';
  if (nav.startsWith('en-US')) return 'en-US';
  if (nav.startsWith('en-IN')) return 'en-IN';
  return 'en-GB';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-GB': enGB,
      'en-US': enUS,
      'en-IN': enIN,
      'hi-IN': hiIN,
    },
    lng: detectLocale(),
    fallbackLng: 'en-GB',
    interpolation: { escapeValue: false },
  });

export default i18n;
