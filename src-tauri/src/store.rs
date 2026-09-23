//! JSON 持久化：fishes.json / settings.json
//!
//! 字段命名与前端 `src/types/index.ts` 严格对齐（camelCase），
//! 只落盘「静止语义字段」，速度、角度等运行期状态重启后重新采样。

use std::{
    fs, io,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};

pub const FISHES_FILE: &str = "fishes.json";
pub const SETTINGS_FILE: &str = "settings.json";

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// 鱼种配色覆盖（预留给「自定义 / AI 生成鱼种」）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Palette {
    pub primary: String,
    pub accent: String,
    pub tail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FishRecord {
    pub id: String,
    pub name: String,
    pub species_id: String,
    pub x: f64,
    pub y: f64,
    pub hunger: f64,
    /// 用户倍率，最终显示尺寸 = 鱼种基准 × 该值
    pub scale: f64,
    /// 出生时刻（epoch ms）。成长按真实时间算，关掉软件的那段也在长。
    /// 老存档没有这个字段：反序列化时补成「此刻」，即以幼鱼形态入场并从此开始长大
    #[serde(default = "now_ms")]
    pub created_at: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub palette_override: Option<Palette>,
}

/// 桌面鱼层回传的位置快照
#[derive(Debug, Clone, Deserialize)]
pub struct PositionUpdate {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub hunger: f64,
}

/// 推给管理端的轻量状态（不含坐标，避免覆盖鱼群列表时的无谓重排）
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FishStat {
    pub id: String,
    pub hunger: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub muted: bool,
    pub ambient_bubbles: bool,
    pub launch_at_startup: bool,
    pub boss_key: String,
    pub max_fish: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            muted: false,
            ambient_bubbles: true,
            launch_at_startup: false,
            // 全局热键必须是组合键：单按 Esc 会劫持全系统
            boss_key: "CommandOrControl+Shift+H".into(),
            max_fish: 12,
        }
    }
}

/// 局部更新：只覆盖显式传入的字段
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SettingsPatch {
    pub muted: Option<bool>,
    pub ambient_bubbles: Option<bool>,
    pub launch_at_startup: Option<bool>,
    pub boss_key: Option<String>,
    pub max_fish: Option<u32>,
}

impl Settings {
    pub fn apply(&mut self, patch: SettingsPatch) {
        if let Some(v) = patch.muted {
            self.muted = v;
        }
        if let Some(v) = patch.ambient_bubbles {
            self.ambient_bubbles = v;
        }
        if let Some(v) = patch.launch_at_startup {
            self.launch_at_startup = v;
        }
        if let Some(v) = patch.boss_key {
            self.boss_key = v;
        }
        if let Some(v) = patch.max_fish {
            self.max_fish = v.clamp(1, 60);
        }
    }
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Option<T> {
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

/// 先写临时文件再原子替换，避免断电 / 崩溃留下半截 JSON
fn write_json<T: Serialize>(path: &Path, value: &T) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, serde_json::to_vec_pretty(value)?)?;
    fs::rename(&tmp, path)
}

pub fn load_fishes(dir: &Path) -> Vec<FishRecord> {
    read_json(&dir.join(FISHES_FILE)).unwrap_or_default()
}

pub fn save_fishes(dir: &Path, fishes: &[FishRecord]) -> io::Result<()> {
    write_json(&dir.join(FISHES_FILE), &fishes)
}

pub fn load_settings(dir: &Path) -> Settings {
    read_json(&dir.join(SETTINGS_FILE)).unwrap_or_default()
}

pub fn save_settings(dir: &Path, settings: &Settings) -> io::Result<()> {
    write_json(&dir.join(SETTINGS_FILE), settings)
}

/// 数据目录，首次运行时自动创建
pub fn ensure_dir(dir: &Path) -> io::Result<()> {
    fs::create_dir_all(dir)
}
