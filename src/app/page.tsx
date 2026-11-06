import type { Viewport } from "next";
import { SignInButton } from "@/components/SignInButton";

export const viewport: Viewport = {
  themeColor: "#F6F3EC",
};

export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="lux">
      <div className="lux-inner">
        <header className="lux-top">
          <span className="lux-mark">Tikdue</span>
          <span className="lux-tag">Bills · Documents</span>
        </header>

        <section className="lux-hero">
          <p className="lux-eyebrow">For life in two homes</p>
          <h1 className="lux-title">
            Tick every <em>due.</em>
          </h1>
          <p className="lux-sub">
            Bills, card dues and document expiries, here and back home. Quietly remembered.
          </p>
        </section>

        <ol className="ledger" aria-label="Example reminders">
          <li className="ledger-row is-done">
            <span className="ledger-name">Credit card</span>
            <span className="ledger-leader" aria-hidden="true" />
            <span className="ledger-date">2 Nov</span>
            <span className="ledger-mark" aria-label="Paid">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M4.5 12.5l4.75 4.75L19.5 7" />
              </svg>
            </span>
          </li>
          <li className="ledger-row">
            <span className="ledger-name">Phone bill</span>
            <span className="ledger-leader" aria-hidden="true" />
            <span className="ledger-date">6 Nov</span>
            <span className="ledger-mark" aria-label="Upcoming">
              <span className="ledger-dot" />
            </span>
          </li>
          <li className="ledger-row">
            <span className="ledger-name">Residence card</span>
            <span className="ledger-leader" aria-hidden="true" />
            <span className="ledger-date">12 Dec</span>
            <span className="ledger-mark" aria-label="Upcoming">
              <span className="ledger-dot" />
            </span>
          </li>
        </ol>

        <footer className="lux-cta">
          {error && <p className="lux-error">Sign-in didn&apos;t finish. Please try again.</p>}
          <SignInButton />
          <p className="lux-fine">Free to use · No passwords</p>
        </footer>
      </div>
    </main>
  );
}
