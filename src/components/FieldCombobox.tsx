import fieldsData from "@/knowledge/fields.json";
import type { FieldDef } from "@/types";
import { inputClasses } from "./TextField";

const fields = fieldsData as FieldDef[];

interface FieldComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** "Select or type a field" (spec §1) via a native input + datalist — free text, with suggestions. */
export function FieldCombobox({ value, onChange, error }: FieldComboboxProps) {
  return (
    <div>
      <label htmlFor="field-input" className="mb-2 block text-sm font-medium text-ink dark:text-ink-dark">
        Field
      </label>
      <input
        id="field-input"
        list="fields-datalist"
        className={inputClasses}
        placeholder="Select or type a field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={100}
        autoComplete="off"
      />
      <datalist id="fields-datalist">
        {fields.map((field) => (
          <option key={field.id} value={field.name} />
        ))}
      </datalist>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">
          e.g. Applied AI, Cybersecurity, DevOps, Education, Productivity
        </p>
      )}
    </div>
  );
}
