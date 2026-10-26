import { invoke } from "@tauri-apps/api/core";
import type { UsageScript } from "@/types";
import type { AppId } from "./types";

/** Pi provider membership and usage-script commands. */
export type PiFamilyAppId = Extract<AppId, "pi">;

export interface PiCurrentState {
  enabledProviderIds: string[];
  defaultProviderId: string | null;
}

export const piApi = {
  async getCurrentState(app: PiFamilyAppId = "pi"): Promise<PiCurrentState> {
    return await invoke(`get_${app}_current_state`);
  },

  async updateProviderUsageScript(
    id: string,
    usageScript: UsageScript,
    app: PiFamilyAppId = "pi",
  ): Promise<boolean> {
    return await invoke("update_pi_provider_usage_script", {
      app,
      id,
      usageScript,
    });
  },
};
