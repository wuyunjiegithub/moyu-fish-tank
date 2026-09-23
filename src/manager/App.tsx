import { useEffect, useState } from 'react';
import { useFishStore } from '@/store/fishStore';
import { api } from '@/ipc';
import { setMuted } from '@/audio';
import { FishList } from './panels/FishList';
import { AddFish } from './panels/AddFish';
import { SettingsPanel } from './panels/SettingsPanel';

function FishMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinejoin="round"
    >
      <ellipse cx="9.6" cy="12" rx="7.1" ry="5.5" />
      <path d="M17 12 22.4 8.3v7.4Z" />
      <circle cx="7.2" cy="10.6" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function App() {
  const load = useFishStore((s) => s.load);
  const subscribe = useFishStore((s) => s.subscribe);
  const fishes = useFishStore((s) => s.fishes);
  const settings = useFishStore((s) => s.settings);
  const ready = useFishStore((s) => s.ready);
  const [fed, setFed] = useState(false);

  useEffect(() => {
    void load();
    const unlisten = subscribe();
    return () => void unlisten.then((u) => u());
  }, [load, subscribe]);

  // 管理窗与鱼层各自持有一个 AudioContext，静音开关要各自同步
  useEffect(() => setMuted(settings.muted), [settings.muted]);

  const feed = async () => {
    await api.feed();
    setFed(true);
    window.setTimeout(() => setFed(false), 1600);
  };

  return (
    <div className="glass-panel flex h-screen w-screen flex-col overflow-hidden">
      <header
        data-tauri-drag-region
        className="flex items-center gap-md px-lg pt-lg pb-md"
      >
        <div className="flex items-center gap-sm text-primary" data-tauri-drag-region>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-primary/10">
            <FishMark />
          </span>
          <div data-tauri-drag-region>
            <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-on-surface">
              摸，摸鱼
            </h1>
            <p className="text-[10px] tracking-[0.02em] text-muted">
              桌面鱼缸 · {fishes.length} 尾在游
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-xs">
          <span className="chip">{settings.bossKey} 隐身</span>
          <button type="button" className="btn-primary" onClick={() => void feed()}>
            {fed ? '已投食' : '投喂'}
          </button>
          <button
            type="button"
            className="icon-btn"
            title="收起管理窗口（鱼继续游）"
            onClick={() => void api.hideManager()}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M3.5 8h9" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="退出应用"
            onClick={() => void api.quit()}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
            </svg>
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[1.08fr_1fr] gap-md px-lg pb-lg">
        <FishList />
        <div className="flex min-h-0 flex-col gap-md">
          <AddFish />
          <SettingsPanel />
        </div>
      </main>

      {!ready && (
        <div className="pointer-events-none fixed inset-0 grid place-items-center">
          <span className="glass-float rounded-pill px-lg py-sm text-[12px] text-muted">
            正在打捞鱼缸…
          </span>
        </div>
      )}
    </div>
  );
}
