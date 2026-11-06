"use client";

import { useState } from "react";
import { decimalsFor } from "@/lib/money";

type Props = {
  base: string;
  quote: string;
  rate: number | null;
  updated: string | null;
  currencies: readonly string[];
  action: (formData: FormData) => Promise<void>;
};

function fmt(n: number, digits: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function fmtRate(n: number) {
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6 }).format(n);
}

function fmtUpdated(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function RateCard({ base, quote, rate, updated, currencies, action }: Props) {
  const [amount, setAmount] = useState("100");

  const value = Number(amount.replace(/,/g, ""));
  const converted = rate !== null && Number.isFinite(value) ? value * rate : null;

  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <section className="rate" aria-label="Exchange rate">
      <form action={action} className="rate-form">
        <div className="rate-head">
          <span className="eyebrow">Today&apos;s rate</span>
          {updated && <span className="rate-updated">Updated {fmtUpdated(updated)}</span>}
        </div>

        <div className="rate-line">
          {rate !== null ? (
            <p className="rate-big">
              1 {base} = {fmtRate(rate)} {quote}
            </p>
          ) : (
            <p className="rate-big rate-missing">Rate unavailable right now</p>
          )}
          <button type="submit" name="swap" value="1" className="rate-swap" aria-label="Swap currencies">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
            </svg>
          </button>
        </div>

        <div className="rate-calc">
          <label className="rate-box">
            <span className="sr-only">Amount in {base}</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label={`Amount in ${base}`}
            />
            <select name="base" defaultValue={base} onChange={submitOnChange} aria-label="From currency">
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <span className="rate-eq" aria-hidden="true">
            =
          </span>
          <div className="rate-box rate-result">
            <output aria-live="polite">
              {converted !== null ? fmt(converted, decimalsFor(quote)) : "—"}
            </output>
            <select name="quote" defaultValue={quote} onChange={submitOnChange} aria-label="To currency">
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="rate-note">
          Market rate; your exchange house may differ.{" "}
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">
            Rates By Exchange Rate API
          </a>
        </p>
      </form>
    </section>
  );
}
