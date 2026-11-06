import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removePushSubscription, savePushSubscription, setCurrencies } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { InstallBanner } from "@/components/InstallBanner";
import { RateCard } from "@/components/RateCard";
import { ItemCard, statusTone } from "@/components/ItemCard";
import { Reminders } from "@/components/Reminders";
import { DEFAULT_TZ, daysBetween, todayIn } from "@/lib/dates";
import { ITEM_COLUMNS, toItem, type Item } from "@/lib/items";
import { CURRENCIES } from "@/lib/money";
import { vapidPublicKey } from "@/lib/push";
import { getRate } from "@/lib/rates";
import { secret } from "@/lib/secrets";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; error?: string }>;
}) {
  const { f, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("time_zone, host_currency, home_currency")
    .maybeSingle();
  const tz = (profile?.time_zone as string | undefined) || DEFAULT_TZ;
  const today = todayIn(tz);

  const base = (profile?.host_currency as string | undefined) || "OMR";
  const quote = (profile?.home_currency as string | undefined) || (base === "USD" ? "OMR" : "USD");
  const rate = await getRate(base, quote);

  const { data: rows } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("paused", false)
    .not("next_due", "is", null)
    .order("next_due", { ascending: true });

  const all: Item[] = (rows ?? []).map((r) => toItem(r as Record<string, unknown>));
  const filter = f === "bills" ? "bill" : f === "documents" ? "document" : null;
  const shown = filter ? all.filter((i) => i.kind === filter) : all;

  const groups = { late: [] as Item[], soon: [] as Item[], later: [] as Item[] };
  for (const item of shown) groups[statusTone(daysBetween(today, item.next_due as string))].push(item);

  // Summary: bills due within a week, documents expiring within 30 days.
  let billsDue = 0;
  let billsLate = 0;
  let docsExpiring = 0;
  let docsExpired = 0;
  for (const item of all) {
    const d = daysBetween(today, item.next_due as string);
    if (item.kind === "bill" && d <= 7) {
      billsDue += 1;
      if (d < 0) billsLate += 1;
    } else if (item.kind === "document" && d <= 30) {
      docsExpiring += 1;
      if (d < 0) docsExpired += 1;
    }
  }

  const returnTo = f ? `/home?f=${f}` : "/home";

  const chips = [
    { label: "All", href: "/home", on: !filter },
    { label: "Bills", href: "/home?f=bills", on: filter === "bill" },
    { label: "Documents", href: "/home?f=documents", on: filter === "document" },
  ];

  const sections: { key: keyof typeof groups; title: string }[] = [
    { key: "late", title: "Needs attention" },
    { key: "soon", title: "This week" },
    { key: "later", title: "Coming up" },
  ];

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar
          right={
            <Link href="/settings" className="bar-icon" aria-label="Settings">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </Link>
          }
        />

        {error && <p className="notice notice-error">{error}</p>}

        <InstallBanner />
        <Reminders
          variant="banner"
          vapidKey={vapidPublicKey(secret("VAPID_PRIVATE_JWK"))}
          save={savePushSubscription}
          remove={removePushSubscription}
        />

        <h1 className="sr-only">Your dues</h1>

        <RateCard
          key={`${base}-${quote}`}
          base={base}
          quote={quote}
          rate={rate?.rate ?? null}
          updated={rate?.updated ?? null}
          currencies={CURRENCIES}
          action={setCurrencies}
        />

        {all.length > 0 && (
          <section className="tally" aria-label="Summary">
            <Link href="/home?f=bills" className={billsLate ? "tally-late" : undefined}>
              <span className="tally-num">{billsDue}</span>
              <span className="tally-label">Bills</span>
              <span className="tally-sub">
                {billsLate ? `${billsLate} overdue` : "due in 7 days"}
              </span>
            </Link>
            <Link href="/home?f=documents" className={docsExpired ? "tally-late" : undefined}>
              <span className="tally-num">{docsExpiring}</span>
              <span className="tally-label">Documents</span>
              <span className="tally-sub">
                {docsExpired ? `${docsExpired} expired` : "expiring in 30 days"}
              </span>
            </Link>
          </section>
        )}

        {all.length === 0 ? (
          <section className="empty">
            <h2 className="empty-title">
              Nothing due <em>yet.</em>
            </h2>
            <p>Add a bill or a document and Tikdue will keep watch over its date.</p>
            <Link href="/add" className="btn-ink">
              Add your first item
            </Link>
            <Link href="/add?kind=document" className="link-quiet">
              or start with a document
            </Link>
          </section>
        ) : (
          <>
            <nav className="chips" aria-label="Filter">
              {chips.map((c) => (
                <Link key={c.label} href={c.href} className="chip" aria-current={c.on ? "page" : undefined}>
                  {c.label}
                </Link>
              ))}
            </nav>

            {shown.length === 0 && (
              <p className="quiet-line">Nothing here yet.</p>
            )}

            {sections.map(({ key, title }) =>
              groups[key].length ? (
                <section key={key} className="group">
                  <h2 className={`group-title tone-${key}`}>{title}</h2>
                  <ul className="cards">
                    {groups[key].map((item) => (
                      <ItemCard key={item.id} item={item} today={today} returnTo={returnTo} />
                    ))}
                  </ul>
                </section>
              ) : null,
            )}

            <div className="fab-wrap">
              <Link href={filter === "document" ? "/add?kind=document" : "/add"} className="fab">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
