// Web Push (RFC 8030) with VAPID (RFC 8292) and aes128gcm payload encryption
// (RFC 8188 / RFC 8291), written on the standard Web Crypto API so it runs on
// Cloudflare Workers without extra packages.
//
// No "@/..." imports here: this file is also bundled into the scheduled worker.

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string; // base64url, 65-byte uncompressed P-256 public key
  auth: string; // base64url, 16-byte auth secret
};

export type Vapid = {
  privateKey: CryptoKey;
  publicKey: string; // base64url uncompressed public key (the "applicationServerKey")
  subject: string;
};

type Bytes = Uint8Array<ArrayBuffer>;

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Bytes {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

type Jwk = { kty?: string; crv?: string; x?: string; y?: string; d?: string };

/** Load the VAPID key pair from the JSON Web Key kept in the VAPID_PRIVATE_JWK secret. */
export async function loadVapid(jwkJson: string | undefined, subject = "https://tikdue.app"): Promise<Vapid | null> {
  if (!jwkJson) return null;
  let jwk: Jwk;
  try {
    jwk = JSON.parse(jwkJson) as Jwk;
  } catch {
    return null;
  }
  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y || !jwk.d) return null;
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, d: jwk.d, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const publicRaw = concat(new Uint8Array([4]), b64urlDecode(jwk.x), b64urlDecode(jwk.y));
  return { privateKey, publicKey: b64urlEncode(publicRaw), subject };
}

/** Public key only, for the browser's applicationServerKey. */
export function vapidPublicKey(jwkJson: string | undefined): string | null {
  if (!jwkJson) return null;
  try {
    const jwk = JSON.parse(jwkJson) as Jwk;
    if (!jwk.x || !jwk.y) return null;
    return b64urlEncode(concat(new Uint8Array([4]), b64urlDecode(jwk.x), b64urlDecode(jwk.y)));
  } catch {
    return null;
  }
}

async function vapidAuthorization(endpoint: string, vapid: Vapid): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(
    enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject })),
  );
  const unsigned = `${header}.${claims}`;
  // Web Crypto returns the raw r||s signature, which is exactly the JWS ES256 format.
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapid.privateKey, enc.encode(unsigned)),
  );
  return `vapid t=${unsigned}.${b64urlEncode(sig)}, k=${vapid.publicKey}`;
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

/** Encrypt a payload for one subscription (RFC 8291, single aes128gcm record). */
export async function encryptPayload(
  sub: Pick<PushSubscriptionKeys, "p256dh" | "auth">,
  payload: Bytes,
  // For tests only: fixed sender key pair and salt.
  fixed?: { senderKeys?: CryptoKeyPair; salt?: Bytes },
): Promise<Bytes> {
  const uaPublic = b64urlDecode(sub.p256dh);
  const authSecret = b64urlDecode(sub.auth);

  const senderKeys =
    fixed?.senderKeys ??
    ((await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));

  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, senderKeys.privateKey, 256),
  );

  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  const salt = fixed?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plaintext = concat(payload, new Uint8Array([2])); // 0x02 = last (only) record
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext));

  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Send one notification. Returns the push service's HTTP status (0 on network error). */
export async function sendPush(sub: PushSubscriptionKeys, message: PushMessage, vapid: Vapid): Promise<number> {
  try {
    const body = await encryptPayload(sub, enc.encode(JSON.stringify(message)));
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: await vapidAuthorization(sub.endpoint, vapid),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(24 * 3600),
        Urgency: "normal",
      },
      body,
    });
    return res.status;
  } catch {
    return 0;
  }
}

/** 404/410 mean the subscription is gone for good and should be deleted. */
export function isExpired(status: number): boolean {
  return status === 404 || status === 410;
}
