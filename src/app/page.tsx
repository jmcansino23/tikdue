import { SignInButton } from "@/components/SignInButton";
import {
  CardIcon,
  DocIcon,
  GlobeIcon,
  IdCardIcon,
  PhoneIcon,
  TapIcon,
} from "@/components/Icons";

export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="welcome">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="wordmark">
          <img src="/icons/icon.svg" alt="" width={36} height={36} />
          <span>Tikdue</span>
        </div>

        <h1 className="tagline">
          Tick every <span className="tagline-accent">due.</span>
        </h1>
        <p className="hero-sub">Bills and document expiries, here and back home, in one calm list.</p>

        <div className="preview" aria-label="Example reminders">
          <div className="pcard pcard-1">
            <span className="pcard-icon tone-red">
              <CardIcon />
            </span>
            <span className="pcard-text">
              <strong>Credit card</strong>
              <small>OMR 120.000</small>
            </span>
            <span className="pill pill-red">2 days late</span>
          </div>
          <div className="pcard pcard-2">
            <span className="pcard-icon tone-amber">
              <PhoneIcon />
            </span>
            <span className="pcard-text">
              <strong>Phone bill</strong>
              <small>OMR 18.500</small>
            </span>
            <span className="pill pill-amber">In 2 days</span>
          </div>
          <div className="pcard pcard-3">
            <span className="pcard-icon tone-teal">
              <DocIcon />
            </span>
            <span className="pcard-text">
              <strong>Residence card</strong>
              <small>Expires 12 Dec</small>
            </span>
            <span className="pill pill-teal">38 days</span>
          </div>
        </div>
      </section>

      <section className="sheet">
        <ul className="features">
          <li>
            <span className="feat-icon">
              <GlobeIcon />
            </span>
            <span>Two homes</span>
          </li>
          <li>
            <span className="feat-icon">
              <IdCardIcon />
            </span>
            <span>Family docs</span>
          </li>
          <li>
            <span className="feat-icon">
              <TapIcon />
            </span>
            <span>One-tap paid</span>
          </li>
        </ul>

        {error && <p className="error">Sign-in didn&apos;t finish. Please try again.</p>}
        <SignInButton />
        <p className="fine">Free to use · No passwords</p>
      </section>
    </main>
  );
}
