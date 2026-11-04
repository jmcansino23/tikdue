import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

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
  });

  return (
    <main className="shell">
      <div className="topbar">
        <span className="date">{today}</span>
        <SignOutButton />
      </div>
      <h1>Hi {name}, welcome to Tikdue</h1>

      <section className="card">
        <h2>Nothing due yet</h2>
        <p>
          Adding bills and documents is coming in the next update. You&apos;re signed in and
          your account is ready.
        </p>
      </section>
    </main>
  );
}
