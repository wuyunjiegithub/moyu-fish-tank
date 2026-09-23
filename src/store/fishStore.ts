import { create } from 'zustand';
import type { UnlistenFn } from '@tauri-apps/api/event';
import type { FishRecord, FishSpeciesId, Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/fish/species';
import { api, on } from '@/ipc';

interface FishStore {
  fishes: FishRecord[];
  settings: Settings;
  /** 首次加载完成前不渲染列表，避免空态闪动 */
  ready: boolean;

  load: () => Promise<void>;
  /** 订阅 Rust 广播，返回取消订阅函数 */
  subscribe: () => Promise<UnlistenFn>;
  addFish: (speciesId: FishSpeciesId, name: string) => Promise<void>;
  removeFish: (id: string) => Promise<void>;
  renameFish: (id: string, name: string) => Promise<void>;
  patchSettings: (patch: Partial<Settings>) => Promise<void>;
}

export const useFishStore = create<FishStore>((set) => ({
  fishes: [],
  settings: DEFAULT_SETTINGS,
  ready: false,

  load: async () => {
    const [fishes, settings] = await Promise.all([api.listFishes(), api.getSettings()]);
    set({ fishes, settings, ready: true });
  },

  subscribe: () => {
    const pending: Promise<UnlistenFn>[] = [
      on.fishChanged((fishes) => {
        set({ fishes });
      }),
      // 坐标由鱼层独占，管理端只吃饥饿度这类轻量状态
      on.fishStats((stats) => {
        const hunger = new Map(stats.map((s) => [s.id, s.hunger]));
        set((state) => ({
          fishes: state.fishes.map((f) => {
            const next = hunger.get(f.id);
            return next === undefined ? f : { ...f, hunger: next };
          }),
        }));
      }),
    ];
    return Promise.all(pending).then(
      (unlisteners) => () => unlisteners.forEach((u) => u()),
    );
  },

  addFish: async (speciesId, name) => {
    await api.addFish(speciesId, name);
    // 后端会广播 fish://changed，此处无需本地插入
  },

  removeFish: async (id) => {
    await api.removeFish(id);
  },

  renameFish: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await api.renameFish(id, trimmed);
  },

  patchSettings: async (patch) => {
    const next = await api.updateSettings(patch);
    set({ settings: next });
  },
}));

/** 供非 React 环境（如事件回调）读取当前设置 */
export const currentSettings = () => useFishStore.getState().settings;
