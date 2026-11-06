// Date helpers. Dates are plain "YYYY-MM-DD" strings (no time, no time zone),
// matching the Postgres `date` columns.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DEFAULT_TZ = "Asia/Muscat";

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function utc(iso: string) {
  const { y, m, d } = parts(iso);
  return Date.UTC(y, m - 1, d);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Today's date in the given IANA time zone, e.g. "2026-11-06". */
export function todayIn(tz: string = DEFAULT_TZ): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Current hour (0-23) in the given time zone. */
export function hourIn(tz: string = DEFAULT_TZ): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(
        new Date(),
      ),
    );
  } catch {
    return new Date().getUTCHours();
  }
}

export function isValidISO(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parts(value);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** Move a date forward by whole months, keeping the preferred day where the month allows. */
export function addMonths(iso: string, months: number, preferredDay?: number | null): string {
  const { y, m, d } = parts(iso);
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const day = Math.min(preferredDay || d, lastDay);
  return `${ny}-${pad(nm + 1)}-${pad(day)}`;
}

export function formatShort(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "8 Nov" this year; "8 Nov 2027" when the date falls in another year. */
export function formatDue(iso: string, today: string): string {
  return iso.slice(0, 4) === today.slice(0, 4) ? formatShort(iso) : formatLong(iso);
}

export function formatLong(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatToday(tz: string = DEFAULT_TZ): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
  } catch {
    return formatLong(todayIn(tz));
  }
}

/**
 * Friendly countdown. Bills: "2 days overdue", "Due today", "Due tomorrow", "Due in 5 days".
 * Documents: "Expired 2 days ago", "Expires today", "Expires tomorrow", "Expires in 5 days".
 */
export function relativeLabel(days: number, kind: "bill" | "document" = "bill"): string {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  // Far-off dates read better in months and years than in hundreds of days.
  const plural = (n: number) => {
    if (n < 60) return unit(n, "day");
    const months = Math.round(n / 30.44);
    if (months < 12) return unit(months, "month");
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m ? `${unit(y, "year")} ${unit(m, "month")}` : unit(y, "year");
  };
  if (kind === "document") {
    if (days < 0) return `Expired ${plural(-days)} ago`;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${plural(days)}`;
  }
  if (days < 0) return `${plural(-days)} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${plural(days)}`;
}
