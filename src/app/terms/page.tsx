import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms · Tikdue" };

export default function Terms() {
  return (
    <LegalPage title="Terms of" em="use.">
      <p className="legal-lead">
        By using Tikdue you agree to these terms. They&apos;re short, and written to be read.
      </p>

      <h2>Tikdue is in beta</h2>
      <p>
        Tikdue is free while it&apos;s in beta. Features may change, and things may occasionally not work as
        expected. If paid features are added later, you&apos;ll be told clearly beforehand, and nothing will be
        charged without your agreement.
      </p>

      <h2>Reminders are a helping hand</h2>
      <p>
        Tikdue reminds you, but you stay responsible for paying your bills and renewing your documents on
        time. Notifications can be delayed or missed, for example if your phone is off, notifications are
        blocked, or a service is down. Please check official due dates with your bank, provider or the issuing
        authority.
      </p>

      <h2>Exchange rates are indicative</h2>
      <p>
        The daily rate shown is a market rate for guidance only. Your bank or exchange house will use its own
        rate and fees.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Keep your Google account secure; it is the key to your Tikdue account.</li>
        <li>Use Tikdue for your own personal records, and don&apos;t try to access anyone else&apos;s.</li>
        <li>Don&apos;t misuse the service, overload it, or use it for anything unlawful.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        What you add stays yours. How we handle it is explained in the{" "}
        <Link href="/privacy">Privacy policy</Link>.
      </p>

      <h2>No guarantees</h2>
      <p>
        Tikdue is provided &ldquo;as is&rdquo;. As far as the law allows, we aren&apos;t liable for late fees,
        penalties, expired documents or other losses from a missed or late reminder, or from relying on an
        exchange rate shown in the app.
      </p>

      <h2>Ending use</h2>
      <p>
        You can stop using Tikdue at any time and ask us to delete your account. We may suspend accounts that
        misuse the service.
      </p>

      <h2>Changes</h2>
      <p>If these terms change, we&apos;ll update the date above and let you know in the app.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
