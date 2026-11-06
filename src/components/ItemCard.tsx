import Link from "next/link";
import { markPaid } from "@/app/actions";
import { daysBetween, formatShort, relativeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Item } from "@/lib/items";

export function statusTone(days: number): "late" | "soon" | "later" {
  if (days < 0) return "late";
  if (days <= 7) return "soon";
  return "later";
}

export function ItemCard({ item, today, returnTo }: { item: Item; today: string; returnTo: string }) {
  const due = item.next_due as string;
  const days = daysBetween(today, due);
  const tone = statusTone(days);
  const isBill = item.kind === "bill";

  const meta = isBill
    ? [item.amount !== null && item.currency ? formatMoney(item.amount, item.currency) : null, `Due ${formatShort(due)}`]
    : [item.belongs_to && item.belongs_to !== "Me" ? item.belongs_to : null, `Expires ${formatShort(due)}`];

  return (
    <li className={`card tone-${tone}`}>
      <Link href={`/items/${item.id}`} className="card-main">
        <span className="card-name">
          {item.name}
          {isBill && item.country === "home" && <span className="card-flag">Home</span>}
        </span>
        <span className="card-meta">{meta.filter(Boolean).join(" · ")}</span>
        <span className="card-when">{relativeLabel(days)}</span>
      </Link>

      {isBill ? (
        <form action={markPaid}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="return" value={returnTo} />
          <button type="submit" className="card-action" aria-label={`Mark ${item.name} as paid`}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M4.5 12.5l4.75 4.75L19.5 7" />
            </svg>
            Paid
          </button>
        </form>
      ) : (
        <Link href={`/items/${item.id}#renew`} className="card-action" aria-label={`Renew ${item.name}`}>
          Renew
        </Link>
      )}
    </li>
  );
}
