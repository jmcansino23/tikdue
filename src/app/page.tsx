import { SignInButton } from "@/components/SignInButton";

export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="shell">
      <img className="logo" src="/icons/icon.svg" alt="" />
      <div className="brand">Tikdue</div>
      <h1>Never miss a bill or expiry, here or back home.</h1>

      <ul className="benefits">
        <li>
          <strong>Bills in two countries</strong>
          <span>Local bills, card dues and home-country payments in one list.</span>
        </li>
        <li>
          <strong>Document expiries</strong>
          <span>Visa, residence card, passport, car and insurance, for the whole family.</span>
        </li>
        <li>
          <strong>One tap to mark paid</strong>
          <span>Reminders before every due date, then it rolls to next month.</span>
        </li>
      </ul>

      <div className="spacer" />

      {error && <p className="error">Sign-in didn&apos;t finish. Please try again.</p>}
      <SignInButton />
      <p className="fine">No passwords. Free to use.</p>
    </main>
  );
}
