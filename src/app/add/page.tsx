import Link from "next/link";
import { createItem } from "@/app/actions";
import { AppBar } from "@/components/AppBar";
import { ItemForm } from "@/components/ItemForm";
import { BILL_TEMPLATES, DOCUMENT_TEMPLATES, type Kind } from "@/lib/items";

export default async function AddItem({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; t?: string; error?: string }>;
}) {
  const { kind: kindParam, t, error } = await searchParams;
  const kind: Kind = kindParam === "document" ? "document" : "bill";
  const templates = kind === "bill" ? BILL_TEMPLATES : DOCUMENT_TEMPLATES;
  const picked = templates.find((tpl) => tpl.slug === t);

  return (
    <main className="page">
      <div className="page-inner">
        <AppBar back="/home" title="Add" />

        <h1 className="page-title">
          Add a <em>{kind === "bill" ? "bill" : "document"}.</em>
        </h1>

        <nav className="segment-links" aria-label="Type">
          <Link href="/add" aria-current={kind === "bill" ? "page" : undefined}>
            Bill
          </Link>
          <Link href="/add?kind=document" aria-current={kind === "document" ? "page" : undefined}>
            Document
          </Link>
        </nav>

        <section className="templates" aria-label="Quick start">
          <p className="eyebrow">Quick start</p>
          <div className="chips chips-wrap">
            {templates.map((tpl) => (
              <Link
                key={tpl.slug}
                href={`/add?kind=${kind}&t=${tpl.slug}`}
                className="chip"
                aria-current={picked?.slug === tpl.slug ? "true" : undefined}
              >
                {tpl.name}
              </Link>
            ))}
          </div>
        </section>

        {error && <p className="notice notice-error">{error}</p>}

        <ItemForm
          key={`${kind}-${picked?.slug ?? "blank"}`}
          kind={kind}
          defaults={{
            name: picked?.name,
            category: picked?.category,
            country: picked?.country,
            repeat: picked?.repeat,
          }}
          action={createItem}
          submitLabel={kind === "bill" ? "Save bill" : "Save document"}
        />
      </div>
    </main>
  );
}
