import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppBar } from "@/components/AppBar";
import { ItemCard, statusTone } from "@/components/ItemCard";
import { SignOutButton } from "@/components/SignOutButton";
import { DEFAULT_TZ, daysBetween, formatToday, hourIn, todayIn } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ITEM_COLUMNS, toItem, type Item } from "@/lib/items";

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

  const { data: profile } = await supabase.from("profiles").select("time_zone").maybeSingle();
  const tz = (profile?.time_zone as string | undefined) || DEFAULT_TZ;
  const today = todayIn(tz);

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

  // Bills still to pay this month (including anything overdue), per currency.
  const monthEnd = `${today.slice(0, 7)}-31`;
  const totals = new Map<string, number>();
  for (const item of all) {
    if (item.kind !== "bill" || item.amount === null || !item.currency) continue;
    if ((item.next_due as string) > monthEnd) continue;
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amount);
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
    { key: "late", title: "Overdue" },
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

        {all.length > 0 && (
          <section className="tally" aria-label="Summary">
            <div className={groups.late.length ? "tally-late" : undefined}>
              <span className="tally-num">{groups.late.length}</span>
              <span className="tally-label">Overdue</span>
            </div>
            <div>
              <span className="tally-num">{groups.soon.length}</span>
              <span className="tally-label">This week</span>
            </div>
            <div>
              <span className="tally-num">{groups.later.length}</span>
              <span className="tally-label">Coming up</span>
            </div>
          </section>
        )}

        {totals.size > 0 && (
          <p className="to-pay">
            <span className="eyebrow">To pay this month</span>
            <span className="to-pay-amounts">
              {[...totals.entries()].map(([cur, amt]) => formatMoney(amt, cur)).join("  ·  ")}
            </span>
          </p>
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
