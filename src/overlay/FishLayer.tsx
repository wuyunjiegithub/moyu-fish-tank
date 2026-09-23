import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { UnlistenFn } from '@tauri-apps/api/event';
import type {
  AmbientBubble,
  DesktopBounds,
  Fish,
  FishRecord,
  FoodPellet,
  PositionUpdate,
} from '@/types';
import {
  createFish,
  FX_CLASS,
  GROWTH_LABEL,
  getSpecies,
  paletteOf,
  resolveScale,
  specialEffectOf,
} from '@/fish/species';
import { specialFish, startleFish, stepFish } from '@/fish/behavior';
import { FishRenderer } from '@/fish/renderer';
import { api, on } from '@/ipc';
import { PET_HAND_HOTSPOT, PetHand } from './PetHand';
import { play, setMuted } from '@/audio';

/** 位置回传间隔（秒）——Rust 侧再防抖落盘 */
const SYNC_EVERY = 2;
const PELLETS_PER_FEED = 5;
const BUBBLE_COUNT = 16;

/** 各鱼种基准显示尺寸（正方形外框边长 px） */
const BASE_SIZE: Partial<Record<string, number>> = {
  betta: 104,
  puffer: 94,
  goldfish: 84,
  clownfish: 84,
};

interface Toast {
  id: string;
  x: number;
  y: number;
  text: string;
}

/** 摸鱼时的一次性粒子：水花 / 爱心 / 泡泡，各挂各的动画 */
type ParticleKind = 'spark' | 'heart' | 'popbubble';

interface Particle {
  id: string;
  kind: ParticleKind;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
}

/** 单击与双击的分界：200ms 内没有第二下才认定是单击 */
const DOUBLE_CLICK_MS = 200;
/** 抚摸撒爱心的节流间隔（ms） */
const PET_HEART_INTERVAL = 320;

const displaySize = (fish: Fish) => (BASE_SIZE[fish.speciesId] ?? 84) * fish.scale;

const bounds = (): DesktopBounds => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

const toPositionPayload = (list: readonly Fish[]): PositionUpdate[] =>
  list.map((f) => ({
    id: f.id,
    x: Math.round(f.x),
    y: Math.round(f.y),
    hunger: Math.round(f.hunger),
  }));

/**
 * 桌面鱼层。
 *
 * 性能要点：鱼的物理与位置更新走 requestAnimationFrame + 直接写 DOM transform，
 * 完全不经过 React 渲染；React 只负责「有哪些鱼」这类结构性变更。
 */
