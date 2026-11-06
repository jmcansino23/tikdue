// Currencies offered in the app. Three-decimal currencies follow ISO 4217.
export const CURRENCIES = [
  "OMR",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "PHP",
  "INR",
  "PKR",
  "BDT",
  "LKR",
  "NPR",
  "EGP",
  "USD",
  "GBP",
  "EUR",
] as const;

const THREE_DECIMALS = new Set(["OMR", "KWD", "BHD"]);

export function decimalsFor(currency: string): number {
  return THREE_DECIMALS.has(currency) ? 3 : 2;
}

export function formatMoney(amount: number, currency: string): string {
  const digits = decimalsFor(currency);
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return `${currency} ${n}`;
}
