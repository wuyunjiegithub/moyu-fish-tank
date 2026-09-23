/**
 * 程序化音效：全部由 WebAudio 现场合成，不依赖任何音频文件。
 *
 * AudioContext 惰性创建——浏览器要求首次发声必须发生在用户手势之后，
 * 因此加载时静默待命，第一次真正点击才把音频引擎唤醒（之后的投喂音也能补上）。
 */

export type Voice = 'bubble' | 'munch' | 'pat' | 'feed' | 'release';

interface Bus {
  ac: AudioContext;
  out: GainNode;
}

/** 同类音效的最小间隔（毫秒）：整缸鱼同时进食时否则会糊成噪音 */
const THROTTLE: Partial<Record<Voice, number>> = { munch: 140, bubble: 70, pat: 60 };

let bus: Bus | undefined;
let muted = false;
const lastAt = new Map<Voice, number>();

/** 同步静音开关；静音时连 AudioContext 都不必创建 */
export const setMuted = (next: boolean): void => {
  muted = next;
};

const open = (): Bus | undefined => {
  if (muted) return undefined;
  if (!bus) {
    const ac = new AudioContext();
    const out = ac.createGain();
    out.gain.value = 0.3;
    out.connect(ac.destination);
    bus = { ac, out };
  }
  if (bus.ac.state === 'suspended') void bus.ac.resume();
  return bus;
};

interface Tone {
  /** 起始频率 Hz */
  from: number;
  /** 终止频率 Hz，缺省表示不滑音 */
  to?: number;
  /** 时长（秒） */
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

/** 一个带指数衰减包络的振荡器音符 */
const tone = (
  { ac, out }: Bus,
  { from, to = from, dur, type = 'sine', gain = 0.5, delay = 0 }: Tone,
): void => {
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const env = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);

  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);
};

/** 一段扫频带通白噪声，用来做水花、气泡这类「非乐音」质感 */
const splash = (
  { ac, out }: Bus,
  dur: number,
  sweep: readonly [number, number],
  gain = 0.28,
  delay = 0,
): void => {
  const t = ac.currentTime + delay;
  const frames = Math.ceil(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buffer;

  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.9;
  band.frequency.setValueAtTime(sweep[0], t);
  band.frequency.exponentialRampToValueAtTime(sweep[1], t + dur);

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(band);
  band.connect(env);
  env.connect(out);
  src.start(t);
  src.stop(t + dur);
};

const VOICES: Record<Voice, (b: Bus) => void> = {
  /** 气泡上浮破裂 */
  bubble: (b) => tone(b, { from: 300, to: 820, dur: 0.13, gain: 0.34 }),
  /** 咬下鱼粮：两声闷响 */
  munch: (b) => {
    tone(b, { from: 190, to: 90, dur: 0.07, type: 'triangle', gain: 0.5 });
    tone(b, { from: 150, to: 70, dur: 0.09, type: 'triangle', gain: 0.34, delay: 0.08 });
  },
  /** 摸鱼：一记水花 + 一声上扬的回应 */
  pat: (b) => {
    splash(b, 0.2, [420, 1500], 0.24);
    tone(b, { from: 560, to: 940, dur: 0.16, gain: 0.26, delay: 0.02 });
  },
  /** 鱼粮落水 */
  feed: (b) => {
    tone(b, { from: 880, to: 300, dur: 0.12, gain: 0.3 });
    splash(b, 0.14, [1900, 700], 0.18, 0.02);
  },
  /** 放生：两段下行 */
  release: (b) => {
    tone(b, { from: 620, to: 470, dur: 0.18, gain: 0.26 });
    tone(b, { from: 470, to: 300, dur: 0.26, gain: 0.22, delay: 0.15 });
  },
};

/** 播放一个音效；静音或节流命中时静默返回 */
export const play = (voice: Voice): void => {
  const now = performance.now();
  const gap = THROTTLE[voice];
  if (gap !== undefined && now - (lastAt.get(voice) ?? 0) < gap) return;

  const b = open();
  if (!b) return;

  lastAt.set(voice, now);
  VOICES[voice](b);
};