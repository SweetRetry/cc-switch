import { invoke } from "@tauri-apps/api/core";

export type ManagedAuthProvider =
  | "github_copilot"
  | "codex_oauth"
  | "xai_oauth"
  | "agy_oauth"
  | "claude_official";

export interface ManagedAuthAccount {
  id: string;
  provider: ManagedAuthProvider;
  login: string;
  avatar_url: string | null;
  authenticated_at: number;
  is_default: boolean;
  github_domain: string;
  /** Codex-only: the account lacks identity or workspace metadata required for binding. */
  reauth_required?: boolean;
  /** xAI-only: the refresh credential is invalid and the account is unusable. */
  requires_reauth: boolean;
  /** Claude official only: when the sign-in of an account not in Claude Code's default slot expires (ms, as last recorded). */
  login_expires_at?: number | null;
  /** Claude official only: plan (`pro` / `max` / `team` / `enterprise`) from the account's sign-in. */
  plan?: string | null;
  /** Claude official only: `rateLimitTier` (e.g. `default_claude_max_20x`), tells Max 5x from 20x. */
  rate_limit_tier?: string | null;
}

export interface ManagedAuthStatus {
  provider: ManagedAuthProvider;
  authenticated: boolean;
  default_account_id: string | null;
  migration_error?: string | null;
  accounts: ManagedAuthAccount[];
}

export async function authGetStatus(
  authProvider: ManagedAuthProvider,
): Promise<ManagedAuthStatus> {
  return invoke<ManagedAuthStatus>("auth_get_status", {
    authProvider,
  });
}

/** 有没有正在运行的 agy：在跑的 agy 还用切换前的账号，续期时可能把旧登录写回去。 */
export async function agyAccountIsRunning(): Promise<boolean> {
  return invoke<boolean>("agy_account_is_running");
}

/** 切卡时切换 Claude Code 登录的状态。 */
export interface ClaudeLoginSwitchStatus {
  /** 切到选了账号的官方卡时会切换登录（没被挡住） */
  active: boolean;
  /** 不切换登录的原因：设了 Claude 配置目录覆盖 */
  blocked: "overrideDir" | null;
  /** Claude Code 现在登录的账号 key */
  live: string | null;
}

export async function getClaudeLoginSwitch(): Promise<ClaudeLoginSwitchStatus> {
  return invoke<ClaudeLoginSwitchStatus>("get_claude_login_switch");
}

export const authApi = {
  authGetStatus,
  agyAccountIsRunning,
  getClaudeLoginSwitch,
};
