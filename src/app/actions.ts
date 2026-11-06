"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMonths, isValidISO } from "@/lib/dates";
import { CURRENCIES } from "@/lib/money";
import { BILL_TYPES, DOCUMENT_TYPES, ITEM_COLUMNS, REPEAT_MONTHS, toItem, type Repeat } from "@/lib/items";

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Only allow redirects back into the app, never to another site. */
function safeReturn(path: string, fallback: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function back(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(message)}`);
}

type ItemFields = {
  kind: "bill" | "document";
  name: string;
  category: string | null;
  country: "host" | "home" | null;
  amount: number | null;
  currency: string | null;
  repeat: Repeat;
  due_day: number | null;
  next_due: string;
  belongs_to: string | null;
  notes: string | null;
};

function readItem(fd: FormData): ItemFields | string {
  const kind = text(fd, "kind") === "document" ? "document" : "bill";
  const type = text(fd, "type");
  const known =
    kind === "bill" ? BILL_TYPES.some((t) => t.name === type) : DOCUMENT_TYPES.includes(type);
  if (!type) return kind === "bill" ? "Please choose a bill type." : "Please choose a document type.";
  const name = known ? type : text(fd, "name");
  if (name.length < 1 || name.length > 80) return "Please type a name for it (up to 80 characters).";

  const nextDue = text(fd, "next_due");
  if (!isValidISO(nextDue)) {
    return kind === "bill" ? "Please choose the next due date." : "Please choose the expiry date.";
  }

  const notesRaw = text(fd, "notes");
  if (notesRaw.length > 500) return "Notes can be up to 500 characters.";
  const notes = notesRaw || null;

  if (kind === "document") {
    const owner = text(fd, "belongs_to").slice(0, 40);
    return {
      kind,
      name,
      category: null,
      country: null,
      amount: null,
      currency: null,
      repeat: "once",
      due_day: null,
      next_due: nextDue,
      belongs_to: owner || "Me",
      notes,
    };
  }

  const category = BILL_TYPES.find((t) => t.name === name)?.category ?? "Other";
  const country = text(fd, "country") === "home" ? "home" : "host";

  const repeatRaw = text(fd, "repeat") as Repeat;
  const repeat: Repeat = Object.prototype.hasOwnProperty.call(REPEAT_MONTHS, repeatRaw)
    ? repeatRaw
    : "monthly";

  const amountRaw = text(fd, "amount").replace(/,/g, "");
  let amount: number | null = null;
  if (amountRaw) {
    const n = Number(amountRaw);
    if (!Number.isFinite(n) || n < 0 || n > 1e10) return "Please enter a valid amount.";
    amount = Math.round(n * 1000) / 1000;
  }

  const currencyRaw = text(fd, "currency").toUpperCase();
  const currency = (CURRENCIES as readonly string[]).includes(currencyRaw) ? currencyRaw : "OMR";

  return {
    kind,
    name,
    category,
    country,
    amount,
    currency,
    repeat,
    due_day: Number(nextDue.slice(8, 10)),
    next_due: nextDue,
    belongs_to: null,
    notes,
  };
}

export async function createItem(fd: FormData) {
  const kind = text(fd, "kind") === "document" ? "document" : "bill";
  const fields = readItem(fd);
  if (typeof fields === "string") back(`/add?kind=${kind}`, fields);

  const supabase = await createClient();
  const { error } = await supabase.from("items").insert(fields);
  if (error) back(`/add?kind=${kind}`, "Couldn't save just now. Please try again.");

  revalidatePath("/home");
  redirect("/home");
}

export async function updateItem(fd: FormData) {
  const id = text(fd, "id");
  const fields = readItem(fd);
  if (typeof fields === "string") back(`/items/${id}/edit`, fields);

  const supabase = await createClient();
  const { error } = await supabase.from("items").update(fields).eq("id", id);
  if (error) back(`/items/${id}/edit`, "Couldn't save just now. Please try again.");

  revalidatePath("/home");
  redirect(`/items/${id}`);
}

/** Bills: record the payment and roll the due date to the next cycle. */
export async function markPaid(fd: FormData) {
  const id = text(fd, "id");
  const ret = safeReturn(text(fd, "return"), "/home");
  const supabase = await createClient();

  const { data } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (!data) redirect("/home");
  const item = toItem(data as Record<string, unknown>);
  if (item.kind !== "bill" || !item.next_due) redirect(ret);

  const { error: payError } = await supabase.from("payments").insert({
    item_id: item.id,
    due_date: item.next_due,
    amount: item.amount,
  });
  if (payError) back(ret, "Couldn't record that payment. Please try again.");

  const months = REPEAT_MONTHS[item.repeat];
  const nextDue = months ? addMonths(item.next_due, months, item.due_day) : null;
  await supabase.from("items").update({ next_due: nextDue }).eq("id", item.id);

  revalidatePath("/home");
  redirect(ret);
}

/** Documents: record the renewal and set the new expiry date. */
export async function renewDocument(fd: FormData) {
  const id = text(fd, "id");
  const newDate = text(fd, "new_expiry");
  if (!isValidISO(newDate)) back(`/items/${id}`, "Please choose the new expiry date.");

  const supabase = await createClient();
  const { data } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (!data) redirect("/home");
  const item = toItem(data as Record<string, unknown>);

  const { error: payError } = await supabase.from("payments").insert({
    item_id: item.id,
    due_date: item.next_due,
    amount: null,
  });
  if (payError) back(`/items/${id}`, "Couldn't record the renewal. Please try again.");

  await supabase.from("items").update({ next_due: newDate }).eq("id", item.id);

  revalidatePath("/home");
  redirect(`/items/${id}?renewed=1`);
}

export async function deleteItem(fd: FormData) {
  const id = text(fd, "id");
  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", id);
  revalidatePath("/home");
  redirect("/home");
}

/** Save the currency pair shown on the Home rate card. */
export async function setCurrencies(fd: FormData) {
  const list = CURRENCIES as readonly string[];
  let base = text(fd, "base").toUpperCase();
  let quote = text(fd, "quote").toUpperCase();
  if (!list.includes(base) || !list.includes(quote)) return;
  if (text(fd, "swap") === "1") [base, quote] = [quote, base];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase
    .from("profiles")
    .upsert({ user_id: user.id, host_currency: base, home_currency: quote }, { onConflict: "user_id" });

  revalidatePath("/home");
}
