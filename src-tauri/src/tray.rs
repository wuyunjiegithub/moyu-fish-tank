//! 系统托盘：常驻入口，负责显隐、投喂与退出

use std::sync::atomic::Ordering;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

use crate::{commands, AppState};

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "显示管理窗口", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", "隐藏 / 显示鱼群", true, None::<&str>)?;
    let feed = MenuItem::with_id(app, "feed", "投喂", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出摸鱼", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show,
            &toggle,
            &feed,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("摸，摸鱼")
        .menu(&menu)
        // 左键留给「唤起管理窗口」，菜单只走右键
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => commands::show_manager(app),
            "toggle" => {
                let hidden = app.state::<AppState>().hidden.load(Ordering::Relaxed);
                commands::apply_boss_key(app, !hidden);
            }
            "feed" => commands::feed(app.clone()),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                commands::show_manager(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;
    Ok(())
}
