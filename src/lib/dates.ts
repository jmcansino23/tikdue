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

/** Friendly countdown: "2 days overdue", "Today", "Tomorrow", "In 5 days". */
export function relativeLabel(days: number): string {
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
