import Link from "next/link";
import { AppBar } from "@/components/AppBar";
import { LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

/** Shared frame for Privacy and Terms: calm, readable, public. */
export function LegalPage({ title, em, children }: { title: string; em: string; children: React.ReactNode }) {
  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back="/" title={`${title} ${em.replace(".", "")}`} />
        <h1 className="page-title">
          {title} <em>{em}</em>
        </h1>
        <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
        <article className="legal">{children}</article>
        <footer className="legal-foot">
          <Link href="/privacy">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">Terms</Link>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
        </footer>
      </div>
    </main>
  );
}
