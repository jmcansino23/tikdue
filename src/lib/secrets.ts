import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Read a Cloudflare secret (set in the dashboard) from server code. */
export function secret(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  try {
    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    const v = env[name];
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}
