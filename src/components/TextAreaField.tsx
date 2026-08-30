import type { TextareaHTMLAttributes } from "react";
import { inputClasses, slugifyId } from "./TextField";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  maxLength?: number;
}

export function TextAreaField({ label, hint, error, id, className = "", maxLength, value, ...props }: TextAreaFieldProps) {
  const fieldId = id ?? slugifyId(label);
  const length = typeof value === "string" ? value.length : 0;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink dark:text-ink-dark">
          {label}
        </label>
        {maxLength && (
          <span className="font-mono-nums text-xs text-muted dark:text-muted-dark">
            {length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={fieldId}
        className={`${inputClasses} min-h-[112px] resize-y ${className}`}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">{hint}</p>
      ) : null}
    </div>
  );
}
