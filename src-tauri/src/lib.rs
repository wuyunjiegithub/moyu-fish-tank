//! 摸，摸鱼 —— Rust 侧作为唯一数据源：
//! 持久化鱼群与设置，向两个窗口广播，并负责桌面鱼层的窗口特性与鼠标穿透。

mod commands;
mod cursor;
mod store;
mod tray;
mod window;

use std::{
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::Duration,
};

use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_global_shortcut::ShortcutState;

use store::{FishRecord, Settings};

/// 鱼群数据变更（增删改）——两侧窗口靠它同步
pub const EVT_FISH_CHANGED: &str = "fish://changed";
/// 全局鼠标位置（物理像素），由 Rust 侧轮询广播
pub const EVT_CURSOR_MOVE: &str = "cursor://move";
/// 老板键开关
pub const EVT_BOSS_KEY: &str = "app://boss-key";
/// 投喂：广播落食区域尺寸
pub const EVT_FEED: &str = "fish://feed";
/// 饥饿度等轻量状态
pub const EVT_FISH_STATS: &str = "fish://stats";
/// 全局设置变更，供桌面鱼层即时响应（如氛围气泡开关）
pub const EVT_SETTINGS_CHANGED: &str = "settings://changed";

pub const MANAGER: &str = "manager";
pub const OVERLAY: &str = "overlay";

pub struct AppState {
    pub fishes: Mutex<Vec<FishRecord>>,
    pub settings: Mutex<Settings>,
    pub dir: PathBuf,
    /// 坐标有变动待落盘，由后台线程按秒合并写入
    pub dirty: AtomicBool,
    /// 老板键生效中
    pub hidden: AtomicBool,
    /// 触发老板键前管理窗口是否可见，用于还原
    pub manager_was_visible: AtomicBool,
}

impl AppState {
    pub fn fish_records(&self) -> Vec<FishRecord> {
        self.fishes.lock().map(|f| f.clone()).unwrap_or_default()
    }

    pub fn settings_snapshot(&self) -> Settings {
        self.settings.lock().map(|s| s.clone()).unwrap_or_default()
    }

    pub fn mark_dirty(&self) {
        self.dirty.store(true, Ordering::Relaxed);
    }

    /// 立即落盘鱼群
    pub fn flush_fishes(&self) {
        self.dirty.store(false, Ordering::Relaxed);
        if let Ok(fishes) = self.fishes.lock() {
            let _ = store::save_fishes(&self.dir, &fishes);
        }
    }

    pub fn flush_settings(&self) {
        if let Ok(settings) = self.settings.lock() {
            let _ = store::save_settings(&self.dir, &settings);
        }
    }
}

/// 把最新鱼群广播给两个窗口
pub fn broadcast_fishes(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let _ = app.emit(EVT_FISH_CHANGED, state.fish_records());
}

pub fn run() {
    // 单实例闸门必须最先挂：注册在它之后的插件，在第二个进程里会先跑完各自的初始化
    // （托盘图标、全局热键、游标轮询各来一份），桌面上就真出现两缸鱼了。
    let gate = tauri_plugin_single_instance::init(|app, _argv, _cwd| {
        // 插件已把第二份进程挡在门外，这里只需把在跑的那份叫到台前
        commands::reveal(app);
    });

    tauri::Builder::default()
        .plugin(gate)
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let hidden = app.state::<AppState>().hidden.load(Ordering::Relaxed);
                    commands::apply_boss_key(app, !hidden);
                }
            })
            .build())
        .invoke_handler(tauri::generate_handler![
            commands::list_fishes,
            commands::add_fish,
            commands::remove_fish,
            commands::rename_fish,
            commands::sync_positions,
            commands::get_settings,
            commands::update_settings,
            commands::set_click_through,
            commands::overlay_ready,
            commands::feed,
            commands::hide_manager,
            commands::quit_app,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            let dir = handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("无法定位数据目录：{e}"))?;
            store::ensure_dir(&dir)?;

            let fishes = store::load_fishes(&dir);
            let settings = store::load_settings(&dir);

            app.manage(AppState {
                fishes: Mutex::new(fishes),
                settings: Mutex::new(settings.clone()),
                dir,
                dirty: AtomicBool::new(false),
                hidden: AtomicBool::new(false),
                manager_was_visible: AtomicBool::new(false),
            });

            window::setup(&handle)?;
            tray::init(&handle)?;
            cursor::spawn(handle.clone());
            commands::register_boss_key(&handle, &settings.boss_key);

            // 后台合并落盘：坐标每 2s 回传一次，这里按秒消化，避免 IO 抖动
            let flush_handle = handle.clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(Duration::from_millis(1000));
                let state = flush_handle.state::<AppState>();
                if state.dirty.swap(false, Ordering::Relaxed) {
                    if let Ok(fishes) = state.fishes.lock() {
                        let _ = store::save_fishes(&state.dir, &fishes);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // 关掉管理窗口只是收起，鱼继续在桌面上游
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == MANAGER {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("启动 Tauri 应用失败")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, code, .. } = event {
                // 托盘常驻：管理窗口全关时不退出进程
                if code.is_none() {
                    api.prevent_exit();
                }
                let state = app.state::<AppState>();
                state.flush_fishes();
            }
        });
}
