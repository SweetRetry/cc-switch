//! Skills 命令层
//!
//! v3.10.0+ 统一管理架构：
//! - 支持 Claude Code、Codex、OpenCode、Pi 和 Antigravity 开关
//! - SSOT 存储在 ~/.cc-switch/skills/

use crate::app_config::{AppType, InstalledSkill, UnmanagedSkill};
use crate::services::skill::{
    ImportSkillSelection, SkillAppSyncOutcome, SkillBackupEntry, SkillService,
    SkillUninstallResult, SkillUpdateCheckResult,
};
use crate::store::AppState;
use std::str::FromStr;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;

/// SkillService 状态包装
pub struct SkillServiceState(pub Arc<SkillService>);

/// 解析 app 参数为 AppType
fn parse_app_type(app: &str) -> Result<AppType, String> {
    AppType::from_str(app).map_err(|e| e.to_string())
}

// ========== 统一管理命令 ==========

/// 获取所有已安装的 Skills
#[tauri::command]
pub fn get_installed_skills(app_state: State<'_, AppState>) -> Result<Vec<InstalledSkill>, String> {
    SkillService::get_all_installed(&app_state.db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_skill_backups() -> Result<Vec<SkillBackupEntry>, String> {
    SkillService::list_backups().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_skill_backup(backup_id: String) -> Result<bool, String> {
    SkillService::delete_backup(&backup_id).map_err(|e| e.to_string())?;
    Ok(true)
}

/// 卸载 Skill（新版统一卸载）
#[tauri::command]
pub fn uninstall_skill_unified(
    id: String,
    app_state: State<'_, AppState>,
) -> Result<SkillUninstallResult, String> {
    SkillService::uninstall(&app_state.db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_skill_backup(
    backup_id: String,
    current_app: String,
    app_state: State<'_, AppState>,
) -> Result<InstalledSkill, String> {
    let app_type = parse_app_type(&current_app)?;
    SkillService::restore_from_backup(&app_state.db, &backup_id, &app_type)
        .map_err(|e| e.to_string())
}

/// 切换 Skill 的应用启用状态
#[tauri::command]
pub fn toggle_skill_app(
    id: String,
    app: String,
    enabled: bool,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    let app_type = parse_app_type(&app)?;
    SkillService::toggle_app(&app_state.db, &id, &app_type, enabled).map_err(|e| e.to_string())?;
    Ok(true)
}

/// 扫描未管理的 Skills
#[tauri::command]
pub fn scan_unmanaged_skills(
    app_state: State<'_, AppState>,
) -> Result<Vec<UnmanagedSkill>, String> {
    SkillService::scan_unmanaged(&app_state.db).map_err(|e| e.to_string())
}

/// 从应用目录导入 Skills
#[tauri::command]
pub fn import_skills_from_apps(
    imports: Vec<ImportSkillSelection>,
    app_state: State<'_, AppState>,
) -> Result<Vec<InstalledSkill>, String> {
    SkillService::import_from_apps(&app_state.db, imports).map_err(|e| e.to_string())
}

/// 检查 Skills 更新，并逐仓库报告没读到的仓库
#[tauri::command]
pub async fn check_skill_updates(
    service: State<'_, SkillServiceState>,
    app_state: State<'_, AppState>,
) -> Result<SkillUpdateCheckResult, String> {
    service
        .0
        .check_updates_report(&app_state.db)
        .await
        .map_err(|e| e.to_string())
}

/// 立即重新同步：按数据库里的开关和当前同步方式，把 Skill 重新投影到各应用目录，
/// 逐应用返回结果。只动 Skills 目录，不碰各应用的配置文件。
#[tauri::command]
pub async fn resync_skills_to_apps(
    app_state: State<'_, AppState>,
) -> Result<Vec<SkillAppSyncOutcome>, String> {
    let db = app_state.db.clone();
    tauri::async_runtime::spawn_blocking(move || SkillService::resync_all_apps(&db))
        .await
        .map_err(|e| format!("重新同步 Skill 失败: {e}"))
}

/// 更新单个 Skill
#[tauri::command]
pub async fn update_skill(
    id: String,
    service: State<'_, SkillServiceState>,
    app_state: State<'_, AppState>,
) -> Result<InstalledSkill, String> {
    service
        .0
        .update_skill(&app_state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Skill 主副本目录（~/.agents/skills/）
#[tauri::command]
pub async fn get_skills_dir() -> Result<String, String> {
    let dir = SkillService::get_ssot_dir().map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// 在系统文件管理器里打开 Skill 主副本目录
#[tauri::command]
pub async fn open_skills_dir(handle: AppHandle) -> Result<bool, String> {
    let dir = SkillService::get_ssot_dir().map_err(|e| e.to_string())?;
    handle
        .opener()
        .open_path(dir.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| format!("打开文件夹失败: {e}"))?;
    Ok(true)
}
