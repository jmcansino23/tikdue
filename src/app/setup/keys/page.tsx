import { AppBar } from "@/components/AppBar";
import { KeyMaker } from "@/components/KeyMaker";
import { vapidPublicKey } from "@/lib/push";
import { secret } from "@/lib/secrets";

export const dynamic = "force-dynamic";

// One-time setup helper: creates the reminder signing key in YOUR browser.
// Nothing is sent to the server; you paste it into Cloudflare yourself.
export default function SetupKeys() {
  const alreadySet = Boolean(vapidPublicKey(secret("VAPID_PRIVATE_JWK")));

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back="/settings" title="Reminder key" />
        <h1 className="page-title">
          Reminder <em>key.</em>
        </h1>
        {alreadySet ? (
          <p className="quiet-line">
            The key is already set in Cloudflare. Don&apos;t create a new one: it would switch off reminders on
            every device that has them turned on.
          </p>
        ) : (
          <KeyMaker />
        )}
      </div>
    </main>
  );
}
