import type { AppId } from "@/lib/api/types";
import { SKILLS_APP_IDS } from "@/config/appConfig";
import { useToggleSkillApp } from "@/hooks/useSkills";

const DEFAULT_TARGETS: AppId[] = ["claude", "codex"];

/** ZIP 安装和备份恢复默认启用 Claude 与 Codex。 */
export function useSkillInstallTargets(visibleAppIds: readonly AppId[]) {
  const toggleMutation = useToggleSkillApp();

  // 只算看得见的应用；一个都不剩时退回第一个可见应用
  const targets = SKILLS_APP_IDS.filter(
    (app) => DEFAULT_TARGETS.includes(app) && visibleAppIds.includes(app),
  );
  const effective =
    targets.length > 0 ? targets : visibleAppIds.slice(0, 1).map((app) => app);

  /**
   * 先用 first 应用调用 install，再把其余应用逐个打开。
   * 返回装好的 Skill 和没能启用的应用（不抛错；install 本身失败才抛）。
   */
  const installTo = async <T extends { id: string }>(
    install: (firstApp: AppId) => Promise<T[]>,
    apps: AppId[] = effective,
  ) => {
    const [first, ...rest] = apps;
    const installed = await install(first ?? "claude");
    const failures: Array<{ id: string; app: AppId; error: unknown }> = [];
    for (const skill of installed) {
      for (const app of rest) {
        try {
          await toggleMutation.mutateAsync({
            id: skill.id,
            app,
            enabled: true,
          });
        } catch (error) {
          failures.push({ id: skill.id, app, error });
        }
      }
    }
    return { installed, failures };
  };

  return { targets: effective, installTo };
}
