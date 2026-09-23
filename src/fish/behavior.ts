import type {
  DesktopBounds,
  Fish,
  FishSpecies,
  FishSpeciesId,
  FoodPellet,
  SpecialEffect,
} from '@/types';
import {
  getSpecies,
  growthScale,
  growthStageOf,
  sampleTarget,
  specialEffectOf,
} from './species';

export interface StepContext {
  /** 秒 */
  dt: number;
  /** 墙钟时间（epoch ms），整帧共用一次，供成长等按真实时间推进的量使用 */
  now: number;
  bounds: DesktopBounds;
  /** 桌面鱼层感知到的鼠标位置；null 表示指针不可用 */
  pointer: { x: number; y: number } | null;
  pellets: readonly FoodPellet[];
  /** 整缸鱼。只用于同伴排斥与目标错开，不做聚拢/对齐 */
  mates: readonly Fish[];
  /** 鼠标此刻压在谁身上 —— 悬停即抚摸 */
  pettedId: string | null;
}

/** 感知半径：进入后鱼会好奇地凑过来 */
const NOTICE_RADIUS = 110;
/** 进食判定半径 */
const EAT_RADIUS = 28;
/** 同伴排斥半径：近了就互相推开，免得整缸鱼糊成一团 */
const SEPARATION = 96;
/** 边界留白 */
const EDGE = 44;
/** 触发休息所需的静默时长（秒） */
const REST_AFTER = 40;
/**
 * 饥饿增速（点/秒）。
 * 100 / 3600 —— 一小时才从「吃得饱饱」走到「饿得发慌」。
 * 这是纯氛围数值、没有数值压力，节奏必须慢到不打扰工作：
 * 原先的 0.5（三分钟就饿透）会让整缸鱼一直挂着红条。
 */
const HUNGER_PER_SECOND = 100 / 3600;
/**
 * 在鼠标附近逗留多久就腻了（秒）。
 * 腻了之后不再凑过来，直到指针离开感知圈 —— 否则鼠标一停，
 * 整缸鱼都会挤过来开会，把桌面中间糊死。
 */
const DWELL_LIMIT = 2.6;
/** 双击表演时长（秒） */
export const SPECIAL_SECONDS = 1.5;
/** 受惊窜开的持续时长（秒）——够它一口气窜到远处 */
const STARTLE_SECONDS = 1.4;
/** 受惊期间的速度倍率：整段保持冲刺，光靠初速的惯性滑行几帧就蔫了 */
const STARTLE_BOOST = 2.6;
/** 受惊逃逸距离（px）：背对鼠标一口气窜出去的远近 */
const STARTLE_FLEE_MIN = 620;
const STARTLE_FLEE_SPAN = 340;

const TILT_LIMIT = 0.42;

const distance = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/** 各鱼各抢最近的一粒，否则整缸鱼会叠在同一条线上追同一颗 */
function nearestPellet(fish: Fish, pellets: readonly FoodPellet[]): FoodPellet | undefined {
  let best: FoodPellet | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const pellet of pellets) {
    if (pellet.eaten) continue;
    const d = distance(fish.x, fish.y, pellet.x, pellet.y);
    if (d < bestDist) {
      bestDist = d;
      best = pellet;
    }
  }
  return best;
}

/**
 * 在若干候选点里挑一个离同伴最远的。
 *
 * 单纯随机采样会让鱼不知不觉挤到同一片水域；多抽几个比一比，
 * 就能把整缸鱼自然摊开，而且不需要任何聚拢/对齐这类群体规则。
 */
function spreadTarget(
  species: FishSpecies,
  bounds: DesktopBounds,
  fish: Fish,
  mates: readonly Fish[],
): { x: number; y: number } {
  const first = sampleTarget(species, bounds);
  if (mates.length < 2) return first;

  let best = first;
  let bestScore = -1;
  for (let i = 0; i < 4; i += 1) {
    const cand = i === 0 ? first : sampleTarget(species, bounds);
    let nearest = Number.POSITIVE_INFINITY;
    for (const mate of mates) {
      if (mate === fish) continue;
      nearest = Math.min(nearest, distance(cand.x, cand.y, mate.x, mate.y));
    }
    if (nearest > bestScore) {
      bestScore = nearest;
      best = cand;
    }
  }
  return best;
}

