//! 全局鼠标位置轮询。
//!
//! 桌面鱼层处于穿透态时收不到任何鼠标事件，而「鱼感知鼠标」又必须知道指针在哪，
//! 所以由 Rust 侧以 ~60ms 轮询并广播物理像素坐标，前端自行换算为 CSS px。

use std::{thread, time::Duration};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::{EVT_CURSOR_MOVE, OVERLAY};

const POLL_INTERVAL: Duration = Duration::from_millis(60);

#[derive(Clone, Serialize)]
struct CursorPayload {
    x: f64,
    y: f64,
}

pub fn spawn(app: AppHandle) {
    thread::spawn(move || loop {
        thread::sleep(POLL_INTERVAL);

        let Some(overlay) = app.get_webview_window(OVERLAY) else {
            continue;
        };
        if !overlay.is_visible().unwrap_or(false) {
            continue;
        }
        // 鱼层铺满主显示器且原点在 (0,0)，窗口坐标即全局坐标
        if let Ok(pos) = overlay.cursor_position() {
            let _ = app.emit_to(OVERLAY, EVT_CURSOR_MOVE, CursorPayload { x: pos.x, y: pos.y });
        }
    });
}
