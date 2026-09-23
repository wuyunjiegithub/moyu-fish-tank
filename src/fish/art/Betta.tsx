import { useId } from 'react';
import { shade } from '../color';
import type { FishArtProps } from './types';

/** 斗鱼：青蓝渐变身躯 + 绸缎大尾。朝向默认向左。 */
export function BettaArt({ palette, size }: FishArtProps) {
  const uid = useId().replace(/:/g, '');
  const body = `bt-body-${uid}`;
  const veil = `bt-veil-${uid}`;
  const flow = `bt-flow-${uid}`;

  return (
    <svg
      viewBox="75 75 335 275"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      className="fish-art"
      style={{ '--fin-amp': '22deg' } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={body} x1="10%" y1="20%" x2="90%" y2="80%">
          <stop offset="0%" stopColor={shade(palette.primary, 0.4)} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={shade(palette.primary, -0.5)} />
        </linearGradient>
        <linearGradient id={veil} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.tail, 0.45)} stopOpacity="0.9" />
          <stop offset="40%" stopColor={palette.tail} stopOpacity="0.75" />
          <stop offset="80%" stopColor={palette.accent} stopOpacity="0.65" />
          <stop offset="100%" stopColor={shade(palette.accent, 0.2)} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={flow} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.primary, 0.5)} stopOpacity="0.8" />
          <stop offset="50%" stopColor={palette.tail} stopOpacity="0.65" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* 飘逸大尾 */}
      <g className="fin-tail">
        <path
          d="M 220 195 C 270 120 345 95 375 135 C 395 165 370 220 375 255 C 380 295 320 305 270 270 C 235 245 225 210 220 195 Z"
          fill={`url(#${veil})`}
        />
        <path
          d="M 225 190 C 285 130 335 125 355 155 C 370 180 345 210 355 240 C 340 270 285 260 235 205 Z"
          fill={`url(#${flow})`}
        />
        <path
          d="M 230 195 C 290 155 330 160 340 185 C 345 205 320 225 325 245 C 295 250 250 225 230 195 Z"
          fill="#ffffff"
          opacity="0.25"
        />
      </g>

      {/* 背鳍 */}
      <g className="fin-dorsal">
        <path
          d="M 125 155 C 145 95 210 85 245 125 C 215 145 175 155 140 165 Z"
          fill={`url(#${veil})`}
        />
        <path
          d="M 140 145 C 160 105 205 100 230 130 C 200 142 168 152 140 145 Z"
          fill={`url(#${flow})`}
          opacity="0.7"
        />
      </g>

      {/* 腹部长飘带 */}
      <g className="fin-ventral">
        <path
          d="M 155 225 C 165 285 180 325 190 335 C 188 320 175 280 165 235 Z"
          fill={`url(#${veil})`}
        />
        <path
          d="M 145 220 C 150 270 160 305 168 315 C 165 295 155 265 150 228 Z"
          fill={`url(#${flow})`}
        />
      </g>

      {/* 臀鳍 */}
      <path
        className="fin-ventral"
        d="M 170 230 C 215 285 260 275 270 255 C 255 240 230 225 210 215 Z"
        fill={`url(#${veil})`}
      />

      {/* 身体 */}
      <path
        d="M 90 190 C 90 155 130 145 180 155 C 225 165 242 185 235 205 C 225 228 180 238 140 232 C 105 225 90 210 90 190 Z"
        fill={`url(#${body})`}
      />
      <path
        d="M 115 175 C 140 165 185 170 215 190 C 190 185 150 180 125 195 Z"
        fill={shade(palette.tail, 0.4)}
        opacity="0.5"
      />
      <ellipse cx="120" cy="202" rx="12" ry="8" fill="#f43f5e" opacity="0.35" />

      {/* 胸鳍 */}
      <path
        className="fin-pectoral"
        d="M 135 200 C 145 228 165 235 170 225 C 172 215 158 202 145 195 Z"
        fill={`url(#${flow})`}
        opacity="0.9"
      />

      {/* 眼与嘴 */}
      <circle cx="115" cy="178" r="9" fill="#0f172a" />
      <circle cx="112" cy="175" r="3.5" fill="#ffffff" />
      <circle cx="117" cy="180" r="1.5" fill="#ffffff" opacity="0.8" />
      <path
        d="M 90 192 C 85 191 84 195 89 197"
        stroke={shade(palette.primary, -0.4)}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
