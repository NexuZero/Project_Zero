interface DifficultyDotsProps {
  value: 1 | 2 | 3 | 4 | 5;
}

export function DifficultyDots({ value }: DifficultyDotsProps) {
  return (
    <span className="font-mono-nums tracking-widest text-sm" aria-label={`Difficulty ${value} out of 5`}>
      <span className="text-ink dark:text-ink-dark">{"●".repeat(value)}</span>
      <span className="text-border dark:text-border-dark">{"○".repeat(5 - value)}</span>
    </span>
  );
}
