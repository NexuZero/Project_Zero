import { useCallback, useEffect, useState } from "react";
import { addFavorite, getFavorites, removeFavorite } from "@/utils/storage";
import type { FavoriteIdea, ProjectIdea } from "@/types";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteIdea[]>(() => getFavorites());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pz.favorites") setFavorites(getFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);

  const favorite = useCallback((idea: ProjectIdea) => {
    addFavorite(idea);
    setFavorites(getFavorites());
  }, []);

  const unfavorite = useCallback((id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  }, []);

  const toggleFavorite = useCallback(
    (idea: ProjectIdea) => {
      if (isFavorite(idea.id)) {
        unfavorite(idea.id);
      } else {
        favorite(idea);
      }
    },
    [isFavorite, favorite, unfavorite]
  );

  return { favorites, isFavorite, favorite, unfavorite, toggleFavorite };
}
