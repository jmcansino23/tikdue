import Link from "next/link";
import { createItem } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { ItemForm } from "@/components/ItemForm";
import { createClient } from "@/lib/supabase/server";
import type { Kind } from "@/lib/items";

export default async function AddItem({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const { kind: kindParam, error } = await searchParams;
  const kind: Kind = kindParam === "document" ? "document" : "bill";

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("host_currency").maybeSingle();
  const defaultCurrency = (profile?.host_currency as string | undefined) || "OMR";

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back="/home" title={kind === "bill" ? "Add bill" : "Add document"} />

        <nav className="segment-links" aria-label="Type">
          <Link href="/add" aria-current={kind === "bill" ? "page" : undefined}>
            Bill
          </Link>
          <Link href="/add?kind=document" aria-current={kind === "document" ? "page" : undefined}>
            Document
          </Link>
        </nav>

        {error && <p className="notice notice-error">{error}</p>}

        <ItemForm
          key={kind}
          kind={kind}
          defaults={{}}
          action={createItem}
          submitLabel={kind === "bill" ? "Save bill" : "Save document"}
          defaultCurrency={defaultCurrency}
        />
      </div>
    </main>
  );
}
