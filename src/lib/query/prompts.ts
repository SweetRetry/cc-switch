import { useQuery } from "@tanstack/react-query";
import { promptsApi, type AppId } from "@/lib/api";

export const promptKeys = {
  content: (app: AppId) => ["prompts", "content", app] as const,
  location: (app: AppId) => ["prompts", "location", app] as const,
};

/** 支持提示词的应用，按侧栏顺序。 */
export const PROMPT_APP_IDS: AppId[] = [
  "claude",
  "codex",
  "opencode",
  "pi",
  "agy",
];

export function usePromptFileLocationQuery(app: AppId, enabled = true) {
  return useQuery({
    queryKey: promptKeys.location(app),
    queryFn: () => promptsApi.getFileLocation(app),
    enabled,
    refetchOnWindowFocus: "always",
    staleTime: 30_000,
  });
}
