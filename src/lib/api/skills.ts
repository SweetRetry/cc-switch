import { invoke } from "@tauri-apps/api/core";

import type { AppId } from "@/lib/api/types";

export type AppType = AppId;

/** Skill 应用启用状态 */
export interface SkillApps {
  claude: boolean;
  codex: boolean;
  opencode: boolean;
  pi: boolean;
  agy?: boolean;
}

/** 已安装的 Skill（v3.10.0+ 统一结构） */
export interface InstalledSkill {
  id: string;
  name: string;
  description?: string;
  directory: string;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
  readmeUrl?: string;
  apps: SkillApps;
  installedAt: number;
  contentHash?: string;
  updatedAt: number;
}

export interface SkillUninstallResult {
  backupPath?: string;
  preservedPiPath?: string;
  piCleanupIncomplete?: boolean;
}

export interface SkillBackupEntry {
  backupId: string;
  backupPath: string;
  createdAt: number;
  skill: InstalledSkill;
}

/** 未管理的 Skill（用于导入） */
export interface UnmanagedSkill {
  directory: string;
  name: string;
  description?: string;
  foundIn: string[];
  path: string;
}

/** 导入已有 Skill 时提交的应用启用状态 */
export interface ImportSkillSelection {
  directory: string;
  apps: SkillApps;
}

/** Skill 更新信息 */
export interface SkillUpdateInfo {
  id: string;
  name: string;
  currentHash?: string;
  remoteHash: string;
}

/** 没有读到的仓库（检查更新时逐仓库报告） */
export interface SkillRepoFailure {
  owner: string;
  name: string;
  branch: string;
  /** 原始错误；下载类错误是结构化 JSON，用 formatSkillError / skillErrorReason 解析 */
  error: string;
}

/** 检查更新结果：可更新的 Skill + 没读到的仓库 */
export interface SkillUpdateCheckResult {
  updates: SkillUpdateInfo[];
  failures: SkillRepoFailure[];
}

/** 「立即重新同步」里单个应用的结果 */
export interface SkillAppSyncOutcome {
  app: AppType;
  ok: boolean;
  /** 整个应用没同步 */
  error?: string;
  /** 应用同步了，但这些 Skill 失败 */
  failedSkills: Array<{ directory: string; error: string }>;
}

// ========== API ==========

export const skillsApi = {
  // ========== 统一管理 API (v3.10.0+) ==========

  /** 获取所有已安装的 Skills */
  async getInstalled(): Promise<InstalledSkill[]> {
    return await invoke("get_installed_skills");
  },

  /** 获取可恢复的 Skill 备份列表 */
  async getBackups(): Promise<SkillBackupEntry[]> {
    return await invoke("get_skill_backups");
  },

  /** 删除 Skill 备份 */
  async deleteBackup(backupId: string): Promise<boolean> {
    return await invoke("delete_skill_backup", { backupId });
  },

  /** 卸载 Skill（统一卸载） */
  async uninstallUnified(id: string): Promise<SkillUninstallResult> {
    return await invoke("uninstall_skill_unified", { id });
  },

  /** 从备份恢复 Skill */
  async restoreBackup(
    backupId: string,
    currentApp: AppId,
  ): Promise<InstalledSkill> {
    return await invoke("restore_skill_backup", { backupId, currentApp });
  },

  /** 切换 Skill 的应用启用状态 */
  async toggleApp(id: string, app: AppId, enabled: boolean): Promise<boolean> {
    return await invoke("toggle_skill_app", { id, app, enabled });
  },

  /** 扫描未管理的 Skills */
  async scanUnmanaged(): Promise<UnmanagedSkill[]> {
    return await invoke("scan_unmanaged_skills");
  },

  /** 从应用目录导入 Skills */
  async importFromApps(
    imports: ImportSkillSelection[],
  ): Promise<InstalledSkill[]> {
    return await invoke("import_skills_from_apps", { imports });
  },

  /** 检查 Skills 更新，附带没读到的仓库 */
  async checkUpdates(): Promise<SkillUpdateCheckResult> {
    return await invoke("check_skill_updates");
  },

  /** 立即重新同步：按开关和当前同步方式把 Skill 重新投影到各应用目录 */
  async resyncToApps(): Promise<SkillAppSyncOutcome[]> {
    return await invoke("resync_skills_to_apps");
  },

  /** 更新单个 Skill */
  async updateSkill(id: string): Promise<InstalledSkill> {
    return await invoke("update_skill", { id });
  },

  /** Skill 主副本目录（~/.agents/skills） */
  async getSkillsDir(): Promise<string> {
    return await invoke("get_skills_dir");
  },

  /** 在文件管理器里打开 Skill 主副本目录 */
  async openSkillsDir(): Promise<void> {
    await invoke("open_skills_dir");
  },
};
