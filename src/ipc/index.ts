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

/**
 * 引导期读操作的重试包装。
 *
 * `tauri.conf.json` 里声明的窗口会在 Rust 的 `setup()` 之前就开始加载页面。
 * 打包后 bundle 是单个小文件、秒开，鱼层前端首次 invoke 时 `app.manage(AppState)`
 * 还没执行，命令会因为取不到 State 而直接报错，整缸鱼于是变成空的 ——
 * 窗口明明显示了，桌面上却一条鱼都没有。
 * dev 下要等 Vite 逐个下发模块，反而永远排在 setup 之后，所以这个竞态只在打包后暴露。
 *
 * 只包住这两次引导读：其余调用都发生在用户操作时刻，宿主早已就绪，
 * 真出错也该立刻报出来，而不是被重试悄悄掩盖。
 */
const HOST_WAIT_MS = 40;
const HOST_WAIT_TRIES = 50;

const bootInvoke = async <T>(cmd: string): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await invoke<T>(cmd);
    } catch (err) {
      if (attempt >= HOST_WAIT_TRIES) throw err;
      await new Promise((resolve) => setTimeout(resolve, HOST_WAIT_MS));
    }
  }
};

/** 前端访问后端的唯一出口 */
export const api = {
  listFishes: () => bootInvoke<FishRecord[]>('list_fishes'),

  addFish: (speciesId: FishSpeciesId, name: string, palette?: FishPalette) =>
    invoke<FishRecord>('add_fish', { speciesId, name, palette: palette ?? null }),

  removeFish: (id: string) => invoke<void>('remove_fish', { id }),

  renameFish: (id: string, name: string) => invoke<void>('rename_fish', { id, name }),

  /** 桌面鱼层定期回传位置，Rust 侧防抖落盘 */
  syncPositions: (positions: PositionUpdate[]) =>
    invoke<void>('sync_positions', { positions }),

  getSettings: () => bootInvoke<Settings>('get_settings'),

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
