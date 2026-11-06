// Daily market exchange rates from ExchangeRate-API's open access endpoint.
// Free, no key; attribution is shown next to the rate. Responses are cached
// at Cloudflare for an hour, so the app asks at most once an hour per currency.

export type Rate = {
  base: string;
  quote: string;
  rate: number;
  updated: string | null; // ISO timestamp of the provider's last update
};

type Payload = {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_unix?: number;
};

export async function getRate(base: string, quote: string): Promise<Rate | null> {
  if (base === quote) return { base, quote, rate: 1, updated: null };
  try {
    const init = { cf: { cacheTtl: 3600, cacheEverything: true } } as RequestInit;
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, init);
    if (!res.ok) return null;
    const data = (await res.json()) as Payload;
    const rate = data.rates?.[quote];
    if (data.result !== "success" || typeof rate !== "number") return null;
    return {
      base,
      quote,
      rate,
      updated: data.time_last_update_unix
        ? new Date(data.time_last_update_unix * 1000).toISOString()
        : null,
    };
  } catch {
    return null;
  }
}