export function FishLayer() {
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [bubbles, setBubbles] = useState<AmbientBubble[]>([]);
  const [pellets, setPellets] = useState<FoodPellet[]>([]);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const live = useRef<Fish[]>([]);
  const livePellets = useRef<FoodPellet[]>([]);
  const liveBubbles = useRef<AmbientBubble[]>([]);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const tilts = useRef(new Map<string, HTMLDivElement>());
  const puffs = useRef(new Map<string, HTMLDivElement>());
  const pokes = useRef(new Map<string, HTMLDivElement>());
  const pelletNodes = useRef(new Map<string, HTMLDivElement>());
  const bubbleNodes = useRef(new Map<string, HTMLDivElement>());
  const handRef = useRef<HTMLDivElement>(null);
  /** 上次写进 --grow 的值，用来过滤掉变化极小的无谓样式写入 */
  const growthCache = useRef(new Map<string, number>());
  /** 同上，--puff 的差量过滤 */
  const puffCache = useRef(new Map<string, number>());
  /** 每尾鱼当前挂着的表演动画类，用于在计时结束时摘掉 */
  const fxApplied = useRef(new Map<string, string>());
  /** 单击延迟执行的手柄：双击落地时把它掐掉 */
  const clickTimer = useRef<number | null>(null);
  /** 抚摸撒爱心的节流状态 */
  const lastPetAt = useRef(0);
  const lastPetPos = useRef<{ x: number; y: number } | null>(null);

  const pointer = useRef<{ x: number; y: number } | null>(null);
  const clickThrough = useRef(true);
  const hiddenRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const bubblesOn = useRef(true);

  // ---------------------------------------------------------------- 初始化
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    let disposed = false;

    /** 复用已有实例，保留其位置与状态，避免广播一次就重置整缸鱼 */
    const merge = (records: FishRecord[], b: DesktopBounds): Fish[] => {
      const prev = new Map(live.current.map((f) => [f.id, f]));
      return records.map((r) => {
        const existing = prev.get(r.id);
        if (existing) {
          existing.name = r.name;
          existing.scale = resolveScale(r.speciesId, r.scale);
          existing.paletteOverride = r.paletteOverride;
          return existing;
        }
        const created = createFish(r.speciesId, r.name, b, {
          id: r.id,
          x: r.x,
          y: r.y,
          hunger: r.hunger,
          scale: r.scale,
          createdAt: r.createdAt,
        });
        created.paletteOverride = r.paletteOverride;
        return created;
      });
    };

    const applyRecords = (records: FishRecord[]) => {
      const list = merge(records, bounds());
      live.current = list;
      setFishes(list);
    };

    const spawnBubbles = () => {
      const b = bounds();
      const next: AmbientBubble[] = Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
        id: `bubble-${i}`,
        x: Math.random() * b.width,
        y: Math.random() * b.height,
        size: 3 + Math.random() * 11,
        opacity: 0.16 + Math.random() * 0.4,
        speed: 0.35 + Math.random() * 0.85,
        wobbleAmp: 0.6 + Math.random() * 1.4,
        seed: Math.random() * 100,
      }));
      liveBubbles.current = next;
      setBubbles(next);
    };

    const applyBubbles = (on: boolean) => {
      bubblesOn.current = on;
      if (on) spawnBubbles();
      else {
        liveBubbles.current = [];
        setBubbles([]);
      }
    };

    const boot = async () => {
      const [records, settings] = await Promise.all([api.listFishes(), api.getSettings()]);
      if (disposed) return;
      applyRecords(records);
      applyBubbles(settings.ambientBubbles);
      setMuted(settings.muted);

      unlisteners.push(await on.fishChanged(applyRecords));
      unlisteners.push(
        await on.cursorMove(({ x, y }) => {
          const dpr = window.devicePixelRatio || 1;
          pointer.current = { x: x / dpr, y: y / dpr };
        }),
      );
      unlisteners.push(
        await on.bossKey((active) => {
          hiddenRef.current = active;
          setHidden(active);
          // Rust 侧已强制恢复穿透，本地状态跟着对齐，避免下一帧不再补发
          clickThrough.current = true;
          if (active) void api.syncPositions(toPositionPayload(live.current));
        }),
      );
      unlisteners.push(
        await on.settingsChanged((s) => {
          if (s.ambientBubbles !== bubblesOn.current) applyBubbles(s.ambientBubbles);
          setMuted(s.muted);
        }),
      );
      unlisteners.push(
        await on.feed((b) => {
          play('feed');
          const batch: FoodPellet[] = Array.from({ length: PELLETS_PER_FEED }, (_, i) => ({
            id: `pellet-${Date.now().toString(36)}-${i}`,
            x: b.width * 0.15 + Math.random() * b.width * 0.7,
            y: 40 + Math.random() * 70,
            vy: 0.9 + Math.random() * 0.7,
            eaten: false,
          }));
          livePellets.current = [...livePellets.current, ...batch];
          setPellets(livePellets.current);
        }),
      );

      // 等首帧真正画出来再显示窗口，避免透明窗口白闪
      requestAnimationFrame(() => {
        if (!disposed) void api.overlayReady();
      });
    };

    void boot();

    return () => {
      disposed = true;
      unlisteners.forEach((u) => u());
    };
  }, []);

  // ---------------------------------------------------------------- 主循环
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let syncAcc = 0;

    const hitTest = (p: { x: number; y: number } | null, wall: number) => {
      let hitId: string | null = null;
      if (p) {
        for (const f of live.current) {
          // 命中框跟着成长后的实际体型走，否则幼鱼身上有一圈摸不着的空档
          const size = displaySize(f) * f.growth;
          if (Math.abs(p.x - f.x) < size * 0.45 && Math.abs(p.y - f.y) < size * 0.34) {
            hitId = f.id;
            break;
          }
        }
      }
      // 命中鱼 → 关闭穿透接管点击；离开 → 立刻恢复穿透，桌面操作不受影响
      const wantThrough = hitId === null;
      if (wantThrough !== clickThrough.current) {
        clickThrough.current = wantThrough;
        void api.setClickThrough(wantThrough);
      }
      if (hitId !== hoveredRef.current) {
        hoveredRef.current = hitId;
        setHovered(hitId);
        lastPetPos.current = null;
      }

      // 手在鱼身上移动就是在摸鱼：节流撒爱心，鱼则由 pettedId 停下享受
      if (hitId && p && wall - lastPetAt.current > PET_HEART_INTERVAL) {
        const lastPos = lastPetPos.current;
        const moved = lastPos ? Math.hypot(p.x - lastPos.x, p.y - lastPos.y) : Number.POSITIVE_INFINITY;
        if (moved > 5) {
          lastPetAt.current = wall;
          lastPetPos.current = { x: p.x, y: p.y };
          const target = live.current.find((f) => f.id === hitId);
          if (target) spawnHearts(target);
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const b = bounds();
      // 整帧只取一次墙钟，供成长这类按真实时间推进的量使用
      const wall = Date.now();

      // 氛围气泡上浮
      if (bubblesOn.current) {
        for (const bubble of liveBubbles.current) {
          bubble.y -= bubble.speed * dt * 60;
          if (bubble.y < -30) {
            bubble.y = b.height + 20;
            bubble.x = Math.random() * b.width;
          }
          const el = bubbleNodes.current.get(bubble.id);
          if (el) {
            const drift = Math.sin(now * 0.001 + bubble.seed) * bubble.wobbleAmp;
            el.style.transform = `translate3d(${bubble.x + drift}px, ${bubble.y}px, 0)`;
          }
        }
      }

      // 鱼粮下沉
      if (livePellets.current.length > 0) {
        let expired = false;
        let munched = false;
        for (const p of livePellets.current) {
          // 上一帧被鱼吃掉：补一声咀嚼
          if (p.eaten) {
            expired = true;
            munched = true;
            continue;
          }
          p.y += p.vy * dt * 60;
          if (p.y > b.height - 16) {
            p.eaten = true;
            expired = true;
          }
          const el = pelletNodes.current.get(p.id);
          if (el) el.style.transform = `translate3d(${p.x - 4}px, ${p.y - 4}px, 0)`;
        }
        if (munched) play('munch');
        if (expired) {
          livePellets.current = livePellets.current.filter((p) => !p.eaten);
          setPellets(livePellets.current);
        }
      }

      // 鱼的行为与物理。先做命中判定：这一帧的抚摸状态要交给 stepFish 用
      if (!hiddenRef.current) {
        hitTest(pointer.current, wall);

        for (const fish of live.current) {
          stepFish(fish, {
            dt,
            now: wall,
            bounds: b,
            pointer: pointer.current,
            pellets: livePellets.current,
            mates: live.current,
            pettedId: hoveredRef.current,
          });

          // 位移用未缩放的外框，缩放交给 .fish-puff 的 transform-origin: 50% 50%，
          // 净效果是鱼以自身中心为轴长大，位置不漂
          const size = displaySize(fish);
          const node = nodes.current.get(fish.id);
          if (node) {
            node.style.transform = `translate3d(${fish.x - size / 2}px, ${fish.y - size / 2}px, 0)`;
          }
          const tilt = tilts.current.get(fish.id);
          if (tilt) {
            // 素材原稿朝向为左：朝左就不翻，朝右才翻。此前极性写反，鱼全在倒着游
            tilt.style.transform = `rotate(${fish.angle}rad) scaleX(${fish.facingLeft ? 1 : -1})`;
          }

          const poke = pokes.current.get(fish.id);
          const puff = puffs.current.get(fish.id);
          if (poke && puff) {
            // 河豚：被摸时轻轻鼓起，双击那口大气由 specialProgress 顶到近两倍
            const want = 1 + fish.puffProgress * 0.3 + fish.specialProgress * 0.7;
            const cachedPuff = puffCache.current.get(fish.id);
            if (cachedPuff === undefined || Math.abs(cachedPuff - want) > 0.003) {
              puffCache.current.set(fish.id, want);
              puff.style.setProperty('--puff', want.toFixed(3));
            }

            // 成长同样走 CSS 变量，不进 React 热路径；差量过滤后基本不写
            const cached = growthCache.current.get(fish.id);
            if (cached === undefined || Math.abs(cached - fish.growth) > 0.004) {
              growthCache.current.set(fish.id, fish.growth);
              puff.style.setProperty('--grow', fish.growth.toFixed(3));
            }

            // 表演动画：只在计时区间内挂类，结束后摘掉；挂上时重放一次
            const fxClass = FX_CLASS[specialEffectOf(fish.speciesId)];
            const wantFx = fish.specialTimer > 0 ? fxClass : undefined;
            const appliedFx = fxApplied.current.get(fish.id);
            if (wantFx !== appliedFx) {
              if (appliedFx) poke.classList.remove(appliedFx);
              if (wantFx) {
                poke.classList.remove(wantFx);
                void poke.offsetWidth;
                poke.classList.add(wantFx);
                fxApplied.current.set(fish.id, wantFx);
              } else {
                fxApplied.current.delete(fish.id);
              }
            }
          }
        }

        // 抚摸光标跟随指针。只有悬停在鱼身上时这个元素才存在
        const hand = handRef.current;
        const p = pointer.current;
        if (hand && p) {
          hand.style.transform = `translate3d(${p.x - PET_HAND_HOTSPOT.x}px, ${p.y - PET_HAND_HOTSPOT.y}px, 0)`;
        }
      }

      syncAcc += dt;
      if (syncAcc >= SYNC_EVERY) {
        syncAcc = 0;
        void api.syncPositions(toPositionPayload(live.current));
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------------------------------------------------------------- 交互
  const particleId = (kind: ParticleKind) =>
    `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  /** 粒子进队列，到点整批清掉；上限 28 颗，防止连点时越堆越多 */
  const pushParticles = (batch: Particle[], ttl: number) => {
    setParticles((prev) => [...prev.slice(-24), ...batch]);
    const ids = new Set(batch.map((p) => p.id));
    window.setTimeout(() => setParticles((prev) => prev.filter((p) => !ids.has(p.id))), ttl);
  };

  /** 摸鱼溅起的水花：向外上方散开 */
  const spawnSparks = (fish: Fish) => {
    const size = displaySize(fish) * fish.growth;
    const batch: Particle[] = Array.from({ length: 5 }, (_, i) => {
      const angle = -Math.PI / 2 + (i - 2) * 0.52 + (Math.random() - 0.5) * 0.28;
      const dist = 26 + Math.random() * 34;
      return {
        id: particleId('spark'),
        kind: 'spark' as const,
        x: fish.x + (Math.random() - 0.5) * size * 0.5,
        y: fish.y - size * 0.08,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 4 + Math.random() * 7,
      };
    });
    pushParticles(batch, 900);
  };

  /** 抚摸飘出的小爱心：贴着鱼身往上慢慢飘 */
  const spawnHearts = (fish: Fish) => {
    const size = displaySize(fish) * fish.growth;
    const batch: Particle[] = Array.from({ length: 2 }, () => ({
      id: particleId('heart'),
      kind: 'heart' as const,
      x: fish.x + (Math.random() - 0.5) * size * 0.6,
      y: fish.y - size * 0.22,
      dx: (Math.random() - 0.5) * 28,
      dy: -34 - Math.random() * 24,
      size: 11 + Math.random() * 7,
    }));
    pushParticles(batch, 1200);
  };

  /** 小丑鱼双击时吐的一串泡泡 */
  const spawnPopBubbles = (fish: Fish) => {
    const size = displaySize(fish) * fish.growth;
    const batch: Particle[] = Array.from({ length: 9 }, (_, i) => ({
      id: particleId('popbubble'),
      kind: 'popbubble' as const,
      x: fish.x + (Math.random() - 0.5) * size * 0.7,
      y: fish.y - size * 0.1,
      dx: -26 + i * 6 + (Math.random() - 0.5) * 10,
      dy: -60 - Math.random() * 70,
      size: 6 + Math.random() * 10,
    }));
    pushParticles(batch, 1300);
  };

  const pushToast = (fish: Fish) => {
    const id = `toast-${Date.now().toString(36)}`;
    setToasts((prev) => [...prev.slice(-3), { id, x: fish.x, y: fish.y, text: fish.statusText }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1900);
  };

  /** 单击：鱼受惊窜开 */
  const dodgeAway = (fish: Fish) => {
    const poke = pokes.current.get(fish.id);
    if (poke) {
      // 重放动画类而不是走 React 状态，连续点每次都会弹
      poke.classList.remove('poked');
      void poke.offsetWidth;
      poke.classList.add('poked');
    }
    spawnSparks(fish);
    play('pat');
    startleFish(fish, pointer.current ?? { x: fish.x - 1, y: fish.y }, bounds());
    pushToast(fish);
  };

  /**
   * 单击与双击共用同一个 click 入口：双击的第二下也会先派发 click，
   * 所以单击动作先按下不表，等 200ms 没有下文才执行，双击则把它掐掉。
   */
  const handleFishClick = (fish: Fish, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      dodgeAway(fish);
    }, DOUBLE_CLICK_MS);
  };

  /** 双击：亮出本鱼种的绝活 */
  const handleFishDouble = (fish: Fish, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }

    const effect = specialFish(fish);
    if (effect === 'bubbles') spawnPopBubbles(fish);
    play('bubble');
    pushToast(fish);
  };

  if (hidden) return null;

  return (
    <>
      {bubbles.map((b) => (
        <div
          key={b.id}
          ref={(el) => {
            if (el) bubbleNodes.current.set(b.id, el);
            else bubbleNodes.current.delete(b.id);
          }}
          className="bubble rounded-full border border-white/60 bg-white/30"
          style={{ width: b.size, height: b.size, opacity: b.opacity }}
        />
      ))}

      {pellets.map((p) => (
        <div
          key={p.id}
          ref={(el) => {
            if (el) pelletNodes.current.set(p.id, el);
            else pelletNodes.current.delete(p.id);
          }}
          className="pellet"
        >
          <div className="h-2 w-2 rounded-full border border-amber-200 bg-gradient-to-br from-amber-300 to-amber-600 shadow-sm" />
        </div>
      ))}

      {fishes.map((fish) => {
        const size = displaySize(fish);
        const species = getSpecies(fish.speciesId);
        const isHovered = hovered === fish.id;

        return (
          <div
            key={fish.id}
            ref={(el) => {
              if (el) nodes.current.set(fish.id, el);
              else nodes.current.delete(fish.id);
            }}
            className="fish-node"
            style={{ width: size, height: size }}
            onClick={(e) => handleFishClick(fish, e)}
            onDoubleClick={(e) => handleFishDouble(fish, e)}
          >
            <div
              ref={(el) => {
                if (el) tilts.current.set(fish.id, el);
                else tilts.current.delete(fish.id);
              }}
              className="fish-tilt"
            >
              <div
                ref={(el) => {
                  if (el) puffs.current.set(fish.id, el);
                  else puffs.current.delete(fish.id);
                }}
                className="fish-puff"
              >
                <div
                  ref={(el) => {
                    if (el) pokes.current.set(fish.id, el);
                    else pokes.current.delete(fish.id);
                  }}
                  className="fish-poke"
                >
                  <FishRenderer
                    speciesId={fish.speciesId}
                    palette={paletteOf(fish)}
                    size={size}
                    finPeriod={1.5 + fish.finSeed * 0.9}
                    finDelay={fish.finSeed * 1.2}
                  />
                </div>
              </div>
            </div>

            {/* 名牌不随鱼体倾斜，避免倒转 */}
            <div
              className={`pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-river-slate/85 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md transition-all duration-200 ${
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
              {fish.name}
              <span className="ml-1 text-[10px] text-white/70">{species.name}</span>
              <span className="ml-1 text-[10px] text-white/70">· {GROWTH_LABEL[fish.stage]}</span>
            </div>
          </div>
        );
      })}

      {hovered && <PetHand handRef={handRef} />}

      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.kind}`}
          style={
            {
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              fontSize: p.size,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as CSSProperties
          }
        >
          {p.kind === 'heart' ? '♥' : null}
        </div>
      ))}

      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-none absolute animate-bounce rounded-pill border border-amber-300/80 bg-amber-100/95 px-2.5 py-1 text-[11px] font-medium text-amber-800 shadow-sm"
          style={{ left: t.x - 40, top: t.y - 46, width: 160, textAlign: 'center' }}
        >
          {t.text}
        </div>
      ))}
    </>
  );
}
