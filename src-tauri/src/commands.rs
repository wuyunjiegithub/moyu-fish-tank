//! IPC 命令层：前端访问后端能力的唯一出口

use std::sync::atomic::Ordering;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_autostart::ManagerExt as _;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::{
    broadcast_fishes,
    store::{now_ms, FishRecord, FishStat, Palette, PositionUpdate, Settings, SettingsPatch},
    window, AppState, EVT_BOSS_KEY, EVT_FEED, EVT_FISH_STATS, EVT_SETTINGS_CHANGED, MANAGER,
    OVERLAY,
};

#[derive(Clone, serde::Serialize)]
struct FeedPayload {
    width: f64,
    height: f64,
}

// ---------------------------------------------------------------- 鱼群

#[tauri::command]
pub fn list_fishes(state: State<'_, AppState>) -> Vec<FishRecord> {
    state.fish_records()
}

#[tauri::command]
pub fn add_fish(
    app: AppHandle,
    state: State<'_, AppState>,
    species_id: String,
    name: String,
    palette: Option<Palette>,
) -> Result<FishRecord, String> {
    let settings = state.settings_snapshot();

    let mut fishes = state.fishes.lock().map_err(|e| e.to_string())?;
    if fishes.len() as u32 >= settings.max_fish {
        return Err(format!("鱼缸满了，最多养 {} 尾", settings.max_fish));
    }

    let (width, height) = window::overlay_logical_size(&app);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);

    let record = FishRecord {
        id: format!("fish-{nanos:08x}-{:04x}", fishes.len()),
        name,
        species_id,
        x: width * 0.5 + (nanos % 240) as f64 - 120.0,
        y: height * 0.4 + ((nanos / 240) % 160) as f64 - 80.0,
        hunger: 30.0,
        scale: 1.0,
        created_at: now_ms(),
        palette_override: palette,
    };

    fishes.push(record.clone());
    drop(fishes);

    state.flush_fishes();
    broadcast_fishes(&app);
    Ok(record)
}

#[tauri::command]
pub fn remove_fish(app: AppHandle, state: State<'_, AppState>, id: String) {
    if let Ok(mut fishes) = state.fishes.lock() {
        fishes.retain(|f| f.id != id);
    }
    state.flush_fishes();
    broadcast_fishes(&app);
}

#[tauri::command]
pub fn rename_fish(app: AppHandle, state: State<'_, AppState>, id: String, name: String) {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return;
    }
    if let Ok(mut fishes) = state.fishes.lock() {
        if let Some(fish) = fishes.iter_mut().find(|f| f.id == id) {
            fish.name = trimmed.to_string();
        }
    }
    state.flush_fishes();
    broadcast_fishes(&app);
}

/// 桌面鱼层定期回传坐标。只更新内存 + 标记待落盘，
/// 不广播 `fish://changed`（否则整缸鱼每 2 秒被重建一次），
/// 饥饿度另走轻量事件推给管理端。
#[tauri::command]
pub fn sync_positions(app: AppHandle, state: State<'_, AppState>, positions: Vec<PositionUpdate>) {
    if positions.is_empty() {
        return;
    }

    if let Ok(mut fishes) = state.fishes.lock() {
        for update in &positions {
            if let Some(fish) = fishes.iter_mut().find(|f| f.id == update.id) {
                fish.x = update.x;
                fish.y = update.y;
                fish.hunger = update.hunger;
            }
        }
    }
    state.mark_dirty();

    let stats: Vec<FishStat> = positions
        .into_iter()
        .map(|p| FishStat {
            id: p.id,
            hunger: p.hunger,
        })
        .collect();
    let _ = app.emit_to(MANAGER, EVT_FISH_STATS, stats);
}

// ---------------------------------------------------------------- 设置

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings_snapshot()
}

#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    state: State<'_, AppState>,
    patch: SettingsPatch,
) -> Result<Settings, String> {
    let (next, boss_changed) = {
        let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
        let previous_boss = settings.boss_key.clone();
        settings.apply(patch);
        (settings.clone(), settings.boss_key != previous_boss)
    };

    state.flush_settings();

    let autolaunch = app.autolaunch();
    let _ = if next.launch_at_startup {
        autolaunch.enable()
    } else {
        autolaunch.disable()
    };

    if boss_changed {
        register_boss_key(&app, &next.boss_key);
    }

    let _ = app.emit(EVT_SETTINGS_CHANGED, next.clone());
    Ok(next)
}

// ---------------------------------------------------------------- 窗口与交互

#[tauri::command]
pub fn set_click_through(app: AppHandle, enabled: bool) {
    window::set_click_through(&app, enabled);
}

/// 鱼层首帧画完再显示，避免透明窗口白闪
#[tauri::command]
pub fn overlay_ready(app: AppHandle) {
    if !app.state::<AppState>().hidden.load(Ordering::Relaxed) {
        window::show_overlay(&app);
    }
}

#[tauri::command]
pub fn feed(app: AppHandle) {
    let (width, height) = window::overlay_logical_size(&app);
    let _ = app.emit_to(OVERLAY, EVT_FEED, FeedPayload { width, height });
}

#[tauri::command]
pub fn hide_manager(app: AppHandle) {
    if let Some(manager) = app.get_webview_window(MANAGER) {
        let _ = manager.hide();
    }
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.state::<AppState>().flush_fishes();
    app.exit(0);
}

// ---------------------------------------------------------------- 内部工具

pub fn show_manager(app: &AppHandle) {
    if let Some(manager) = app.get_webview_window(MANAGER) {
        let _ = manager.show();
        let _ = manager.set_focus();
    }
}

/// 有人又双击了一次图标：单实例插件挡下第二个进程后走这里，
/// 把已经在跑的这份叫到台前，不然用户会觉得「点了没反应」。
pub fn reveal(app: &AppHandle) {
    if app.state::<AppState>().hidden.load(Ordering::Relaxed) {
        // 鱼层正被老板键藏着，先解除隐藏，否则管理窗口出来了桌面仍是空的
        apply_boss_key(app, false);
    }
    show_manager(app);
}

/// 老板键：一键收起鱼群与管理窗口，再按一次还原
pub fn apply_boss_key(app: &AppHandle, active: bool) {
    let state = app.state::<AppState>();
    state.hidden.store(active, Ordering::Relaxed);

    // 窗口要藏起来了，先交还鼠标：否则再出现时会继续吞掉整个桌面的点击
    window::set_click_through(app, true);

    if active {
        // 记下管理窗口此刻是否可见，还原时不要擅自把它弹出来
        let visible = app
            .get_webview_window(MANAGER)
            .and_then(|w| w.is_visible().ok())
            .unwrap_or(false);
        state.manager_was_visible.store(visible, Ordering::Relaxed);

        if let Some(manager) = app.get_webview_window(MANAGER) {
            let _ = manager.hide();
        }
        if let Some(overlay) = app.get_webview_window(OVERLAY) {
            let _ = overlay.hide();
        }
    } else {
        window::show_overlay(app);
        if state.manager_was_visible.load(Ordering::Relaxed) {
            show_manager(app);
        }
    }

    let _ = app.emit(EVT_BOSS_KEY, active);
}

/// 注册全局老板键。字符串来自设置，解析失败则静默降级为「无快捷键」。
pub fn register_boss_key(app: &AppHandle, accelerator: &str) {
    let shortcuts = app.global_shortcut();
    let _ = shortcuts.unregister_all();

    let Ok(shortcut) = accelerator.parse::<Shortcut>() else {
        return;
    };
    let _ = shortcuts.register(shortcut);
}
