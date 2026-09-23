import { useFishStore } from '@/store/fishStore';

interface SwitchProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function Switch({ label, hint, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-md rounded-nested px-xs py-1.5 text-left transition-colors duration-150 hover:bg-white/60"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-on-surface">{label}</span>
        <span className="block text-[10px] text-muted">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-pill transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-mist/35'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-pill bg-white shadow-sm transition-all duration-200 ${
            checked ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsPanel() {
  const settings = useFishStore((s) => s.settings);
  const patchSettings = useFishStore((s) => s.patchSettings);

  return (
    <section className="glass-card flex min-h-0 flex-col rounded-panel p-md">
      <h2 className="mb-sm px-xs text-[13px] font-medium text-on-surface">鱼缸设置</h2>

      <div className="scroll-slim -mr-xs min-h-0 flex-1 overflow-y-auto pr-xs">
        <Switch
          label="音效"
          hint="投喂、进食与摸鱼的水声"
          checked={!settings.muted}
          onChange={(v) => void patchSettings({ muted: !v })}
        />
        <Switch
          label="氛围气泡"
          hint="水面浮起的气泡，纯装饰"
          checked={settings.ambientBubbles}
          onChange={(v) => void patchSettings({ ambientBubbles: v })}
        />
        <Switch
          label="开机自启"
          hint="登录后鱼缸自动开张"
          checked={settings.launchAtStartup}
          onChange={(v) => void patchSettings({ launchAtStartup: v })}
        />

        <div className="mt-sm flex items-center gap-md rounded-nested px-xs py-1.5">
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-on-surface">同屏鱼上限</span>
            <span className="block text-[10px] text-muted">防止鱼太多拖慢桌面</span>
          </span>
          <input
            type="range"
            min={4}
            max={30}
            step={1}
            value={settings.maxFish}
            className="h-1 w-24 shrink-0 accent-[var(--color-primary)]"
            onChange={(e) => void patchSettings({ maxFish: Number(e.target.value) })}
          />
          <span className="w-6 shrink-0 text-right text-[11px] font-medium text-primary">
            {settings.maxFish}
          </span>
        </div>
      </div>

      <p className="mt-sm px-xs text-[10px] leading-relaxed text-muted">
        按 <span className="font-medium text-river-slate">{settings.bossKey}</span> 一键隐身，
        再按一次鱼群回来。关掉本窗口，鱼照样在桌面上游。
      </p>
    </section>
  );
}
