import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Record_ } from "../backend.d";
import { useActor } from "./useActor";

export type { Record_ };

export function useGetHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Record_[]>({
    queryKey: ["history"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllHistory();
      // Sort by newest first
      return [...result].sort((a, b) =>
        Number(b.timestampNanos - a.timestampNanos),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveTranslation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceText,
      sourceLang,
      targetLang,
      translatedText,
    }: {
      sourceText: string;
      sourceLang: string;
      targetLang: string;
      translatedText: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      await actor.saveTranslation(
        sourceText,
        sourceLang,
        targetLang,
        translatedText,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useDeleteRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor available");
      await actor.deleteRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor available");
      await actor.clearHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
