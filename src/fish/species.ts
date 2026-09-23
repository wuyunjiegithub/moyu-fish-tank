import type {
  DesktopBounds,
  Fish,
  FishPalette,
  FishSpecies,
  FishSpeciesId,
  GrowthStage,
  Settings,
  SpecialEffect,
} from '@/types';

/**
 * 内置鱼种预设。
 * 新增鱼种 = 在此追加一项 + 在 art/ 下补一个同 id 的矢量组件。
 */
export const PRESET_SPECIES: readonly FishSpecies[] = [
  {
    id: 'goldfish',
    name: '小金鱼',
    subtitle: '经典灵动',
    defaultStatus: '活跃游动中',
    description: '圆润活泼的传统金鱼，喜欢在中层水域悠游摆尾。',
    palette: { primary: '#ff6b6b', accent: '#fde047', tail: '#fb923c' },
    speedMultiplier: 1.0,
    scale: 1,
    tendency: 'active',
    zone: 'middle',
  },
  {
    id: 'clownfish',
    name: '小丑鱼',
    subtitle: '喜欢珊瑚',
    defaultStatus: '沿边缘环游',
    description: '身披白条纹的小丑鱼，性格调皮，爱在屏幕边缘与任务栏附近巡游。',
    palette: { primary: '#f97316', accent: '#ffffff', tail: '#fb923c' },
    speedMultiplier: 1.45,
    scale: 0.95,
    tendency: 'playful',
    zone: 'corner',
  },
  {
    id: 'betta',
    name: '斗鱼',
    subtitle: '优雅尾鳍',
    defaultStatus: '优雅漫游中',
    description: '青蓝渐变的大尾斗鱼，游动如绸缎般舒展，孤傲而美丽。',
    palette: { primary: '#0d9488', accent: '#a855f7', tail: '#38bdf8' },
    speedMultiplier: 0.78,
    scale: 1.1,
    tendency: 'elegant',
    zone: 'middle',
  },
  {
    id: 'puffer',
    name: '河豚',
    subtitle: '偶尔胀气',
    defaultStatus: '在底部发呆',
    description: '呆萌的河豚，喜欢沉在屏幕下方打盹，被戳时会瞬间胀成圆球。',
    palette: { primary: '#0ea5e9', accent: '#ffffff', tail: '#7dd3fc' },
    speedMultiplier: 0.6,
    scale: 1.05,
    tendency: 'lazy_bottom',
    zone: 'bottom',
  },
] as const;

const SPECIES_BY_ID = new Map<FishSpeciesId, FishSpecies>(
  PRESET_SPECIES.map((s) => [s.id, s]),
);

const FALLBACK_SPECIES: FishSpecies = {
  id: 'goldfish',
  name: '小鱼',
  subtitle: '悠游中',
  defaultStatus: '悠游中',
  description: '一尾来历不明的小鱼。',
  palette: { primary: '#38bdf8', accent: '#ffffff', tail: '#a855f7' },
  speedMultiplier: 1,
  scale: 1,
  tendency: 'wanderer',
  zone: 'middle',
};

export function getSpecies(id: FishSpeciesId): FishSpecies {
  return SPECIES_BY_ID.get(id) ?? FALLBACK_SPECIES;
}

/** 取实际生效的配色：自定义覆盖优先，否则用鱼种预设 */
export function paletteOf(fish: { speciesId: FishSpeciesId; paletteOverride?: FishPalette }): FishPalette {
  return fish.paletteOverride ?? getSpecies(fish.speciesId).palette;
}

/** 落盘里的 scale 是用户倍率，乘上鱼种基准才是最终显示倍率 */
export const resolveScale = (id: FishSpeciesId, userScale = 1): number =>
  getSpecies(id).scale * userScale;

// ------------------------------------------------------------------ 专属表演

/** 每尾鱼被双击时拿出手的绝活 */
export const SPECIES_SPECIAL: Record<FishSpeciesId, SpecialEffect> = {
  goldfish: 'spin',
  clownfish: 'bubbles',
  betta: 'wag',
  puffer: 'pop',
  custom: 'bubbles',
};

export const specialEffectOf = (id: FishSpeciesId): SpecialEffect => SPECIES_SPECIAL[id];

/** 走 CSS 类实现的那几种表演（pop 靠 --puff、bubbles 靠粒子，不在此列） */
export const FX_CLASS: Partial<Record<SpecialEffect, string>> = {
  spin: 'fx-spin',
  wag: 'fx-wag',
};

// ------------------------------------------------------------------ 成长

const HOUR_MS = 3_600_000;
/** 幼鱼期时长 */
const JUVENILE_MS = 3 * HOUR_MS;
/**
 * 长到满体长所需时长。
 * 想快速预览成长阶段（调试用），只改这一个常量即可 —— 比如改成 3 * HOUR_MS。
 */
