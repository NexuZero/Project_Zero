import { useNavigate } from "react-router-dom";
import { Download, Heart, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DifficultyDots } from "@/components/DifficultyDots";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/components/Toast";
import { downloadMarkdown } from "@/utils/markdown";
import type { FavoriteIdea } from "@/types";

export function Favorites() {
  const navigate = useNavigate();
  const { favorites, unfavorite } = useFavorites();
  const { showToast } = useToast();

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Save an idea from any project detail page and it'll show up here — stored only on this device."
        actionLabel="Generate ideas"
        onAction={() => navigate("/")}
      />
    );
  }

  function handleRemove(idea: FavoriteIdea) {
    unfavorite(idea.id);
    showToast("Removed from Favorites");
  }

  function handleExport(idea: FavoriteIdea) {
    downloadMarkdown(idea);
    showToast("Exported as Markdown");
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark sm:text-3xl">Favorites</h1>
      <p className="mt-1 text-sm text-muted dark:text-muted-dark">
        {favorites.length} saved idea{favorites.length === 1 ? "" : "s"}, stored only on this device.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((idea) => (
          <Card key={idea.id} className="flex flex-col p-6">
            <Badge>{idea.categoryName}</Badge>
            <button
              className="mt-3 text-left text-lg font-bold tracking-tight text-ink dark:text-ink-dark hover:underline"
              onClick={() => navigate(`/project/${idea.id}`)}
            >
              {idea.name}
            </button>
            <p className="mt-1 line-clamp-2 text-sm text-muted dark:text-muted-dark">{idea.tagline}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-muted dark:text-muted-dark">
              <DifficultyDots value={idea.difficulty} />
              <span>{idea.buildSize}</span>
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleExport(idea)}>
                <Download size={14} />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(idea)} aria-label="Remove favorite">
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
