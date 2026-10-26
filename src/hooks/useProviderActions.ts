import { getOpencodeDeclaredModels } from "@/components/providers/forms/helpers/opencodeFormUtils";
import { injectCodingPlanUsageScript } from "@/config/codingPlanProviders";
import { piApi, providersApi, settingsApi, type AppId } from "@/lib/api";
import type { ProviderEditorSave } from "@/lib/api/providers";
import {
  useAddProviderMutation,
  useDeleteProviderMutation,
  useSwitchProviderMutation,
  useUpdateProviderMutation,
} from "@/lib/query";
import { usageKeys } from "@/lib/query/usage";
import { toast } from "@/lib/toast";
import type { Provider, UsageScript } from "@/types";
import { providerNeedsRouting } from "@/utils/providerCapabilities";
import { extractErrorMessage } from "@/utils/errorUtils";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook for managing provider actions (add, update, delete, switch)
 * Extracts business logic from App.tsx
 */
export function useProviderActions(activeApp: AppId) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const addProviderMutation = useAddProviderMutation(activeApp);
  const updateProviderMutation = useUpdateProviderMutation(activeApp);
  const deleteProviderMutation = useDeleteProviderMutation(activeApp);
  const switchProviderMutation = useSwitchProviderMutation(activeApp);

  // Claude 插件同步逻辑
  const syncClaudePlugin = useCallback(
    async (provider: Provider) => {
      if (activeApp !== "claude") return;

      try {
        const settings = await settingsApi.get();
        if (!settings?.enableClaudePluginIntegration) {
          return;
        }

        const isOfficial = provider.category === "official";
        await settingsApi.applyClaudePluginConfig({ official: isOfficial });

        // 静默执行，不显示成功通知
      } catch (error) {
        const detail =
          extractErrorMessage(error) ||
          t("notifications.syncClaudePluginFailed", {
            defaultValue: "同步 Claude 插件失败",
          });
        toast.error(detail, { duration: 4200 });
      }
    },
    [activeApp, t],
  );

  // 添加供应商
  const addProvider = useCallback(
    async (
      provider: Omit<Provider, "id"> & {
        providerKey?: string;
        addToLive?: boolean;
        editorSave?: ProviderEditorSave;
      },
    ) => {
      const enhanced = injectCodingPlanUsageScript(activeApp, provider);
      await addProviderMutation.mutateAsync(enhanced);

      // OpenClaw: register models to allowlist after adding provider
    },
    [addProviderMutation, activeApp, queryClient, t],
  );

  // 更新供应商
  const updateProvider = useCallback(
    async (
      provider: Provider,
      originalId?: string,
      editorSave?: ProviderEditorSave,
    ) => {
      await updateProviderMutation.mutateAsync({
        provider,
        originalId,
        editorSave,
      });

      // 更新托盘菜单（失败不影响主操作）
      try {
        await providersApi.updateTrayMenu();
      } catch (trayError) {
        console.error(
          "Failed to update tray menu after updating provider",
          trayError,
        );
      }
    },
    [updateProviderMutation],
  );

  // 切换供应商
  const switchProvider = useCallback(
    async (provider: Provider) => {
      if (providerNeedsRouting(activeApp, provider)) {
        toast.error(t("providerCard.reason.directUnsupported"));
        return;
      }
      try {
        const result = await switchProviderMutation.mutateAsync(provider.id);
        await syncClaudePlugin(provider);

        // Surface switch warnings by code — a generic "backfill failed"
        // message for an auth-cleanup warning would point the user at the
        // wrong problem entirely.
        if (result?.warnings?.length) {
          const authCleanupFailed = result.warnings.some((warning) =>
            warning.startsWith("codex_auth_cleanup_failed"),
          );
          const hasOtherWarnings = result.warnings.some(
            (warning) => !warning.startsWith("codex_auth_cleanup_failed"),
          );
          if (authCleanupFailed) {
            toast.warning(
              t("notifications.codexAuthCleanupFailed", {
                defaultValue:
                  "切换成功，但未能删除 auth.json，官方登录凭据仍留在磁盘上；如需彻底移除请手动删除 Codex 配置目录中的 auth.json",
              }),
              { duration: 6000 },
            );
          }
          if (hasOtherWarnings) {
            toast.warning(
              t("notifications.backfillWarning", {
                defaultValue:
                  "切换成功，但旧供应商配置回填失败，您手动修改的配置可能未保存",
              }),
              { duration: 5000 },
            );
          }
        }

        let messageKey = "notifications.switchSuccess";
        let defaultMessage = "切换成功！";
        if (activeApp === "codex") {
          messageKey = "notifications.codexRestartRequired";
          defaultMessage = "切换成功，请重启客户端以生效";
        } else if (activeApp === "opencode") {
          messageKey = "notifications.addToConfigSuccess";
          defaultMessage = "已添加到配置";
        }
        const message = t(messageKey, { defaultValue: defaultMessage });
        toast.success(message, {
          closeButton: true,
        });
      } catch {
        // 错误提示由 mutation 处理
      }
    },
    [switchProviderMutation, syncClaudePlugin, activeApp, t],
  );

  // 删除供应商
  const deleteProvider = useCallback(
    async (id: string) => {
      await deleteProviderMutation.mutateAsync(id);
    },
    [deleteProviderMutation],
  );

  // 保存用量脚本
  const saveUsageScript = useCallback(
    async (provider: Provider, script: UsageScript) => {
      try {
        const updatedProvider: Provider = {
          ...provider,
          meta: {
            ...provider.meta,
            usage_script: script,
          },
        };

        if (activeApp === "pi") {
          await piApi.updateProviderUsageScript(provider.id, script, activeApp);
        } else {
          await providersApi.update(updatedProvider, activeApp);
        }
        await queryClient.invalidateQueries({
          queryKey: ["providers", activeApp],
        });
        // 🔧 保存用量脚本后，也应该失效该 provider 的用量查询缓存
        // 这样主页列表会使用新配置重新查询，而不是使用测试时的缓存
        await queryClient.invalidateQueries({
          queryKey: usageKeys.script(provider.id, activeApp),
        });
        await queryClient.invalidateQueries({
          queryKey: ["subscription", "quota", activeApp],
        });
        toast.success(
          t("provider.usageSaved", {
            defaultValue: "用量查询配置已保存",
          }),
          { closeButton: true },
        );
      } catch (error) {
        const detail =
          extractErrorMessage(error) ||
          t("provider.usageSaveFailed", {
            defaultValue: "用量查询配置保存失败",
          });
        toast.error(detail);
      }
    },
    [activeApp, queryClient, t],
  );

  // OpenCode：只写 opencode.json 顶层 model，small_model 不动
  const setOpenCodeDefaultModel = useCallback(
    async (provider: Provider, modelId?: string) => {
      const modelIds = getOpencodeDeclaredModels(
        provider.id,
        provider.settingsConfig,
      ).map((model) => model.id);
      if (modelIds.length === 0) {
        toast.error(
          t("notifications.openclawNoModels", {
            defaultValue: "该供应商没有配置模型",
          }),
        );
        return;
      }
      const selected = modelId ?? modelIds[0];
      if (!modelIds.includes(selected)) {
        toast.error(
          t("notifications.openclawModelNotFound", {
            defaultValue: "所选模型已不存在，请刷新后重试",
          }),
        );
        return;
      }

      try {
        await providersApi.setOpenCodeDefaultModel(
          `${provider.id}/${selected}`,
        );
        await queryClient.invalidateQueries({
          queryKey: ["opencodeDefaultModel"],
        });
        toast.success(
          t("notifications.openclawDefaultModelSet", {
            defaultValue: "已设为默认模型",
          }),
          { closeButton: true },
        );
      } catch (error) {
        toast.error(
          extractErrorMessage(error) ||
            t("notifications.openclawDefaultModelSetFailed", {
              defaultValue: "设置默认模型失败",
            }),
        );
      }
    },
    [queryClient, t],
  );

  const setAsDefaultModel = setOpenCodeDefaultModel;

  return {
    addProvider,
    updateProvider,
    switchProvider,
    deleteProvider,
    saveUsageScript,
    setAsDefaultModel,
    isLoading:
      addProviderMutation.isPending ||
      updateProviderMutation.isPending ||
      deleteProviderMutation.isPending ||
      switchProviderMutation.isPending,
  };
}
