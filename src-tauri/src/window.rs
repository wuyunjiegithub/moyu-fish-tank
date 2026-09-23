//! 桌面鱼层窗口：透明 / 置顶 / 不占任务栏 / 不抢焦点 / 动态鼠标穿透

use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

use crate::OVERLAY;

/// 铺满主显示器，并进入「全穿透」静默态
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let Some(overlay) = app.get_webview_window(OVERLAY) else {
        return Ok(());
    };

    if let Some(monitor) = overlay.primary_monitor()? {
        let pos = monitor.position();
        let size = monitor.size();
        overlay.set_position(PhysicalPosition::new(pos.x, pos.y))?;
        overlay.set_size(PhysicalSize::new(size.width, size.height))?;
    }

    // 默认整层穿透：桌面操作完全不受影响，命中鱼时前端再临时接管
    overlay.set_ignore_cursor_events(true)?;
    // 不抢焦点，点鱼不会让用户当前窗口失活
    overlay.set_focusable(false)?;

    Ok(())
}

/// 动态穿透开关
pub fn set_click_through(app: &AppHandle, enabled: bool) {
    if let Some(overlay) = app.get_webview_window(OVERLAY) {
        let _ = overlay.set_ignore_cursor_events(enabled);
    }
}

/// 桌面鱼层的逻辑尺寸（CSS px），与前端 `window.innerWidth/Height` 一致
pub fn overlay_logical_size(app: &AppHandle) -> (f64, f64) {
    app.get_webview_window(OVERLAY)
        .and_then(|overlay| {
            let size = overlay.inner_size().ok()?;
            let scale = overlay.scale_factor().ok()?;
            Some((size.width as f64 / scale, size.height as f64 / scale))
        })
        .unwrap_or((1280.0, 800.0))
}

pub fn show_overlay(app: &AppHandle) {
    if let Some(overlay) = app.get_webview_window(OVERLAY) {
        let _ = overlay.show();
    }
}
