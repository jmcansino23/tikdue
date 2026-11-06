import { CURRENCIES } from "@/lib/money";
import {
  BILL_TYPES,
  DOCUMENT_TYPES,
  OTHER_TYPE,
  REPEAT_LABELS,
  type Item,
  type Kind,
  type Repeat,
} from "@/lib/items";

type Defaults = Partial<
  Pick<Item, "name" | "country" | "amount" | "currency" | "repeat" | "next_due" | "belongs_to" | "notes">
>;

export function ItemForm({
  kind,
  defaults,
  action,
  submitLabel,
  id,
  defaultCurrency = "OMR",
}: {
  kind: Kind;
  defaults: Defaults;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  id?: string;
  defaultCurrency?: string;
}) {
  const isBill = kind === "bill";
  const types = isBill ? BILL_TYPES.map((t) => t.name) : DOCUMENT_TYPES;
  const repeats = Object.keys(REPEAT_LABELS) as Repeat[];

  // When editing, split "Credit card · Amex" back into its type and label.
  // Names that don't start with a known type are "Other".
  let selected: string | undefined;
  let label = "";
  if (defaults.name) {
    const match = types.find((t) => defaults.name === t || defaults.name!.startsWith(`${t} · `));
    if (match) {
      selected = match;
      label = defaults.name.slice(match.length + 3);
    } else {
      selected = OTHER_TYPE;
    }
  }

  return (
    <form action={action} className="form">
      <input type="hidden" name="kind" value={kind} />
      {id && <input type="hidden" name="id" value={id} />}

      <fieldset className="field">
        <legend className="field-label">{isBill ? "Bill type" : "Document type"}</legend>
        <div className="type-chips">
          {types.map((t) => (
            <label key={t} className="type-chip">
              <input type="radio" name="type" value={t} required defaultChecked={selected === t} />
              <span>{t}</span>
            </label>
          ))}
          <label className="type-chip">
            <input type="radio" name="type" value={OTHER_TYPE} defaultChecked={selected === OTHER_TYPE} />
            <span>Other</span>
          </label>
        </div>
      </fieldset>

      <label className="field type-label">
        <span className="field-label">Which one? (optional)</span>
        <input
          name="label"
          maxLength={40}
          defaultValue={label}
          placeholder={isBill ? "e.g. Amex, Bank Muscat, car loan" : "e.g. Mine, wife's, Toyota"}
          autoComplete="off"
        />
      </label>

      <label className="field other-name">
        <span className="field-label">Name</span>
        <input
          name="name"
          maxLength={80}
          defaultValue={selected === OTHER_TYPE ? defaults.name ?? "" : ""}
          placeholder={isBill ? "e.g. Gym membership" : "e.g. Work permit"}
          autoComplete="off"
        />
      </label>

      {isBill ? (
        <>
          <fieldset className="field">
            <legend className="field-label">Country</legend>
            <div className="segment">
              <label>
                <input
                  type="radio"
                  name="country"
                  value="host"
                  defaultChecked={(defaults.country ?? "host") === "host"}
                />
                <span>Where I live</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="country"
                  value="home"
                  defaultChecked={defaults.country === "home"}
                />
                <span>Back home</span>
              </label>
            </div>
          </fieldset>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Amount (optional)</span>
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={defaults.amount ?? ""}
                placeholder="0.000"
                autoComplete="off"
              />
            </label>
            <label className="field field-narrow">
              <span className="field-label">Currency</span>
              <select name="currency" defaultValue={defaults.currency ?? defaultCurrency}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Next due date</span>
              <input type="date" name="next_due" required defaultValue={defaults.next_due ?? ""} />
            </label>
            <label className="field">
              <span className="field-label">Repeats</span>
              <select name="repeat" defaultValue={defaults.repeat ?? "monthly"}>
                {repeats.map((r) => (
                  <option key={r} value={r}>
                    {REPEAT_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="belongs_to" value={defaults.belongs_to ?? "Me"} />
          <label className="field">
            <span className="field-label">Expiry date</span>
            <input type="date" name="next_due" required defaultValue={defaults.next_due ?? ""} />
          </label>
        </>
      )}

      <label className="field">
        <span className="field-label">Notes (optional)</span>
        <textarea
          name="notes"
          rows={1}
          maxLength={500}
          defaultValue={defaults.notes ?? ""}
          placeholder={isBill ? "How you pay, which card…" : "Where it's renewed, papers needed…"}
        />
      </label>

      <div className="form-save">
        <button type="submit" className="btn-ink">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
