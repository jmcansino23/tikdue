"use client";

import { useEffect, useRef, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Mode = "hidden" | "prompt" | "ios-safari" | "ios-chrome" | "android";

const DISMISS_KEY = "tikdue-install-dismissed";

function installed() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="install-icon">
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" />
    </svg>
  );
}

/** One clear button to put Tikdue on the Home Screen. Hidden once installed or dismissed. */
export function InstallBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  const deferred = useRef<PromptEvent | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (installed()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}

    if (isIOS()) {
      setMode(/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent) ? "ios-chrome" : "ios-safari");
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as PromptEvent;
      setMode("prompt");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Android browsers that never offer the one-tap prompt still get the guide.
    const fallback = window.setTimeout(() => {
      if (!deferred.current && /Android/.test(navigator.userAgent)) setMode("android");
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(fallback);
    };
  }, []);

  async function install() {
    if (mode === "prompt" && deferred.current) {
      await deferred.current.prompt();
      const { outcome } = await deferred.current.userChoice;
      deferred.current = null;
      if (outcome === "accepted") setMode("hidden");
      return;
    }
    sheet.current?.showModal();
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <>
      <section className="remind-banner install-banner">
        <div>
          <strong>Add Tikdue to your Home Screen</strong>
          <span>Opens like an app, and lets reminders reach your phone.</span>
          <button type="button" className="install-later" onClick={dismiss}>
            Not now
          </button>
        </div>
        <button type="button" className="card-action install-go" onClick={install}>
          {mode === "prompt" ? "Install" : "Show me"}
        </button>
      </section>

      <dialog ref={sheet} className="install-sheet" onClick={(e) => e.target === sheet.current && sheet.current?.close()}>
        <div className="install-sheet-inner">
          <h2>
            Add to <em>Home Screen.</em>
          </h2>
          <ol>
            {mode === "ios-safari" && (
              <>
                <li>
                  Tap <ShareIcon /> <strong>Share</strong>. On newer iPhones, tap <strong>⋯</strong> or{" "}
                  <strong>≡</strong> at the bottom first.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong> (under <em>View More</em> if needed).
                </li>
                <li>
                  Tap <strong>Add</strong>, then open Tikdue from your Home Screen.
                </li>
              </>
            )}
            {mode === "ios-chrome" && (
              <>
                <li>
                  Tap <ShareIcon /> <strong>Share</strong> in the address bar (or <strong>⋯</strong> then Share).
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong>. If it&apos;s missing, open tikdue.app in <strong>Safari</strong> instead.
                </li>
              </>
            )}
            {mode === "android" && (
              <>
                <li>
                  Tap your browser&apos;s menu <strong>⋮</strong>.
                </li>
                <li>
                  Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </li>
                <li>Open Tikdue from your Home Screen.</li>
              </>
            )}
          </ol>
          <form method="dialog">
            <button className="btn-ink">Got it</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
