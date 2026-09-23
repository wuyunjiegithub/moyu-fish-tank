import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { FishPalette, FishRecord, FishSpeciesId, PositionUpdate, Settings } from '@/types';

/** 鱼群数据变更（增删改）——Rust 为唯一数据源，两侧窗口靠它同步 */
export const EVT_FISH_CHANGED = 'fish://changed';
/** 全局鼠标位置（物理像素），由 Rust 侧轮询广播 */
export const EVT_CURSOR_MOVE = 'cursor://move';
/** 老板键开关 */
export const EVT_BOSS_KEY = 'app://boss-key';
/** 投喂：Rust 广播落食区域 */
export const EVT_FEED = 'fish://feed';
/** 饥饿度等轻量状态（不含坐标，避免覆盖鱼群列表） */
export const EVT_FISH_STATS = 'fish://stats';
/** 全局设置变更，桌面鱼层据此即时响应 */
export const EVT_SETTINGS_CHANGED = 'settings://changed';

export interface CursorPayload {
  x: number;
  y: number;
}

export interface FeedPayload {
  width: number;
  height: number;
}

export interface FishStat {
  id: string;
  hunger: number;
}

/** 前端访问后端的唯一出口 */
export const api = {
  listFishes: () => invoke<FishRecord[]>('list_fishes'),

  addFish: (speciesId: FishSpeciesId, name: string, palette?: FishPalette) =>
    invoke<FishRecord>('add_fish', { speciesId, name, palette: palette ?? null }),

  removeFish: (id: string) => invoke<void>('remove_fish', { id }),

  renameFish: (id: string, name: string) => invoke<void>('rename_fish', { id, name }),

  /** 桌面鱼层定期回传位置，Rust 侧防抖落盘 */
  syncPositions: (positions: PositionUpdate[]) =>
    invoke<void>('sync_positions', { positions }),

  getSettings: () => invoke<Settings>('get_settings'),

  updateSettings: (patch: Partial<Settings>) => invoke<Settings>('update_settings', { patch }),

  /** 动态鼠标穿透：指针进入鱼的命中区时关闭穿透以接管点击 */
  setClickThrough: (enabled: boolean) => invoke<void>('set_click_through', { enabled }),

  /** 桌面鱼层首帧就绪后再显示窗口，避免透明窗口白闪 */
  overlayReady: () => invoke<void>('overlay_ready'),

  feed: () => invoke<void>('feed'),

  hideManager: () => invoke<void>('hide_manager'),

  quit: () => invoke<void>('quit_app'),
};

export const on = {
  fishChanged: (fn: (fishes: FishRecord[]) => void): Promise<UnlistenFn> =>
    listen<FishRecord[]>(EVT_FISH_CHANGED, (e) => fn(e.payload)),

  cursorMove: (fn: (pos: CursorPayload) => void): Promise<UnlistenFn> =>
    listen<CursorPayload>(EVT_CURSOR_MOVE, (e) => fn(e.payload)),

  bossKey: (fn: (active: boolean) => void): Promise<UnlistenFn> =>
    listen<boolean>(EVT_BOSS_KEY, (e) => fn(e.payload)),

  feed: (fn: (payload: FeedPayload) => void): Promise<UnlistenFn> =>
    listen<FeedPayload>(EVT_FEED, (e) => fn(e.payload)),

  fishStats: (fn: (stats: FishStat[]) => void): Promise<UnlistenFn> =>
    listen<FishStat[]>(EVT_FISH_STATS, (e) => fn(e.payload)),

  settingsChanged: (fn: (settings: Settings) => void): Promise<UnlistenFn> =>
    listen<Settings>(EVT_SETTINGS_CHANGED, (e) => fn(e.payload)),
};
