import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

const inputClasses =
  "w-full rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm text-ink dark:text-ink-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none transition-colors focus:border-accent dark:focus:border-accent-dark";

function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TextField({ label, hint, error, id, className = "", ...props }: TextFieldProps) {
  const fieldId = id ?? slugifyId(label);
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-ink dark:text-ink-dark">
        {label}
      </label>
      <input id={fieldId} className={`${inputClasses} ${className}`} {...props} />
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">{hint}</p>
      ) : null}
    </div>
  );
}

export { inputClasses, slugifyId };