/** 双击各鱼种的专属表演文案 */
export function specialReaction(id: FishSpeciesId, name: string): string {
  switch (id) {
    case 'puffer':
      return `${name} · 嘭! 胀成了圆鼓鼓的球`;
    case 'goldfish':
      return `${name} · 原地转了个圈圈~`;
    case 'clownfish':
      return `${name} · 咕噜噜吐了一串泡泡`;
    case 'betta':
      return `${name} · 兴高采烈地摇起了尾巴`;
    default:
      return `${name} · 开心地摆了摆尾`;
  }
}

const petReaction = (name: string) => `${name} · 舒服地蹭着你的手~`;

/**
 * 单帧推进一尾鱼的行为与物理。
 * 直接原地修改对象：主循环每秒调用 60 次，避免逐帧分配。
 */
export function stepFish(fish: Fish, ctx: StepContext): void {
  const species = getSpecies(fish.speciesId);
  const { dt, bounds } = ctx;
  const frame = dt * 60;

  // ---- 成长 ----
  // 按出生至今的真实时间算，不累计 dt：这样关掉软件的那段时间也算数
  const age = ctx.now - fish.createdAt;
  fish.growth = growthScale(age);
  fish.stage = growthStageOf(age);

  // ---- 计时器 ----
  if (fish.stateTimer > 0) fish.stateTimer = Math.max(0, fish.stateTimer - dt);
  fish.idleTime += dt;
  fish.hunger = Math.min(100, fish.hunger + dt * HUNGER_PER_SECOND);

  // ---- 双击表演包络 ----
  // 前段迅速起势、后段缓慢回落，收势才不突兀；渲染层只读 specialProgress
  if (fish.specialTimer > 0) {
    fish.specialTimer = Math.max(0, fish.specialTimer - dt);
    const t = 1 - fish.specialTimer / SPECIAL_SECONDS;
    fish.specialProgress = t < 0.26 ? t / 0.26 : Math.max(0, 1 - (t - 0.26) / 0.74);
  } else if (fish.specialProgress !== 0) {
    fish.specialProgress = 0;
  }

  const transient = fish.state === 'eat' || fish.state === 'startle';
  if (transient && fish.stateTimer === 0) {
    fish.state = 'swim';
    fish.statusText = `${fish.name} · ${species.defaultStatus}`;
  }
  // 被摸是实时状态：手一离开就自己回到常态
  if (fish.state === 'pet' && ctx.pettedId !== fish.id) {
    fish.state = 'swim';
    fish.statusText = `${fish.name} · ${species.defaultStatus}`;
  }

  // ---- 河豚鼓气缓动 ----
  // 被摸时轻轻鼓起；双击那口大气由 specialProgress 顶上去（见渲染层）
  const wantPuff = fish.state === 'pet' && species.id === 'puffer' ? 1 : 0;
  fish.puffProgress += (wantPuff - fish.puffProgress) * Math.min(1, dt * 3.5);

  // ---- 选择目标与速度 ----
  const pellet = nearestPellet(fish, ctx.pellets);
  const pointer = ctx.pointer;
  const pointerDist = pointer ? distance(fish.x, fish.y, pointer.x, pointer.y) : Number.POSITIVE_INFINITY;
  // 指针一离开感知圈，就重新对鼠标有兴趣
  if (pointerDist > NOTICE_RADIUS) fish.pointerDwell = 0;

  // 基准速度带上个体倍率，同种鱼也不会齐步走
  const base = species.speedMultiplier * fish.cruise;
  let speed = base;

  if (pellet) {
    // 进食优先级最高
    fish.targetX = pellet.x;
    fish.targetY = pellet.y;
    speed = base * 1.4;

    if (fish.state !== 'eat') {
      fish.state = 'eat';
      fish.statusText = `${fish.name} · 朝鱼粮游去`;
    }

    if (distance(fish.x, fish.y, pellet.x, pellet.y) < EAT_RADIUS) {
      pellet.eaten = true;
      fish.hunger = Math.max(0, fish.hunger - 45);
      fish.state = 'eat';
      fish.stateTimer = 4;
      fish.idleTime = 0;
      fish.statusText = `${fish.name} · 美美饱餐中~`;
    }
  } else if (ctx.pettedId === fish.id && pointer) {
    // 手在鱼身上来回 → 摸鱼。鱼会停下来享受，只以极缓的速度蹭着掌心挪
    fish.state = 'pet';
    fish.statusText = petReaction(fish.name);
    fish.idleTime = 0;
    fish.pointerDwell = 0;
    fish.targetX = pointer.x;
    fish.targetY = pointer.y;
    speed = base * 0.14;
  } else if (pointer && pointerDist < NOTICE_RADIUS && fish.pointerDwell < DWELL_LIMIT) {
    // 好奇：凑过来看看。凑够了就腻，各自散去
    fish.targetX = pointer.x;
    fish.targetY = pointer.y;
    speed = base * 0.72;
    fish.pointerDwell += dt;

    if (fish.state !== 'eat') {
      fish.state = 'nearMouse';
      fish.statusText = `${fish.name} · 好奇地凑过来`;
    }
  } else {
    // 漫游 / 休息
    const targetDist = distance(fish.x, fish.y, fish.targetX, fish.targetY);

    if (fish.state === 'sleep') {
      if (fish.stateTimer === 0) {
        fish.state = 'swim';
        fish.statusText = `${fish.name} · ${species.defaultStatus}`;
      } else {
        speed = 0.18;
      }
    } else if (fish.state === 'idle') {
      speed = 0.25;
      if (fish.stateTimer === 0) {
        fish.state = 'swim';
        fish.statusText = `${fish.name} · ${species.defaultStatus}`;
      }
    } else {
      // 到达目标或随机换向；restless 让每尾鱼换目标的频繁程度不同。
      // 逃逸途中不许改主意：随机换向会把刚窜出去的那段距离当场抹掉
      if (fish.state !== 'startle' && (targetDist < 60 || Math.random() < 0.005 * fish.restless)) {
        if (fish.idleTime > REST_AFTER && Math.random() < 0.35) {
          fish.state = 'sleep';
          fish.stateTimer = 5 + Math.random() * 6;
          fish.statusText = `${fish.name} · 沉到水底打盹`;
          const rest = spreadTarget({ ...species, zone: 'bottom' }, bounds, fish, ctx.mates);
          fish.targetX = rest.x;
          fish.targetY = rest.y;
          fish.idleTime = 0;
        } else {
          const next = spreadTarget(species, bounds, fish, ctx.mates);
          fish.targetX = next.x;
          fish.targetY = next.y;
          if (Math.random() < 0.08) {
            fish.state = 'idle';
            fish.stateTimer = 0.8 + Math.random() * 1.4;
          }
        }
      }
    }
  }

  // 表演时放慢身段，像在专门秀给你看
  if (fish.specialTimer > 0) speed *= 0.35;

  // 受惊整段保持冲刺：只给初速的话，惯性一衰减就慢下来，看着像没躲开
  if (fish.state === 'startle') speed = base * STARTLE_BOOST;

  // ---- 冲刺—滑行 ----
  // 真鱼不是匀速直线：摆几下尾冲一段，再松劲滑一段。相位推进随 speed 走，
  // 游得急摆得也急；(1-phase)^2 这个衰减脉冲在整周期上均值恰为 1/3，
  // 配 0.7 + 0.9·pulse 正好把平均速度拉回 1 倍，整体不会变快。
  fish.beat = (fish.beat + dt * (0.55 + speed * 0.55)) % 1;
  speed *= 0.7 + 0.9 * (1 - fish.beat) ** 2;

  // ---- 转向与惯性 ----
  const dx = fish.targetX - fish.x;
  const dy = fish.targetY - fish.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    const desiredVx = (dx / dist) * speed;
    const desiredVy = (dy / dist) * speed;
    // agility 决定加速与转向的爽利程度，避免所有鱼用同一条缓动曲线
    const ease = Math.min(1, dt * 2.4 * fish.agility);
    fish.vx += (desiredVx - fish.vx) * ease;
    fish.vy += (desiredVy - fish.vy) * ease;
  } else {
    fish.vx *= 1 - Math.min(1, dt * 1.6);
    fish.vy *= 1 - Math.min(1, dt * 1.6);
  }

  // ---- 同伴排斥 ----
  // 只推开、不聚拢：鱼之间有点领地感就够了，凑成一堆开会才是问题。
  // 强度按距离平方衰减：贴脸时推得急、刚进半径时几乎无感，不会抖。
  let pushX = 0;
  let pushY = 0;
  for (const mate of ctx.mates) {
    if (mate === fish) continue;
    const ox = fish.x - mate.x;
    const oy = fish.y - mate.y;
    const d = Math.hypot(ox, oy);
    if (d > SEPARATION) continue;
    if (d < 0.001) {
      // 完全重合时没有方向可言，随机给个由头把两尾鱼岔开
      pushX += Math.random() - 0.5;
      pushY += Math.random() - 0.5;
      continue;
    }
    const strength = (1 - d / SEPARATION) ** 2;
    pushX += (ox / d) * strength;
    pushY += (oy / d) * strength;
  }
  if (pushX !== 0 || pushY !== 0) {
    const gain = frame * 0.16;
    fish.vx += pushX * gain;
    fish.vy += pushY * gain;
  }

  fish.x += fish.vx * frame;
  fish.y += fish.vy * frame;

  // ---- 边界反弹 ----
  const maxX = Math.max(EDGE + 1, bounds.width - EDGE);
  const maxY = Math.max(EDGE + 1, bounds.height - EDGE);

  if (fish.x < EDGE) {
    fish.x = EDGE;
    fish.vx = Math.abs(fish.vx);
    const next = spreadTarget(species, bounds, fish, ctx.mates);
    fish.targetX = next.x;
    fish.targetY = next.y;
  } else if (fish.x > maxX) {
    fish.x = maxX;
    fish.vx = -Math.abs(fish.vx);
    const next = spreadTarget(species, bounds, fish, ctx.mates);
    fish.targetX = next.x;
    fish.targetY = next.y;
  }

  if (fish.y < EDGE) {
    fish.y = EDGE;
    fish.vy = Math.abs(fish.vy);
    fish.targetY = bounds.height * 0.5;
  } else if (fish.y > maxY) {
    fish.y = maxY;
    fish.vy = -Math.abs(fish.vy);
    fish.targetY = bounds.height * 0.4;
  }

  // ---- 朝向与倾角 ----
  // 只做小幅倾斜（而非整圈旋转），配合水平翻转更像真实游姿
  if (fish.vx < -0.08) fish.facingLeft = true;
  else if (fish.vx > 0.08) fish.facingLeft = false;

  const tilt = Math.atan2(fish.vy, Math.abs(fish.vx) + 0.2);
  const clamped = Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, tilt));
  fish.angle = clamped * (fish.facingLeft ? -1 : 1);
}