export const GROWTH_FULL_MS = 24 * HOUR_MS;

export const GROWTH_LABEL: Record<GrowthStage, string> = {
  fry: '幼鱼',
  juvenile: '亚成',
  adult: '成鱼',
};

export const growthStageOf = (ageMs: number): GrowthStage =>
  ageMs >= GROWTH_FULL_MS ? 'adult' : ageMs >= JUVENILE_MS ? 'juvenile' : 'fry';

/**
 * 体长倍率 0.62 → 1。
 * 用开方而非直线：幼鱼长得快、越接近成鱼越慢，比线性更接近真实生长。
 */
export const growthScale = (ageMs: number): number =>
  0.62 + 0.38 * Math.sqrt(Math.min(1, Math.max(0, ageMs / GROWTH_FULL_MS)));

const NAME_POOL: Record<FishSpeciesId, readonly string[]> = {
  goldfish: ['泡泡', '金豆', '圆圆', '锦儿', '点点'],
  clownfish: ['橙仔', '尼莫', '条纹', '花花', '小飞'],
  betta: ['蓝羽', '轻纱', '墨影', '流光', '碧落'],
  puffer: ['嘟嘟', '皮皮', '气鼓鼓', '墩墩', '刺球'],
  custom: ['小游'],
};

export function suggestName(id: FishSpeciesId): string {
  const pool = NAME_POOL[id];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick ?? '小游';
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** 在给定水域内取一个符合鱼种倾向的目标点 */
export function sampleTarget(
  species: FishSpecies,
  bounds: DesktopBounds,
): { x: number; y: number } {
  const { width: w, height: h } = bounds;
  // 留白只保证鱼身不出屏、不钻到任务栏底下，其余整块桌面都算水域
  const marginX = 56;
  const marginTop = 56;
  const marginBottom = 92;

  switch (species.zone) {
    case 'bottom':
      return { x: rand(marginX, w - marginX), y: rand(h * 0.5, h - marginBottom) };
    case 'surface':
      return { x: rand(marginX, w - marginX), y: rand(marginTop, h * 0.42) };
    case 'corner': {
      // 偏爱屏幕边缘与底部任务栏一带
      const nearBottom = Math.random() < 0.45;
      return nearBottom
        ? { x: rand(marginX, w - marginX), y: rand(h - 150, h - marginBottom) }
        : { x: rand(marginX, w - marginX), y: rand(marginTop, h - 200) };
    }
    default:
      return { x: rand(marginX, w - marginX), y: rand(marginTop, h - marginBottom) };
  }
}

let seq = 0;

/** 由鱼种配置实例化一尾可运行的鱼 */
export function createFish(
  speciesId: FishSpeciesId,
  name: string,
  bounds: DesktopBounds,
  record?: { id?: string; x?: number; y?: number; hunger?: number; scale?: number; createdAt?: number },
): Fish {
  const species = getSpecies(speciesId);
  const x = record?.x ?? rand(120, Math.max(160, bounds.width - 120));
  const y = record?.y ?? rand(120, Math.max(160, bounds.height - 120));
  const target = sampleTarget(species, bounds);
  // 老存档没有出生时间：按「刚出生」算，会以幼鱼形态出现并开始长大
  const createdAt = record?.createdAt ?? Date.now();

  return {
    id: record?.id ?? `fish-${Date.now().toString(36)}-${(seq += 1)}`,
    name,
    speciesId,
    x,
    y,
    vx: rand(-0.8, 0.8),
    vy: rand(-0.4, 0.4),
    targetX: target.x,
    targetY: target.y,
    angle: 0,
    facingLeft: Math.random() > 0.5,
    state: 'swim',
    statusText: `${name} · ${species.defaultStatus}`,
    hunger: record?.hunger ?? 30,
    scale: resolveScale(speciesId, record?.scale),
    finSeed: Math.random(),
    puffProgress: 0,
    stateTimer: 0,
    idleTime: 0,
    specialTimer: 0,
    specialProgress: 0,
    pointerDwell: 0,
    cruise: rand(0.78, 1.32),
    agility: rand(0.7, 1.5),
    restless: rand(0.6, 1.8),
    beat: Math.random(),
    createdAt,
    growth: growthScale(Date.now() - createdAt),
    stage: growthStageOf(Date.now() - createdAt),
  };
}

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  ambientBubbles: true,
  launchAtStartup: false,
  // 与 Rust 侧 Settings::default() 保持一致：裸 Esc 会劫持全系统键盘
  bossKey: 'CommandOrControl+Shift+H',
  maxFish: 12,
};
