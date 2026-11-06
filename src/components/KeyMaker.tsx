"use client";

import { useState } from "react";

export function KeyMaker() {
  const [value, setValue] = useState("");

  async function make() {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    setValue(JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }));
  }

  return (
    <div className="keymaker">
      <p className="quiet-line">
        This creates the private key Tikdue uses to sign reminder notifications. It is made in this browser
        and never sent anywhere. Copy it into Cloudflare as a secret named <strong>VAPID_PRIVATE_JWK</strong>,
        then keep it private.
      </p>
      {value ? (
        <>
          <textarea
            className="keymaker-box"
            readOnly
            value={value}
            rows={5}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Private key"
          />
          <button
            type="button"
            className="btn-ink"
            onClick={() => navigator.clipboard?.writeText(value).catch(() => undefined)}
          >
            Copy key
          </button>
        </>
      ) : (
        <button type="button" className="btn-ink" onClick={make}>
          Create key
        </button>
      )}
    </div>
  );
}
