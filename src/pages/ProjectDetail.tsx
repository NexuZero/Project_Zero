import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Cpu, Download, FolderArchive, Heart, PackageSearch, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DifficultyDots } from "@/components/DifficultyDots";
import { EmptyState } from "@/components/EmptyState";
import { useFavorites } from "@/hooks/useFavorites";
import { useIdeaSession } from "@/hooks/useIdeaSession";
import { useProseElaboration } from "@/hooks/useProseElaboration";
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
  const prose = useProseElaboration();

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
      const aiElaboration = prose.elaborationState === "done" ? (prose.elaboration ?? undefined) : undefined;
      await downloadProjectKit(idea!, { aiElaboration });
      showToast(aiElaboration ? "Planning kit downloaded (with your AI elaboration)" : "Planning kit downloaded");
    } finally {
      setIsExportingKit(false);
    }
  }

  async function handleElaborate() {
    const result = await prose.elaborate({
      name: idea!.name,
      tagline: idea!.tagline,
      whyItShouldExist: idea!.whyItShouldExist,
      solution: idea!.solution,
      mvpFeatures: idea!.mvpFeatures
    });
    if (!result) {
      showToast("On-device AI couldn't produce a result — your planning kit is unaffected");
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
          {prose.status !== "checking" && prose.status !== "unsupported" && (
            <Button
              variant="secondary"
              onClick={handleElaborate}
              disabled={prose.elaborationState === "loading" || prose.elaborationState === "downloading"}
            >
              <Cpu size={16} />
              {prose.elaborationState === "downloading"
                ? `Downloading on-device model… ${Math.round(prose.downloadProgress * 100)}%`
                : prose.elaborationState === "loading"
                  ? "Elaborating…"
                  : prose.status === "downloading"
                    ? `Downloading on-device model… ${Math.round(prose.downloadProgress * 100)}%`
                    : prose.status === "downloadable"
                      ? "Download & Elaborate (on-device, first time may take a few minutes)"
                      : "Elaborate with On-Device AI"}
            </Button>
          )}
        </div>

        {prose.elaborationState === "done" && prose.elaboration && (
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-accent dark:text-accent-dark">
                AI-Elaborated Summary (On-Device, Optional)
              </h2>
              <Button variant="ghost" size="sm" onClick={handleElaborate}>
                <RefreshCw size={14} />
                Regenerate
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-ink/90 dark:text-ink-dark/90">{prose.elaboration}</p>
            <p className="mt-3 text-xs text-muted dark:text-muted-dark">
              Optional, on-device only: this uses a local AI model running entirely on your device{prose.providerUsed ? ` (${prose.providerUsed})` : ""} to
              rephrase what Project Zero already generated — nothing is sent anywhere, and nothing new is invented (every
              response is checked against this idea's own data before being shown to you). This is separate from whether{" "}
              <em>this idea itself</em> needs AI to build (see "AI Required" above) — it's Project Zero's own optional
              writing assist. Review it before relying on it; small on-device models can still get things wrong. This
              paragraph will be included as an extra file the next time you export the Planning Kit.
            </p>
          </div>
        )}

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
