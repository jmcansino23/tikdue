"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleMark } from "@/components/Icons";

export function SignInButton() {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setBusy(false);
  }

  return (
    <button type="button" className="btn btn-google" onClick={signIn} disabled={busy}>
      <span className="g-badge">
        <GoogleMark size={20} />
      </span>
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
