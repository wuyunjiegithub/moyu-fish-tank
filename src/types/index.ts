/** 鱼种标识。`custom` 预留给后续「自定义 / AI 生成鱼种」 */
export type FishSpeciesId = 'goldfish' | 'clownfish' | 'betta' | 'puffer' | 'custom';

/** 行为状态机的状态集合 */
export type FishState = 'idle' | 'swim' | 'nearMouse' | 'pet' | 'eat' | 'sleep' | 'startle';

/** 双击专属表演。每尾鱼各有一手，见 SPECIES_SPECIAL */
export type SpecialEffect = 'spin' | 'pop' | 'wag' | 'bubbles';

/** 游动倾向：决定随机目标点的采样区域 */
export type FishTendency = 'active' | 'lazy_bottom' | 'wanderer' | 'elegant' | 'playful';

/** 水域偏好 */
export type WaterZone = 'surface' | 'middle' | 'bottom' | 'corner';

/** 鱼的配色，可被自定义鱼种整体覆盖 */
export interface FishPalette {
  primary: string;
  accent: string;
  tail: string;
}

/** 鱼种静态配置：外观 + 行为参数 */
export interface FishSpecies {
  id: FishSpeciesId;
  name: string;
  subtitle: string;
  defaultStatus: string;
  description: string;
  palette: FishPalette;
  speedMultiplier: number;
  scale: number;
  tendency: FishTendency;
  zone: WaterZone;
}

/** 一尾鱼的完整运行期状态 */
export interface Fish {
  id: string;
  name: string;
  speciesId: FishSpeciesId;
  /** 自定义鱼种时覆盖预设外观 */
  paletteOverride?: FishPalette;

  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  /** 弧度，由速度方向推导 */
  angle: number;
  /** 鼻尖是否朝左。素材原稿朝左，故 true 表示不做镜像 */
  facingLeft: boolean;

  state: FishState;
  statusText: string;
  /** 0-100，越高越倾向觅食 */
  hunger: number;

  scale: number;
  /** 鳍摆动相位随机种子，用于每尾鱼错开节奏 */
  finSeed: number;
  /** 河豚鼓气进度 0-1 */
  puffProgress: number;
  /** 状态剩余时长（秒），归零后回到默认状态 */
  stateTimer: number;
  /** 距上次被摸/进食的秒数，用于触发休息 */
  idleTime: number;
  /** 双击表演剩余时长（秒） */
  specialTimer: number;
  /** 双击表演包络 0-1，由 behavior 算好，渲染层直接读 */
  specialProgress: number;
  /** 在鼠标附近逗留的累计秒数，够久就腻了不再凑过去 */
  pointerDwell: number;

  // ---- 个体差异：同种鱼也不能像复制粘贴。属运行时状态，重启后重新采样 ----
  /** 巡航速度倍率，与鱼种速度相乘 */
  cruise: number;
  /** 加速与转向的响应快慢 */
  agility: number;
  /** 换目标的频繁程度 */
  restless: number;
  /** 冲刺—滑行相位 0-1 */
  beat: number;

  /** 出生时刻（epoch ms） */
  createdAt: number;
  /** 成长倍率 0.62 ~ 1，由 createdAt 推出，叠在 scale 上 */
  growth: number;
  /** 当前成长阶段，随 growth 一起更新 */
  stage: GrowthStage;
}

/** 成长阶段。按出生至今的真实时间划分 */
export type GrowthStage = 'fry' | 'juvenile' | 'adult';

/** 落盘格式：只保留静止语义字段 */
export interface FishRecord {
  id: string;
  name: string;
  speciesId: FishSpeciesId;
  x: number;
  y: number;
  hunger: number;
  scale: number;
  /** 出生时刻（epoch ms）。成长按真实时间算，关掉软件也在长 */
  createdAt: number;
  paletteOverride?: FishPalette;
}

/** 鱼粮颗粒 */
export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  vy: number;
  eaten: boolean;
}

/** 氛围气泡 */
export interface AmbientBubble {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  wobbleAmp: number;
  seed: number;
}

export interface Settings {
  muted: boolean;
  ambientBubbles: boolean;
  launchAtStartup: boolean;
  /** 老板键，Tauri 加速键语法，默认 CommandOrControl+Shift+H */
  bossKey: string;
  /** 同屏鱼上限，防止性能失控 */
  maxFish: number;
}

export interface DesktopBounds {
  width: number;
  height: number;
}

/** 桌面鱼层回传给 Rust 的位置快照 */
export interface PositionUpdate {
  id: string;
  x: number;
  y: number;
  hunger: number;
}
