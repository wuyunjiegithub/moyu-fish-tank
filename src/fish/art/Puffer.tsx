import { useId } from 'react';
import { shade } from '../color';
import type { FishArtProps } from './types';

/** 河豚：圆身 + 软刺。鼓气缩放由外层图层以 CSS 变量驱动。朝向默认向左。 */
export function PufferArt({ palette, size }: FishArtProps) {
  const uid = useId().replace(/:/g, '');
  const back = `pf-back-${uid}`;
  const belly = `pf-belly-${uid}`;
  const fin = `pf-fin-${uid}`;

  return (
    <svg
      viewBox="85 90 275 220"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      className="fish-art"
      style={{ '--fin-amp': '20deg' } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={back} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.primary, 0.32)} />
          <stop offset="60%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={shade(palette.primary, -0.25)} />
        </linearGradient>
        <linearGradient id={belly} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={shade(palette.tail, 0.7)} />
        </linearGradient>
        <linearGradient id={fin} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.tail, 0.35)} />
          <stop offset="100%" stopColor={shade(palette.primary, -0.15)} />
        </linearGradient>
      </defs>

      {/* 小尾鳍 */}
      <path
        className="fin-tail"
        d="M 285 195 C 325 175 340 165 345 180 C 338 198 338 202 345 220 C 340 235 325 225 285 205 Z"
        fill={`url(#${fin})`}
      />

      {/* 背部软刺 */}
      <circle cx="160" cy="102" r="5" fill={shade(palette.primary, -0.2)} opacity="0.8" />
      <circle cx="200" cy="105" r="5.5" fill={shade(palette.primary, -0.2)} opacity="0.8" />
      <circle cx="240" cy="118" r="5" fill={shade(palette.primary, -0.2)} opacity="0.8" />
      <circle cx="272" cy="145" r="5" fill={shade(palette.primary, -0.2)} opacity="0.8" />
      <circle cx="285" cy="178" r="4.5" fill={shade(palette.primary, -0.2)} opacity="0.8" />

      {/* 腹部软刺 */}
      <circle cx="150" cy="293" r="5" fill={palette.tail} opacity="0.6" />
      <circle cx="195" cy="298" r="5.5" fill={palette.tail} opacity="0.6" />
      <circle cx="240" cy="288" r="5" fill={palette.tail} opacity="0.6" />

      {/* 圆身 */}
      <circle cx="195" cy="200" r="95" fill={`url(#${back})`} />
      <path
        d="M 102 215 C 105 268 150 295 195 295 C 242 295 285 268 288 215 C 250 240 145 240 102 215 Z"
        fill={`url(#${belly})`}
      />

      {/* 背部斑点 */}
      <circle cx="160" cy="135" r="4" fill={shade(palette.primary, -0.4)} opacity="0.4" />
      <circle cx="185" cy="125" r="3" fill={shade(palette.primary, -0.4)} opacity="0.35" />
      <circle cx="215" cy="130" r="4.5" fill={shade(palette.primary, -0.4)} opacity="0.4" />
      <circle cx="245" cy="150" r="3.5" fill={shade(palette.primary, -0.4)} opacity="0.35" />
      <circle cx="175" cy="155" r="3" fill={shade(palette.primary, -0.4)} opacity="0.3" />
      <circle cx="205" cy="150" r="3.5" fill={shade(palette.primary, -0.4)} opacity="0.3" />

      <ellipse cx="130" cy="225" rx="14" ry="9" fill="#f43f5e" opacity="0.35" />

      {/* 呆萌大眼 */}
      <g transform="translate(120, 175)">
        <circle cx="0" cy="0" r="11" fill="#0f172a" />
        <circle cx="-3" cy="-3.5" r="4.2" fill="#ffffff" />
        <circle cx="3" cy="3" r="1.8" fill="#ffffff" opacity="0.85" />
      </g>

      {/* 嘟嘴 */}
      <ellipse cx="102" cy="198" rx="5" ry="7" fill={shade(palette.primary, -0.05)} />
      <ellipse cx="103" cy="198" rx="2.8" ry="4.5" fill="#7c2d12" />

      {/* 侧鳍 */}
      <g className="fin-pectoral">
        <path
          d="M 175 210 C 185 190 205 195 208 208 C 210 220 188 228 175 210 Z"
          fill={shade(palette.tail, 0.5)}
        />
        <path
          d="M 177 210 C 183 196 198 200 200 209 C 201 216 186 222 177 210 Z"
          fill="#ffffff"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
