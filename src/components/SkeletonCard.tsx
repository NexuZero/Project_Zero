export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
      <div className="flex items-start justify-between">
        <div className="h-4 w-6 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-5 w-20 rounded-full bg-black/10 dark:bg-white/10" />
      </div>
      <div className="mt-4 h-6 w-2/3 rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-2 h-4 w-full rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
        <div className="h-3 w-5/6 rounded bg-black/10 dark:bg-white/10" />
      </div>
      <div className="mt-8 h-10 w-full rounded-xl bg-black/10 dark:bg-white/10" />
    </div>
  );
}
