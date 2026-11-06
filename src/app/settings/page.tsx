import { redirect } from "next/navigation";
import { removePushSubscription, savePushSubscription, sendTestPush, setReminderTime } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { Reminders } from "@/components/Reminders";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { vapidPublicKey } from "@/lib/push";
import { secret } from "@/lib/secrets";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

function label(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${suffix}`;
}

export default async function Settings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("reminder_time, time_zone").maybeSingle();
  const current = ((profile?.reminder_time as string | undefined) ?? "08:00").slice(0, 5);
  const tz = (profile?.time_zone as string | undefined) ?? "Asia/Muscat";

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back="/home" title="Settings" />

        <section className="settings-block">
          <h2 className="eyebrow">Reminders</h2>
          <Reminders
            variant="full"
            vapidKey={vapidPublicKey(secret("VAPID_PRIVATE_JWK"))}
            save={savePushSubscription}
            remove={removePushSubscription}
            test={sendTestPush}
          />
          <p className="settings-hint">
            Bills: 3 days before, on the due day, and the day after if still unpaid. Documents: 60, 30 and 7
            days before expiry, and on the day.
          </p>
        </section>

        <section className="settings-block">
          <h2 className="eyebrow">Reminder time</h2>
          <form action={setReminderTime} className="settings-row">
            <label className="field">
              <span className="sr-only">Remind me at</span>
              <select name="reminder_time" defaultValue={current}>
                {HOURS.map((h) => {
                  const v = `${String(h).padStart(2, "0")}:00`;
                  return (
                    <option key={v} value={v}>
                      {label(h)}
                    </option>
                  );
                })}
              </select>
            </label>
            <button type="submit" className="btn-line">
              Save
            </button>
          </form>
          <p className="settings-hint">Time zone: {tz.replace("_", " ")}</p>
        </section>

        <section className="settings-block">
          <h2 className="eyebrow">Account</h2>
          <p className="settings-account">{user.email}</p>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}
