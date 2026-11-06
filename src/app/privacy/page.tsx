import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy · Tikdue" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" em="policy.">
      <p className="legal-lead">
        Tikdue keeps track of your bills and document expiry dates so it can remind you. We collect only what
        that needs, we don&apos;t show ads, and we never sell your data.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your Google account basics:</strong> your email address and name, used to sign you in. We
          never see your Google password.
        </li>
        <li>
          <strong>What you add:</strong> bill and document names, labels, amounts, currencies, due and expiry
          dates, notes, and the payments you mark as paid.
        </li>
        <li>
          <strong>Your settings:</strong> time zone, reminder time and preferred currencies.
        </li>
        <li>
          <strong>Reminder details:</strong> if you turn reminders on, a technical address from your browser
          or phone that lets us deliver notifications to that device.
        </li>
      </ul>
      <p>
        Please don&apos;t enter full card numbers, bank account numbers, passwords or ID numbers. Tikdue
        doesn&apos;t need them, and a name like &ldquo;Credit card · Amex&rdquo; is enough.
      </p>

      <h2>How we use it</h2>
      <p>
        Only to run Tikdue: showing your list, working out what is due, and sending your reminders. We
        don&apos;t use your data for advertising, and we don&apos;t build profiles about you.
      </p>

      <h2>Who helps us run Tikdue</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores your data in a secured database in Mumbai, India. Each account can
          only read its own records.
        </li>
        <li>
          <strong>Cloudflare</strong> hosts the app and runs the reminder schedule.
        </li>
        <li>
          <strong>Google</strong> handles sign-in.
        </li>
        <li>
          <strong>Apple, Google or Mozilla</strong> deliver notifications to your device, depending on which
          phone or browser you use. They receive the reminder text, encrypted on the way.
        </li>
        <li>
          <strong>ExchangeRate-API</strong> provides daily currency rates. No personal data is sent to them.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in. No tracking or advertising cookies.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        Your data stays while your account is active. You can delete any bill or document at any time. To
        delete your whole account and everything in it, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20Tikdue%20account`}>{SUPPORT_EMAIL}</a> from
        the address you sign in with, and we&apos;ll remove it within 30 days.
      </p>

      <h2>Your choices</h2>
      <p>
        You can turn reminders off on any device in Settings, and ask us for a copy of your data or to correct
        it by emailing us.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes in a meaningful way, we&apos;ll update the date above and let you know in the
        app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your privacy: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
