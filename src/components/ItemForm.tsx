import { CURRENCIES } from "@/lib/money";
import { BILL_CATEGORIES, REPEAT_LABELS, type Item, type Kind, type Repeat } from "@/lib/items";

type Defaults = Partial<Pick<Item, "name" | "category" | "country" | "amount" | "currency" | "repeat" | "next_due" | "belongs_to" | "notes">>;

export function ItemForm({
  kind,
  defaults,
  action,
  submitLabel,
  id,
  minDate,
}: {
  kind: Kind;
  defaults: Defaults;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  id?: string;
  minDate?: string;
}) {
  const isBill = kind === "bill";
  const repeats = Object.keys(REPEAT_LABELS) as Repeat[];

  return (
    <form action={action} className="form">
      <input type="hidden" name="kind" value={kind} />
      {id && <input type="hidden" name="id" value={id} />}

      <label className="field">
        <span className="field-label">{isBill ? "Name" : "Document"}</span>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={defaults.name ?? ""}
          placeholder={isBill ? "e.g. Phone bill" : "e.g. Residence card"}
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
              <select name="currency" defaultValue={defaults.currency ?? "OMR"}>
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
              <input
                type="date"
                name="next_due"
                required
                defaultValue={defaults.next_due ?? ""}
                min={minDate}
              />
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

          <label className="field">
            <span className="field-label">Category</span>
            <select name="category" defaultValue={defaults.category ?? "Other"}>
              {BILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <div className="field-row">
          <label className="field">
            <span className="field-label">Expiry date</span>
            <input type="date" name="next_due" required defaultValue={defaults.next_due ?? ""} />
          </label>
          <label className="field">
            <span className="field-label">Whose</span>
            <input
              name="belongs_to"
              maxLength={40}
              defaultValue={defaults.belongs_to ?? "Me"}
              placeholder="Me, spouse, car…"
              autoComplete="off"
            />
          </label>
        </div>
      )}

      <label className="field">
        <span className="field-label">Notes (optional)</span>
        <textarea
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={defaults.notes ?? ""}
          placeholder={isBill ? "How you pay, who to call…" : "Where it's renewed, papers needed…"}
        />
      </label>

      <button type="submit" className="btn-ink">
        {submitLabel}
      </button>
    </form>
  );
}
