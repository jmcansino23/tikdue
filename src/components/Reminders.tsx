"use client";

import { useEffect, useState } from "react";

type Result = { ok: boolean; message?: string };

type Props = {
  vapidKey: string | null;
  save: (sub: { endpoint: string; p256dh: string; auth: string }) => Promise<{ ok: boolean }>;
  remove: (endpoint: string) => Promise<{ ok: boolean }>;
  test?: () => Promise<Result>;
  /** "banner" = slim prompt on Home (hidden once on); "full" = Settings control. */
  variant: "banner" | "full";
};

type State = "loading" | "unsupported" | "install" | "denied" | "off" | "on" | "missing-key";

function keyToBytes(base64url: string) {
  const b64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((base64url.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function Reminders({ vapidKey, save, remove, test, variant }: Props) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!vapidKey) return setState("missing-key");
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return setState(isIOS() && !isInstalled() ? "install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [vapidKey]);

  async function turnOn() {
    if (!vapidKey) return;
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidKey) }));
      const json = sub.toJSON();
      const res = await save({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (!res.ok) throw new Error("save failed");
      setState("on");
    } catch {
      setNote("Couldn't turn on reminders. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await remove(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!test) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await test();
      setNote(res.message ?? (res.ok ? "Sent." : "Couldn't send."));
    } finally {
      setBusy(false);
    }
  }

  if (variant === "banner") {
    // The Home Screen step has its own banner (InstallBanner); this one only offers reminders.
    if (state !== "off") return null;
    return (
      <section className="remind-banner">
        <div>
          <strong>Get reminders</strong>
          <span>A gentle nudge before each due date.</span>
        </div>
        <button type="button" className="card-action" onClick={turnOn} disabled={busy}>
          {busy ? "…" : "Turn on"}
        </button>
      </section>
    );
  }

  const messages: Record<State, string> = {
    loading: "Checking this device…",
    unsupported: "This browser can't show reminders. Try Chrome on Android, or Safari on iPhone with Tikdue added to the Home Screen.",
    install: "On iPhone, first add Tikdue to your Home Screen: tap Share, then Add to Home Screen. Open it from there and turn reminders on.",
    denied: "Notifications are blocked for Tikdue. Allow them in your browser or phone settings, then come back.",
    off: "Reminders are off on this device.",
    on: "Reminders are on for this device.",
    "missing-key": "Reminders are being set up. Check back shortly.",
  };

  return (
    <div className="remind-full">
      <p className="remind-status">
        <span className={`dot ${state === "on" ? "dot-on" : ""}`} aria-hidden="true" />
        {messages[state]}
      </p>
      <div className="remind-actions">
        {state === "off" && (
          <button type="button" className="btn-ink" onClick={turnOn} disabled={busy}>
            {busy ? "Turning on…" : "Turn on reminders"}
          </button>
        )}
        {state === "on" && (
          <>
            {test && (
              <button type="button" className="btn-ink" onClick={sendTest} disabled={busy}>
                {busy ? "Sending…" : "Send a test notification"}
              </button>
            )}
            <button type="button" className="link-quiet" onClick={turnOff} disabled={busy}>
              Turn off on this device
            </button>
          </>
        )}
      </div>
      {note && <p className="remind-note">{note}</p>}
    </div>
  );
}
