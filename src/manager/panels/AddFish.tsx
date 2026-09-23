import { useState } from 'react';
import type { FishSpeciesId } from '@/types';
import { PRESET_SPECIES, suggestName } from '@/fish/species';
import { FishRenderer } from '@/fish/renderer';
import { useFishStore } from '@/store/fishStore';
import { play } from '@/audio';

export function AddFish() {
  const count = useFishStore((s) => s.fishes.length);
  const maxFish = useFishStore((s) => s.settings.maxFish);
  const addFish = useFishStore((s) => s.addFish);

  const [speciesId, setSpeciesId] = useState<FishSpeciesId>('goldfish');
  const [name, setName] = useState(() => suggestName('goldfish'));
  const [busy, setBusy] = useState(false);

  const full = count >= maxFish;

  const pick = (id: FishSpeciesId) => {
    setSpeciesId(id);
    setName(suggestName(id));
  };

  const submit = async () => {
    const trimmed = name.trim() || suggestName(speciesId);
    setBusy(true);
    try {
      await addFish(speciesId, trimmed);
      play('bubble');
      setName(suggestName(speciesId));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-card rounded-panel p-md">
      <div className="mb-sm flex items-baseline gap-sm px-xs">
        <h2 className="text-[13px] font-medium text-on-surface">添一尾鱼</h2>
        {full && <span className="text-[11px] text-coral">已达上限，先放生一尾</span>}
      </div>

      <div className="grid grid-cols-4 gap-xs">
        {PRESET_SPECIES.map((species) => {
          const active = species.id === speciesId;
          return (
            <button
              key={species.id}
              type="button"
              onClick={() => pick(species.id)}
              className={`flex flex-col items-center gap-1 rounded-nested px-xs py-sm transition-all duration-150 ${
                active
                  ? 'bg-primary/10 shadow-[inset_0_0_0_1px_rgb(58_142_154/0.35)]'
                  : 'bg-white/45 hover:bg-white/70'
              }`}
            >
              <FishRenderer speciesId={species.id} palette={species.palette} size={40} />
              <span
                className={`text-[10px] ${active ? 'font-medium text-primary' : 'text-river-slate'}`}
              >
                {species.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-md flex items-center gap-xs">
        <input
          className="field"
          value={name}
          maxLength={12}
          placeholder="给它起个名字"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !full && !busy) void submit();
          }}
        />
        <button
          type="button"
          className="btn-ghost shrink-0"
          title="换个名字"
          onClick={() => setName(suggestName(speciesId))}
        >
          随机
        </button>
        <button
          type="button"
          className="btn-primary shrink-0"
          disabled={full || busy}
          onClick={() => void submit()}
        >
          放入桌面
        </button>
      </div>
    </section>
  );
}
