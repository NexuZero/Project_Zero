import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shuffle, Sparkles } from "lucide-react";
import { FieldCombobox } from "@/components/FieldCombobox";
import { TextField } from "@/components/TextField";
import { TextAreaField } from "@/components/TextAreaField";
import { Button } from "@/components/Button";
import { useIdeaSession } from "@/hooks/useIdeaSession";

const PROBLEM_MIN = 10;
const PROBLEM_MAX = 500;

export function Home() {
  const navigate = useNavigate();
  const { generate, surprise, lastInput } = useIdeaSession();

  const [field, setField] = useState(lastInput?.fieldId ?? "");
  const [niche, setNiche] = useState(lastInput?.niche ?? "");
  const [problem, setProblem] = useState(lastInput?.problem ?? "");
  const [targetUsers, setTargetUsers] = useState(lastInput?.targetUsers ?? "");
  const [errors, setErrors] = useState<{ field?: string; problem?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: { field?: string; problem?: string } = {};
    if (!field.trim()) next.field = "Pick or type a field to generate from.";
    const trimmedProblem = problem.trim();
    if (!trimmedProblem) next.problem = "Describe the problem you want to solve.";
    else if (trimmedProblem.length < PROBLEM_MIN) next.problem = `Give a bit more detail (at least ${PROBLEM_MIN} characters).`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    generate({ fieldId: field.trim(), niche: niche.trim(), problem: problem.trim(), targetUsers: targetUsers.trim() });
    navigate("/results");
  }

  function handleSurprise() {
    setIsSubmitting(true);
    surprise();
    navigate("/results");
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-3 font-mono-nums text-xs font-semibold uppercase tracking-[0.2em] text-accent dark:text-accent-dark">
          Project Zero
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink dark:text-ink-dark sm:text-5xl">
          Turn a problem into your next project.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted dark:text-muted-dark">
          Describe what interests you. Project Zero turns it into practical, buildable open-source project concepts —
          fully offline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm sm:p-8">
        <FieldCombobox value={field} onChange={setField} error={errors.field} />

        <TextField
          label="Niche"
          placeholder="Enter a niche"
          hint='Example: "AI Agent Operations"'
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          maxLength={100}
        />

        <TextAreaField
          label="Problem"
          placeholder="Describe the problem you want to solve"
          hint='Example: "Companies deploying AI agents don’t have a simple way to track ownership, health, permissions and incidents."'
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          maxLength={PROBLEM_MAX}
          error={errors.problem}
        />

        <TextField
          label="Target User (optional)"
          placeholder="Who experiences this problem?"
          hint='Example: "IT Operations Teams"'
          value={targetUsers}
          onChange={(e) => setTargetUsers(e.target.value)}
          maxLength={100}
        />

        <div className="space-y-3 pt-2">
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            <Sparkles size={18} />
            Generate 10 Projects
          </Button>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={handleSurprise} disabled={isSubmitting}>
            <Shuffle size={18} />
            Surprise Me
          </Button>
        </div>

        <p className="pt-1 text-center text-xs text-muted dark:text-muted-dark">
          No account. No cloud AI. Your ideas stay on your device.
        </p>
      </form>
    </div>
  );
}
