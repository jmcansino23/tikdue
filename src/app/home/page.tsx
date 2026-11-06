import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setCurrencies } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { RateCard } from "@/components/RateCard";
import { ItemCard, statusTone } from "@/components/ItemCard";
import { SignOutButton } from "@/components/SignOutButton";
import { DEFAULT_TZ, daysBetween, formatToday, hourIn, todayIn } from "@/lib/dates";
import { ITEM_COLUMNS, toItem, type Item } from "@/lib/items";
import { CURRENCIES } from "@/lib/money";
import { getRate } from "@/lib/rates";

const TITLES = new Set(["dr", "mr", "mrs", "ms", "miss", "eng", "engr", "prof", "sir"]);

function firstName(full: string | undefined): string | null {
  const words = (full ?? "").split(/\s+/).filter(Boolean);
  return words.find((w) => !TITLES.has(w.replace(/\./g, "").toLowerCase())) ?? null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; added?: string; error?: string }>;
}) {
  const { f, added, error } = await searchParams;
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

  const hour = hourIn(tz);
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = firstName(user.user_metadata?.full_name as string | undefined);
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
        <AppBar right={<SignOutButton />} />

        {added && <p className="notice">Added {added}.</p>}
        {error && <p className="notice notice-error">{error}</p>}

        <section className="greet">
          <p className="eyebrow">{formatToday(tz)}</p>
          <h1 className="greet-title">
            {hello}
            {name ? `, ${name}` : ""}.
          </h1>
        </section>

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
              <span className="tally-label">Bills due</span>
              <span className="tally-sub">
                {billsLate ? `${billsLate} overdue` : "within 7 days"}
              </span>
            </Link>
            <Link href="/home?f=documents" className={docsExpired ? "tally-late" : undefined}>
              <span className="tally-num">{docsExpiring}</span>
              <span className="tally-label">Documents expiring</span>
              <span className="tally-sub">
                {docsExpired ? `${docsExpired} expired` : "within 30 days"}
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
