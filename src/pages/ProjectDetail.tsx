import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FolderArchive, Heart, PackageSearch, Sparkles } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DifficultyDots } from "@/components/DifficultyDots";
import { EmptyState } from "@/components/EmptyState";
import { useFavorites } from "@/hooks/useFavorites";
import { useIdeaSession } from "@/hooks/useIdeaSession";
import { useToast } from "@/components/Toast";
import { findIdeaById } from "@/utils/storage";
import { downloadMarkdown } from "@/utils/markdown";
import { downloadProjectKit } from "@/utils/projectKit";

const FALLBACK_RATIONALE =
  "This name was generated in an earlier version of Project Zero, so a detailed rationale isn't available for it.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border dark:border-border-dark py-6 first:border-t-0 first:pt-0">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">{title}</h2>
      {children}
    </section>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm text-ink dark:text-ink-dark"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { generateSimilar } = useIdeaSession();
  const { showToast } = useToast();
  const [isExportingKit, setIsExportingKit] = useState(false);

  const idea = useMemo(() => (id ? findIdeaById(id) : undefined), [id]);

  if (!idea) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Idea not found"
        description="This idea isn't in your current session or your favorites. It may have been cleared, or the link is out of date."
        actionLabel="Back to Home"
        onAction={() => navigate("/")}
      />
    );
  }

  const favorited = isFavorite(idea.id);

  function handleSave() {
    toggleFavorite(idea!);
    showToast(favorited ? "Removed from Favorites" : "Saved to Favorites");
  }

  function handleExport() {
    downloadMarkdown(idea!);
    showToast("Exported as Markdown");
  }

  async function handleExportKit() {
    setIsExportingKit(true);
    try {
      await downloadProjectKit(idea!);
      showToast("Planning kit downloaded");
    } finally {
      setIsExportingKit(false);
    }
  }

  function handleSimilar() {
    generateSimilar(idea!);
    navigate("/results");
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </Button>

      <Card className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{idea.categoryName}</Badge>
          <Badge>{idea.fieldName}</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink dark:text-ink-dark sm:text-4xl">{idea.name}</h1>
        <p className="mt-2 text-lg text-muted dark:text-muted-dark">{idea.tagline}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Difficulty</div>
            <div className="mt-1"><DifficultyDots value={idea.difficulty} /></div>
          </div>
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Build Size</div>
            <div className="mt-1 text-sm font-semibold">{idea.buildSize}</div>
          </div>
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">AI Required</div>
            <div className="mt-1 text-sm font-semibold">{idea.aiRequired}</div>
          </div>
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Community Value</div>
            <div className="mt-1"><Badge tone="level" level={idea.communityValue}>{idea.communityValue}</Badge></div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={handleSave}>
            <Heart size={16} fill={favorited ? "currentColor" : "none"} />
            {favorited ? "Saved" : "Save Idea"}
          </Button>
          <Button variant="secondary" onClick={handleSimilar}>
            <Sparkles size={16} />
            Generate Similar
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} />
            Export Markdown
          </Button>
          <Button variant="secondary" onClick={handleExportKit} disabled={isExportingKit}>
            <FolderArchive size={16} />
            {isExportingKit ? "Preparing kit…" : "Export Planning Kit"}
          </Button>
        </div>

        <div className="mt-8">
          <Section title="Naming Rationale">
            <p className="text-sm leading-relaxed text-ink/90 dark:text-ink-dark/90">
              {idea.namingRationale || FALLBACK_RATIONALE}
            </p>
          </Section>

          <Section title="Niche">
            <p className="text-sm text-ink dark:text-ink-dark">{idea.nicheLabel}</p>
          </Section>

          <Section title="Target Users">
            <p className="text-sm text-ink dark:text-ink-dark">{idea.targetUsers}</p>
          </Section>

          <Section title="Problem">
            <p className="text-sm leading-relaxed text-ink/90 dark:text-ink-dark/90">{idea.problemInput}</p>
          </Section>

          <Section title="Why This Project Should Exist">
            <p className="text-sm leading-relaxed text-ink/90 dark:text-ink-dark/90">{idea.whyItShouldExist}</p>
          </Section>

          <Section title="Proposed Solution">
            <p className="text-sm leading-relaxed text-ink/90 dark:text-ink-dark/90">{idea.solution}</p>
          </Section>

          <Section title="Core Features">
            <FeatureList items={idea.coreFeatures} />
          </Section>

          <Section title="MVP Features">
            <FeatureList items={idea.mvpFeatures} />
          </Section>

          <Section title="Future Features">
            <FeatureList items={idea.futureFeatures} />
          </Section>

          <Section title="Suggested Tech Stack">
            <div className="flex flex-wrap gap-2">
              {idea.techStack.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>
          </Section>

          <Section title="Open Source Potential">
            <Badge tone="level" level={idea.openSourcePotential}>{idea.openSourcePotential}</Badge>
          </Section>

          <Section title="Possible GitHub Description">
            <p className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-4 text-sm italic text-ink/90 dark:text-ink-dark/90">
              “{idea.githubDescription}”
            </p>
          </Section>
        </div>
      </Card>
    </div>
  );
}
