import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Wand2 } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useIdeaSession } from "@/hooks/useIdeaSession";
import type { ProjectIdea } from "@/types";

export function Results() {
  const navigate = useNavigate();
  const { currentBatch, lastInput, generateMore } = useIdeaSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);

  if (!lastInput || currentBatch.length === 0) {
    return (
      <EmptyState
        icon={Wand2}
        title="No projects generated yet"
        description="Head back to Home to describe a problem, or try Surprise Me."
        actionLabel="Go to Home"
        onAction={() => navigate("/")}
      />
    );
  }

  function handleExplore(idea: ProjectIdea) {
    navigate(`/project/${idea.id}`);
  }

  function handleGenerateMore() {
    setIsRegenerating(true);
    setErrorMessage(null);
    try {
      generateMore();
    } catch {
      setErrorMessage("Something went wrong generating more ideas. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark sm:text-3xl">Your project ideas</h1>
          <p className="mt-1 text-sm text-muted dark:text-muted-dark">
            {currentBatch[0]?.fieldName} · {currentBatch[0]?.nicheLabel}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
          Start over
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {errorMessage}{" "}
          <button className="font-semibold underline" onClick={handleGenerateMore}>
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
          : currentBatch.map((idea, index) => (
              <ProjectCard key={idea.id} idea={idea} index={index} onExplore={handleExplore} />
            ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button size="lg" onClick={handleGenerateMore} disabled={isRegenerating}>
          <RefreshCw size={18} className={isRegenerating ? "animate-spin" : ""} />
          Generate 10 More
        </Button>
      </div>
    </div>
  );
}
