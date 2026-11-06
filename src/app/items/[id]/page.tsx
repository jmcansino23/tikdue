import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteItem, markPaid, renewDocument } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { statusTone } from "@/components/ItemCard";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, daysBetween, formatLong, relativeLabel, todayIn } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ITEM_COLUMNS, REPEAT_LABELS, toItem, type Payment } from "@/lib/items";

export default async function ItemDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirm?: string; error?: string; renewed?: string }>;
}) {
  const { id } = await params;
  const { confirm, error, renewed } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = toItem(data as Record<string, unknown>);

  const { data: profile } = await supabase.from("profiles").select("time_zone").maybeSingle();
  const today = todayIn((profile?.time_zone as string | undefined) || DEFAULT_TZ);

  const { data: payRows } = await supabase
    .from("payments")
    .select("id, due_date, paid_on, amount")
    .eq("item_id", id)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);
  const payments = (payRows ?? []) as Payment[];

  const isBill = item.kind === "bill";
  const days = item.next_due ? daysBetween(today, item.next_due) : null;
  const tone = days === null ? "later" : statusTone(days);

  const rows: [string, string][] = isBill
    ? [
        ["Category", item.category ?? "Other"],
        ["Country", item.country === "home" ? "Back home" : "Where I live"],
        ["Repeats", REPEAT_LABELS[item.repeat]],
      ]
    : [["Whose", item.belongs_to ?? "Me"]];
  if (item.notes) rows.push(["Notes", item.notes]);

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar
          back="/home"
          right={
            <Link href={`/items/${id}/edit`} className="link-quiet">
              Edit
            </Link>
          }
        />

        {renewed && <p className="notice">Renewed. The new expiry date is saved.</p>}
        {error && <p className="notice notice-error">{error}</p>}

        <section className="detail-head">
          <p className="eyebrow">{isBill ? "Bill" : "Document"}</p>
          <h1 className="page-title">{item.name}</h1>
          {isBill && item.amount !== null && item.currency && (
            <p className="detail-amount">{formatMoney(item.amount, item.currency)}</p>
          )}
          {item.next_due ? (
            <p className="detail-due">
              {isBill ? "Next due" : "Expires"} {formatLong(item.next_due)}
              <span className={`badge tone-${tone}`}>{relativeLabel(days as number)}</span>
            </p>
          ) : (
            <p className="detail-due">Paid in full. Nothing more due.</p>
          )}
        </section>

        {isBill && item.next_due && (
          <form action={markPaid}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="return" value={`/items/${item.id}`} />
            <button type="submit" className="btn-ink">
              Mark as paid
            </button>
          </form>
        )}

        {!isBill && (
          <form action={renewDocument} className="renew" id="renew">
            <input type="hidden" name="id" value={item.id} />
            <label className="field">
              <span className="field-label">Renewed? Enter the new expiry date</span>
              <input type="date" name="new_expiry" required min={today} />
            </label>
            <button type="submit" className="btn-ink">
              Save renewal
            </button>
          </form>
        )}

        <dl className="facts">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <section className="history">
          <h2 className="eyebrow">{isBill ? "Payment history" : "Renewal history"}</h2>
          {payments.length === 0 ? (
            <p className="quiet-line">{isBill ? "No payments recorded yet." : "No renewals recorded yet."}</p>
          ) : (
            <ul>
              {payments.map((p) => (
                <li key={p.id}>
                  <span>{p.due_date ? `${isBill ? "Due" : "Expired"} ${formatLong(p.due_date)}` : "—"}</span>
                  <span className="history-paid">
                    {isBill ? "Paid" : "Renewed"} {formatLong(p.paid_on)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="danger">
          {confirm === "delete" ? (
            <form action={deleteItem} className="danger-confirm">
              <input type="hidden" name="id" value={item.id} />
              <p>Delete {item.name} and its history? This can&apos;t be undone.</p>
              <div className="danger-actions">
                <Link href={`/items/${item.id}`} className="btn-line">
                  Keep it
                </Link>
                <button type="submit" className="btn-danger">
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <Link href={`/items/${item.id}?confirm=delete`} className="link-danger">
              Delete this {isBill ? "bill" : "document"}
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
