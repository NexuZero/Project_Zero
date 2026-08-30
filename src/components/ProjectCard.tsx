import { ArrowUpRight, Sparkles } from "lucide-react";
import type { ProjectIdea } from "@/types";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { DifficultyDots } from "./DifficultyDots";
import { Button } from "./Button";

interface ProjectCardProps {
  idea: ProjectIdea;
  index: number;
  onExplore: (idea: ProjectIdea) => void;
}

export function ProjectCard({ idea, index, onExplore }: ProjectCardProps) {
  return (
    <Card className="group flex animate-rise-in flex-col p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="font-mono-nums text-sm text-muted dark:text-muted-dark">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Badge>{idea.categoryName}</Badge>
      </div>

      <h3 className="mt-3 text-xl font-bold tracking-tight text-ink dark:text-ink-dark">{idea.name}</h3>
      <p className="mt-1.5 text-sm text-muted dark:text-muted-dark">{idea.tagline}</p>

      <div className="mt-4 space-y-2.5 text-sm">
        <p className="line-clamp-2 text-ink/80 dark:text-ink-dark/80">
          <span className="font-medium text-ink dark:text-ink-dark">Problem — </span>
          {idea.whyItShouldExist}
        </p>
        <p className="line-clamp-2 text-ink/80 dark:text-ink-dark/80">
          <span className="font-medium text-ink dark:text-ink-dark">Solution — </span>
          {idea.solution}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-y-2.5 gap-x-3 border-t border-border dark:border-border-dark pt-4 text-xs">
        <div>
          <div className="text-muted dark:text-muted-dark">Difficulty</div>
          <DifficultyDots value={idea.difficulty} />
        </div>
        <div>
          <div className="text-muted dark:text-muted-dark">Build Size</div>
          <div className="mt-0.5 font-medium text-ink dark:text-ink-dark">{idea.buildSize}</div>
        </div>
        <div>
          <div className="text-muted dark:text-muted-dark">AI Required</div>
          <div className="mt-0.5 flex items-center gap-1 font-medium text-ink dark:text-ink-dark">
            {idea.aiRequired === "Yes" && <Sparkles size={12} className="text-accent dark:text-accent-dark" />}
            {idea.aiRequired}
          </div>
        </div>
        <div>
          <div className="text-muted dark:text-muted-dark">OSS Potential</div>
          <div className="mt-0.5">
            <Badge tone="level" level={idea.openSourcePotential}>
              {idea.openSourcePotential}
            </Badge>
          </div>
        </div>
      </div>

      <Button variant="secondary" className="mt-5 w-full justify-between" onClick={() => onExplore(idea)}>
        Explore Project
        <ArrowUpRight size={16} />
      </Button>
    </Card>
  );
}
