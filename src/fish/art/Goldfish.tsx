import { useId } from 'react';
import { shade } from '../color';
import type { FishArtProps } from './types';

/** 小金鱼：圆润胖身 + 蝶形大尾。朝向默认向左。 */
export function GoldfishArt({ palette, size }: FishArtProps) {
  const uid = useId().replace(/:/g, '');
  const body = `gf-body-${uid}`;
  const tail = `gf-tail-${uid}`;
  const dorsal = `gf-dorsal-${uid}`;
  const belly = `gf-belly-${uid}`;

  return (
    <svg
      viewBox="70 100 320 195"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      className="fish-art"
      style={{ '--fin-amp': '16deg' } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={body} x1="10%" y1="20%" x2="90%" y2="80%">
          <stop offset="0%" stopColor={shade(palette.primary, 0.32)} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={shade(palette.primary, -0.22)} />
        </linearGradient>
        <linearGradient id={tail} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.tail, 0.28)} stopOpacity="0.9" />
          <stop offset="60%" stopColor={palette.tail} stopOpacity="0.7" />
          <stop offset="100%" stopColor={shade(palette.tail, -0.2)} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={dorsal} x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor={shade(palette.primary, -0.05)} />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={belly} x1="30%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffe4d6" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* 尾鳍 */}
      <g className="fin-tail">
        <path
          d="M 230 195 C 290 160 340 110 365 140 C 375 155 350 190 320 195 C 350 205 380 235 365 260 C 345 285 280 235 230 205 Z"
          fill={`url(#${tail})`}
        />
        <path
          d="M 240 190 C 295 145 330 135 345 155 C 330 175 300 185 270 195 C 310 205 345 230 330 250 C 305 265 265 225 235 205 Z"
          fill={shade(palette.tail, 0.45)}
          opacity="0.55"
        />
      </g>

      {/* 腹鳍 */}
      <g className="fin-ventral">
        <path
          d="M 180 235 C 190 270 215 285 225 275 C 230 265 210 240 195 228 Z"
          fill={`url(#${tail})`}
          opacity="0.8"
        />
        <path
          d="M 145 225 C 130 265 105 275 95 265 C 90 250 120 235 135 220 Z"
          fill={`url(#${tail})`}
          opacity="0.75"
        />
      </g>

      {/* 背鳍 */}
      <path
        className="fin-dorsal"
        d="M 140 155 C 160 120 200 115 225 135 C 215 150 190 160 170 165 Z"
        fill={`url(#${dorsal})`}
      />

      {/* 身体 */}
      <path
        d="M 85 190 C 85 145 130 130 190 145 C 240 155 255 185 250 210 C 240 245 185 260 135 250 C 95 240 85 215 85 190 Z"
        fill={`url(#${body})`}
      />
      <path
        d="M 105 210 C 120 245 170 255 215 235 C 190 248 135 245 110 220 Z"
        fill={`url(#${belly})`}
      />
      <ellipse cx="118" cy="206" rx="14" ry="10" fill="#f43f5e" opacity="0.35" />

      {/* 胸鳍 */}
      <path
        className="fin-pectoral"
        d="M 135 210 C 145 245 170 260 178 250 C 182 238 165 218 150 205 Z"
        fill={`url(#${dorsal})`}
      />

      {/* 眼与嘴 */}
      <circle cx="112" cy="176" r="10" fill="#1e293b" />
      <circle cx="109" cy="172" r="3.8" fill="#ffffff" />
      <circle cx="115" cy="179" r="1.6" fill="#ffffff" opacity="0.8" />
      <path
        d="M 85 194 C 80 193 78 197 84 200"
        stroke={shade(palette.primary, -0.45)}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 鳞光 */}
      <circle cx="170" cy="180" r="3" fill="#ffffff" opacity="0.4" />
      <circle cx="190" cy="175" r="2.5" fill="#ffffff" opacity="0.3" />
      <circle cx="180" cy="195" r="2" fill="#ffffff" opacity="0.35" />
      <circle cx="205" cy="190" r="2" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}
