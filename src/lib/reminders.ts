// The hourly reminder job (run by the Cloudflare cron trigger).
// For each person whose local time matches their reminder hour, it finds
// what is due and sends one notification to each of their devices.
//
// Relative imports only: this file is bundled into the scheduled worker.

import { DEFAULT_TZ, daysBetween, relativeLabel, todayIn } from "./dates";
import { isExpired, loadVapid, sendPush, type PushMessage } from "./push";

const SUPABASE_URL = "https://jwtdjgruigezzkbxwwjt.supabase.co";

// Days before the date when we remind (negative = after).
const BILL_DAYS = new Set([3, 0, -1]);
const DOCUMENT_DAYS = new Set([60, 30, 7, 0, -1]);

type Env = { SUPABASE_SECRET_KEY?: string; VAPID_PRIVATE_JWK?: string };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };
type Profile = { user_id: string; time_zone: string | null; reminder_time: string | null };
type DueItem = { id: string; user_id: string; kind: "bill" | "document"; name: string; next_due: string };

function localHour(tz: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(new Date()),
    );
  } catch {
    return new Date().getUTCHours();
  }
}

/** Items that should trigger a reminder today, for one person. */
export function remindersFor(items: DueItem[], today: string): { item: DueItem; days: number }[] {
  const out: { item: DueItem; days: number }[] = [];
  for (const item of items) {
    const days = daysBetween(today, item.next_due);
    const hit = item.kind === "bill" ? BILL_DAYS.has(days) : DOCUMENT_DAYS.has(days);
    if (hit) out.push({ item, days });
  }
  return out.sort((a, b) => a.days - b.days);
}

/** One calm notification per person, listing what needs attention. */
export function buildMessage(hits: { item: DueItem; days: number }[]): PushMessage {
  if (hits.length === 1) {
    const { item, days } = hits[0];
    return { title: item.name, body: relativeLabel(days, item.kind), url: `/items/${item.id}`, tag: "tikdue-daily" };
  }
  const lines = hits.slice(0, 3).map(({ item, days }) => `${item.name}: ${relativeLabel(days, item.kind).toLowerCase()}`);
  const more = hits.length > 3 ? ` +${hits.length - 3} more` : "";
  return { title: `${hits.length} reminders`, body: lines.join(" · ") + more, url: "/home", tag: "tikdue-daily" };
}

export async function runReminders(env: Env): Promise<{ sent: number; removed: number; skipped?: string }> {
  const secret = env.SUPABASE_SECRET_KEY;
  const vapid = await loadVapid(env.VAPID_PRIVATE_JWK);
  if (!secret || !vapid) return { sent: 0, removed: 0, skipped: "missing secrets" };

  const headers = { apikey: secret, Authorization: `Bearer ${secret}` };
  const get = async <T>(path: string): Promise<T[]> => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
    if (!res.ok) throw new Error(`Supabase ${res.status} on ${path.split("?")[0]}`);
    return (await res.json()) as T[];
  };

  const subs = await get<Sub>("push_subscriptions?select=id,user_id,endpoint,p256dh,auth");
  if (subs.length === 0) return { sent: 0, removed: 0 };

  const userIds = [...new Set(subs.map((s) => s.user_id))];
  const profiles = await get<Profile>(
    `profiles?select=user_id,time_zone,reminder_time&user_id=in.(${userIds.join(",")})`,
  );
  const profileOf = new Map(profiles.map((p) => [p.user_id, p]));

  // Only people whose reminder hour is now, in their own time zone.
  const dueUsers = userIds.filter((id) => {
    const p = profileOf.get(id);
    const tz = p?.time_zone || DEFAULT_TZ;
    const hour = Number((p?.reminder_time || "08:00").slice(0, 2));
    return localHour(tz) === hour;
  });
  if (dueUsers.length === 0) return { sent: 0, removed: 0 };

  const items = await get<DueItem>(
    `items?select=id,user_id,kind,name,next_due&paused=eq.false&next_due=not.is.null&user_id=in.(${dueUsers.join(",")})`,
  );

  let sent = 0;
  let removed = 0;
  for (const userId of dueUsers) {
    const tz = profileOf.get(userId)?.time_zone || DEFAULT_TZ;
    const hits = remindersFor(
      items.filter((i) => i.user_id === userId),
      todayIn(tz),
    );
    if (hits.length === 0) continue;

    const message = buildMessage(hits);
    for (const sub of subs.filter((s) => s.user_id === userId)) {
      const status = await sendPush(sub, message, vapid);
      if (status >= 200 && status < 300) sent += 1;
      else if (isExpired(status)) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`, { method: "DELETE", headers });
        removed += 1;
      }
    }
  }
  return { sent, removed };
}
