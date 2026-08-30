import { useCallback, useState } from "react";
import { generateProjects, generateSurprise } from "@/engine/generator";
import { addSeenNames, getSession, setLastInput, setSessionBatch } from "@/utils/storage";
import type { GenerationInput, ProjectIdea } from "@/types";

const BATCH_SIZE = 10;

export function useIdeaSession() {
  const initial = getSession();
  const [currentBatch, setCurrentBatch] = useState<ProjectIdea[]>(initial.currentBatch);
  const [lastInput, setLastInputState] = useState<GenerationInput | null>(initial.lastInput);

  const commit = useCallback((batch: ProjectIdea[], input: GenerationInput) => {
    setCurrentBatch(batch);
    setLastInputState(input);
    setSessionBatch(batch);
    setLastInput(input);
    addSeenNames(batch.map((idea) => idea.name));
    return batch;
  }, []);

  const generate = useCallback(
    (input: GenerationInput) => {
      const seen = getSession().seenNames;
      const batch = generateProjects(input, { count: BATCH_SIZE, excludeNames: seen });
      return commit(batch, input);
    },
    [commit]
  );

  const generateMore = useCallback(() => {
    const session = getSession();
    if (!session.lastInput) return currentBatch;
    const batch = generateProjects(session.lastInput, { count: BATCH_SIZE, excludeNames: session.seenNames });
    return commit(batch, session.lastInput);
  }, [commit, currentBatch]);

  const surprise = useCallback(() => {
    const seen = getSession().seenNames;
    const result = generateSurprise({ count: BATCH_SIZE, excludeNames: seen });
    commit(result.projects, result.input);
    return result;
  }, [commit]);

  const generateSimilar = useCallback(
    (idea: ProjectIdea) => {
      const seen = getSession().seenNames;
      const input: GenerationInput = {
        fieldId: idea.fieldId,
        niche: idea.nicheLabel,
        problem: idea.problemInput,
        targetUsers: idea.targetUsers
      };
      const batch = generateProjects(input, { count: BATCH_SIZE, excludeNames: seen });
      return commit(batch, input);
    },
    [commit]
  );

  return { currentBatch, lastInput, generate, generateMore, surprise, generateSimilar };
}
