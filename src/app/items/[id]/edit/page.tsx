import { notFound } from "next/navigation";
import { updateItem } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { ItemForm } from "@/components/ItemForm";
import { createClient } from "@/lib/supabase/server";
import { ITEM_COLUMNS, toItem } from "@/lib/items";

export default async function EditItem({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = toItem(data as Record<string, unknown>);

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back={`/items/${id}`} title={`Edit ${item.kind === "bill" ? "bill" : "document"}`} />
        {error && <p className="notice notice-error">{error}</p>}
        <ItemForm
          kind={item.kind}
          id={item.id}
          defaults={item}
          action={updateItem}
          submitLabel="Save changes"
        />
      </div>
    </main>
  );
}
