import { useCallback, useEffect, useState } from "react";
import {
  checkOnDeviceAssistStatus,
  elaborateIdeaWithOnDeviceAi,
  type OnDeviceAssistStatus,
  type OnDeviceElaborationInput
} from "@/utils/onDeviceAi";

type ElaborationState = "idle" | "loading" | "downloading" | "done" | "failed";

export function useOnDeviceAi() {
  const [status, setStatus] = useState<OnDeviceAssistStatus | "checking">("checking");
  const [elaboration, setElaboration] = useState<string | null>(null);
  const [elaborationState, setElaborationState] = useState<ElaborationState>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    checkOnDeviceAssistStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const elaborate = useCallback(async (input: OnDeviceElaborationInput): Promise<string | null> => {
    setElaborationState("loading");
    setDownloadProgress(0);
    const result = await elaborateIdeaWithOnDeviceAi(input, {
      onDownloadProgress: (loaded) => {
        setDownloadProgress(loaded);
        setElaborationState(loaded < 1 ? "downloading" : "loading");
      }
    });
    if (result) {
      setElaboration(result);
      setElaborationState("done");
      setStatus("ready");
    } else {
      setElaborationState("failed");
    }
    return result;
  }, []);

  const reset = useCallback(() => {
    setElaboration(null);
    setElaborationState("idle");
  }, []);

  return { status, elaboration, elaborationState, downloadProgress, elaborate, reset };
}
