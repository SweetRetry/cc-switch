//! Skills 命令层
//!
//! v3.10.0+ 统一管理架构：
//! - 支持 Claude Code、Codex、OpenCode、Pi 和 Antigravity 开关
//! - SSOT 存储在 ~/.cc-switch/skills/

use crate::app_config::{AppType, InstalledSkill, UnmanagedSkill};
use crate::services::skill::{
    ImportSkillSelection, MigrationResult, SkillAppSyncOutcome, SkillBackupEntry, SkillRepo,
    SkillService, SkillStorageLocation, SkillUninstallResult, SkillUpdateCheckResult,
    ZipInstallResult,
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

/// 迁移 Skill 存储位置
#[tauri::command]
pub async fn migrate_skill_storage(
    target: SkillStorageLocation,
    app_state: State<'_, AppState>,
) -> Result<MigrationResult, String> {
    SkillService::migrate_storage(&app_state.db, target).map_err(|e| e.to_string())
}

/// CC Switch 目录下放 Skill 主副本的位置（改过配置目录就是改后的）
fn cc_switch_skills_dir() -> std::path::PathBuf {
    crate::config::get_app_config_dir().join("skills")
}

/// 「存储与同步」里显示的 CC Switch 目录路径
#[tauri::command]
pub async fn get_cc_switch_skills_dir() -> Result<String, String> {
    Ok(cc_switch_skills_dir().to_string_lossy().to_string())
}

/// 在系统文件管理器里打开 CC Switch 目录下的 Skills 目录（不存在就先建）
#[tauri::command]
pub async fn open_cc_switch_skills_dir(handle: AppHandle) -> Result<bool, String> {
    let dir = cc_switch_skills_dir();
    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| format!("创建目录失败: {e}"))?;
    }
    handle
        .opener()
        .open_path(dir.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| format!("打开文件夹失败: {e}"))?;
    Ok(true)
}

// ========== 仓库管理命令 ==========

/// 获取技能仓库列表
#[tauri::command]
pub fn get_skill_repos(app_state: State<'_, AppState>) -> Result<Vec<SkillRepo>, String> {
    app_state.db.get_skill_repos().map_err(|e| e.to_string())
}

/// 添加技能仓库
#[tauri::command]
pub fn add_skill_repo(repo: SkillRepo, app_state: State<'_, AppState>) -> Result<bool, String> {
    // 整个结构体由前端反序列化而来，owner/name/branch 会被拼进归档下载 URL。
    // 主防线在 download_repo，这里让非法值当场报错而不是沉淀进表。
    SkillService::validate_repo_ref(&repo.owner, &repo.name, &repo.branch)
        .map_err(|e| e.to_string())?;
    app_state
        .db
        .save_skill_repo(&repo)
        .map_err(|e| e.to_string())?;
    Ok(true)
}

/// 删除技能仓库
#[tauri::command]
pub fn remove_skill_repo(
    owner: String,
    name: String,
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    app_state
        .db
        .delete_skill_repo(&owner, &name)
        .map_err(|e| e.to_string())?;
    Ok(true)
}

/// 从 ZIP 文件安装 Skills；目录名已被占用的如实列在 `skipped` 里（#3749）
#[tauri::command]
pub fn install_skills_from_zip(
    file_path: String,
    current_app: String,
    app_state: State<'_, AppState>,
) -> Result<ZipInstallResult, String> {
    let app_type = parse_app_type(&current_app)?;
    let path = std::path::Path::new(&file_path);

    SkillService::install_from_zip(&app_state.db, path, &app_type).map_err(|e| e.to_string())
}
