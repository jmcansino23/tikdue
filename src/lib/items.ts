export type Kind = "bill" | "document";
export type Repeat = "monthly" | "quarterly" | "yearly" | "once";

export type Item = {
  id: string;
  kind: Kind;
  name: string;
  category: string | null;
  country: "host" | "home" | null;
  amount: number | null;
  currency: string | null;
  repeat: Repeat;
  due_day: number | null;
  next_due: string | null;
  belongs_to: string | null;
  notes: string | null;
  paused: boolean;
};

export type Payment = {
  id: string;
  due_date: string | null;
  paid_on: string;
  amount: number | null;
};

export const ITEM_COLUMNS =
  "id, kind, name, category, country, amount, currency, repeat, due_day, next_due, belongs_to, notes, paused";

export const BILL_CATEGORIES = [
  "Utilities",
  "Phone & internet",
  "Credit card",
  "Loan",
  "Rent",
  "Insurance",
  "Subscription",
  "Contribution",
  "School fees",
  "Other",
];

export const REPEAT_LABELS: Record<Repeat, string> = {
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
  once: "One time",
};

export const REPEAT_MONTHS: Record<Repeat, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  once: 0,
};

export type Template = {
  slug: string;
  name: string;
  category?: string;
  country?: "host" | "home";
  repeat?: Repeat;
};

export const BILL_TEMPLATES: Template[] = [
  { slug: "phone", name: "Phone bill", category: "Phone & internet", repeat: "monthly" },
  { slug: "card", name: "Credit card", category: "Credit card", repeat: "monthly" },
  { slug: "utilities", name: "Electricity & water", category: "Utilities", repeat: "monthly" },
  { slug: "internet", name: "Internet", category: "Phone & internet", repeat: "monthly" },
  { slug: "rent", name: "Rent", category: "Rent", repeat: "monthly" },
  { slug: "home", name: "Home-country contribution", category: "Contribution", country: "home", repeat: "monthly" },
];

export const DOCUMENT_TEMPLATES: Template[] = [
  { slug: "residence", name: "Residence card" },
  { slug: "passport", name: "Passport" },
  { slug: "visa", name: "Visa" },
  { slug: "licence", name: "Driving licence" },
  { slug: "car", name: "Car registration" },
  { slug: "car-insurance", name: "Car insurance" },
];

/** Normalise a row from Supabase (numeric columns can arrive as strings). */
export function toItem(row: Record<string, unknown>): Item {
  return {
    ...(row as Item),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    due_day: row.due_day === null || row.due_day === undefined ? null : Number(row.due_day),
  };
}
