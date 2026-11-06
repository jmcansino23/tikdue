import type { Viewport } from "next";
import Link from "next/link";
import { SignInButton } from "@/components/SignInButton";
import { SUPPORT_EMAIL } from "@/lib/site";

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
        <section className="lux-center">
          <div className="lux-brand">
            <img src="/icons/icon.svg" alt="" width={72} height={72} />
            <span className="lux-name">Tikdue</span>
            <span className="lux-tag">Bills · Documents</span>
          </div>

          <h1 className="lux-title">
            Tick every <em>due.</em>
          </h1>
          <p className="lux-sub">Bills, card dues and document expiries. Quietly remembered.</p>

          <div className="lux-cta">
            {error && <p className="lux-error">Sign-in didn&apos;t finish. Please try again.</p>}
            <SignInButton />
          </div>
        </section>

        <footer className="lux-foot">
          <span>Free to use · No passwords</span>
          <nav className="lux-links" aria-label="About Tikdue">
            <Link href="/privacy">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms">Terms</Link>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
