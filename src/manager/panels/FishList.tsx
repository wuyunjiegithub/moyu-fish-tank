import { useEffect, useState } from 'react';
import { GROWTH_LABEL, getSpecies, growthScale, growthStageOf, paletteOf } from '@/fish/species';
import { FishRenderer } from '@/fish/renderer';
import { useFishStore } from '@/store/fishStore';
import { play } from '@/audio';

const hungerLabel = (hunger: number) =>
  hunger < 30 ? '吃得饱饱' : hunger < 70 ? '有点饿了' : '饿得发慌';

const hungerTone = (hunger: number) =>
  hunger < 30 ? 'var(--color-primary)' : hunger < 70 ? 'var(--color-mist)' : 'var(--color-coral)';

const ageLabel = (ms: number) => {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分钟`;
};

export function FishList() {
  const fishes = useFishStore((s) => s.fishes);
  const maxFish = useFishStore((s) => s.settings.maxFish);
  const renameFish = useFishStore((s) => s.renameFish);
  const removeFish = useFishStore((s) => s.removeFish);

  const [draft, setDraft] = useState<{ id: string; value: string } | null>(null);
  // 成长慢到按小时计，但年龄文案得跟着走，30 秒刷一次就够
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const commit = async () => {
    if (!draft) return;
    await renameFish(draft.id, draft.value);
    setDraft(null);
  };

  return (
    <section className="glass-card flex min-h-0 flex-col rounded-panel p-md">
      <div className="mb-sm flex items-baseline gap-sm px-xs">
        <h2 className="text-[13px] font-medium text-on-surface">鱼群</h2>
        <span className="text-[11px] text-muted">
          {fishes.length} / {maxFish}
        </span>
      </div>

      {fishes.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-nested bg-white/40 px-lg text-center">
          <p className="text-[12px] leading-relaxed text-muted">
            缸里还空着
            <br />
            从右侧挑一尾鱼放进桌面
          </p>
        </div>
      ) : (
        <ul className="scroll-slim -mr-xs flex min-h-0 flex-1 flex-col gap-sm overflow-y-auto pr-xs">
          {fishes.map((fish) => {
            const species = getSpecies(fish.speciesId);
            const editing = draft?.id === fish.id;
            const age = now - fish.createdAt;
            const growth = growthScale(age);

            return (
              <li
                key={fish.id}
                className="rim flex items-center gap-md rounded-card bg-white/60 p-sm transition-colors duration-150 hover:bg-white/80"
              >
                <div className="grid h-13 w-13 shrink-0 place-items-center">
                  <FishRenderer
                    speciesId={fish.speciesId}
                    palette={paletteOf(fish)}
                    size={Math.round(46 * growth)}
                    finPeriod={1.5}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {editing ? (
                    <input
                      autoFocus
                      className="field py-1"
                      value={draft.value}
                      maxLength={12}
                      onChange={(e) => setDraft({ id: fish.id, value: e.target.value })}
                      onBlur={() => void commit()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void commit();
                        if (e.key === 'Escape') setDraft(null);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-xs">
                      <button
                        type="button"
                        className="block max-w-full truncate text-left text-[12px] font-medium text-on-surface"
                        title="点击重命名"
                        onClick={() => setDraft({ id: fish.id, value: fish.name })}
                      >
                        {fish.name}
                      </button>
                      <span
                        className="shrink-0 rounded-pill bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        title={`已养 ${ageLabel(age)}`}
                      >
                        {GROWTH_LABEL[growthStageOf(age)]} · 体长 {Math.round(growth * 100)}%
                      </span>
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-sm">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-mist/20">
                      <div
                        className="h-full rounded-pill transition-[width] duration-500"
                        style={{ width: `${fish.hunger}%`, background: hungerTone(fish.hunger) }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-muted">
                      {species.name} · {hungerLabel(fish.hunger)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-btn shrink-0"
                  title="放生"
                  onClick={() => {
                    play('release');
                    void removeFish(fish.id);
                  }}
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