/**
 * 单击受惊：背对鼠标窜开。
 * 顺便把目标点也甩到远处，否则惯性一过它又游回原地。
 */
export function startleFish(fish: Fish, from: { x: number; y: number }, bounds: DesktopBounds): void {
  const species = getSpecies(fish.speciesId);
  const angle = Math.atan2(fish.y - from.y, fish.x - from.x) + (Math.random() - 0.5) * 0.5;
  const dash = 4.2 * species.speedMultiplier * fish.cruise;

  fish.state = 'startle';
  fish.stateTimer = STARTLE_SECONDS;
  fish.idleTime = 0;
  // 刚被戳过，短时间内别再自个儿凑回去
  fish.pointerDwell = DWELL_LIMIT;
  fish.statusText = `${fish.name} · 嗖地躲开了`;

  fish.vx = Math.cos(angle) * dash;
  fish.vy = Math.sin(angle) * dash * 0.7;

  const flee = STARTLE_FLEE_MIN + Math.random() * STARTLE_FLEE_SPAN;
  const maxX = Math.max(EDGE + 1, bounds.width - EDGE);
  const maxY = Math.max(EDGE + 1, bounds.height - EDGE);
  fish.targetX = Math.max(EDGE, Math.min(maxX, fish.x + Math.cos(angle) * flee));
  fish.targetY = Math.max(EDGE, Math.min(maxY, fish.y + Math.sin(angle) * flee));
}

/**
 * 双击：亮出本鱼种的绝活，返回是哪一个（渲染层按种类给不同特效）。
 * 表演时长与文案在这里定，具体花样交给渲染层。
 */
export function specialFish(fish: Fish): SpecialEffect {
  const effect = specialEffectOf(fish.speciesId);
  fish.specialTimer = SPECIAL_SECONDS;
  fish.idleTime = 0;
  fish.statusText = specialReaction(fish.speciesId, fish.name);
  return effect;
}