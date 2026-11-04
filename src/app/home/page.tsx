import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { CardIcon, DocIcon, PlusIcon } from "@/components/Icons";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const titles = new Set(["dr", "mr", "mrs", "ms", "miss", "eng", "engr", "prof", "sir"]);
  const words = ((user.user_metadata?.full_name as string | undefined) ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const name = words.find((w) => !titles.has(w.replace(/\./g, "").toLowerCase())) ?? "there";

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Muscat",
  });

  return (
    <main className="app">
      <header className="app-header">
        <div className="hero-glow" aria-hidden="true" />
        <div className="app-topbar">
          <div className="wordmark wordmark-sm">
            <img src="/icons/icon.svg" alt="" width={28} height={28} />
            <span>Tikdue</span>
          </div>
          <SignOutButton />
        </div>
        <p className="app-date">{today}</p>
        <h1 className="app-greeting">Hi {name}</h1>

        <div className="summary">
          <div>
            <span className="summary-num">0</span>
            <span className="summary-label">Overdue</span>
          </div>
          <div>
            <span className="summary-num">0</span>
            <span className="summary-label">This week</span>
          </div>
          <div>
            <span className="summary-num">0</span>
            <span className="summary-label">Coming up</span>
          </div>
        </div>
      </header>

      <section className="app-body">
        <div className="empty">
          <div className="empty-art" aria-hidden="true">
            <span className="empty-chip tone-amber">
              <CardIcon />
            </span>
            <span className="empty-chip empty-chip-main">
              <img src="/icons/icon.svg" alt="" width={44} height={44} />
            </span>
            <span className="empty-chip tone-teal">
              <DocIcon />
            </span>
          </div>
          <h2>All clear for now</h2>
          <p>
            Add your bills and documents, and Tikdue will remind you before each one is due.
          </p>
          <button type="button" className="btn btn-primary btn-icon" disabled>
            <PlusIcon /> Add your first item
          </button>
          <span className="soon">Coming in the next update</span>
        </div>
      </section>
    </main>
  );
}
