import { useId } from 'react';
import { shade } from '../color';
import type { FishArtProps } from './types';

/** 小丑鱼：三白条纹 + 深色描边。朝向默认向左。 */
export function ClownfishArt({ palette, size }: FishArtProps) {
  const uid = useId().replace(/:/g, '');
  const body = `cl-body-${uid}`;
  const fin = `cl-fin-${uid}`;
  const stripe = `cl-stripe-${uid}`;

  const ink = '#1e293b';

  return (
    <svg
      viewBox="75 100 285 185"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      className="fish-art"
      style={{ '--fin-amp': '13deg' } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={body} x1="10%" y1="20%" x2="90%" y2="80%">
          <stop offset="0%" stopColor={shade(palette.primary, 0.28)} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={shade(palette.primary, -0.2)} />
        </linearGradient>
        <linearGradient id={fin} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.tail, 0.3)} />
          <stop offset="80%" stopColor={palette.tail} />
          <stop offset="100%" stopColor={ink} />
        </linearGradient>
        <linearGradient id={stripe} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* 尾鳍 */}
      <g className="fin-tail">
        <path
          d="M 270 195 C 310 165 338 162 342 178 C 344 190 332 195 332 205 C 332 215 344 220 342 232 C 338 248 310 245 270 215 Z"
          fill={`url(#${fin})`}
        />
        <path d="M 330 176 C 340 186 340 224 330 234 C 335 220 335 190 330 176 Z" fill={ink} />
        <path d="M 282 188 C 290 185 292 225 282 222 Z" fill="#ffffff" />
      </g>

      {/* 背鳍 */}
      <g className="fin-dorsal">
        <path d="M 145 152 C 165 110 220 115 235 152 Z" fill={`url(#${fin})`} />
        <path
          d="M 160 120 C 190 112 215 115 232 142 C 225 132 195 125 160 120 Z"
          fill={ink}
          opacity="0.85"
        />
      </g>

      {/* 腹鳍 */}
      <path
        className="fin-ventral"
        d="M 165 240 C 175 272 198 275 202 260 C 205 248 190 238 180 235 Z"
        fill={`url(#${fin})`}
      />

      {/* 身体 */}
      <path
        d="M 85 195 C 85 145 140 135 210 148 C 265 160 280 188 278 208 C 272 235 245 255 195 252 C 125 250 85 235 85 195 Z"
        fill={`url(#${body})`}
      />

      {/* 三条特征白纹 */}
      <path
        d="M 130 142 C 145 142 145 248 130 248 C 118 248 116 142 130 142 Z"
        fill={`url(#${stripe})`}
        stroke="#0f172a"
        strokeWidth="2.5"
      />
      <path
        d="M 195 147 C 220 148 215 252 195 252 C 182 252 185 147 195 147 Z"
        fill={`url(#${stripe})`}
        stroke="#0f172a"
        strokeWidth="2.5"
      />
      <path
        d="M 255 178 C 265 178 265 232 255 232 C 248 232 248 178 255 178 Z"
        fill={`url(#${stripe})`}
        stroke="#0f172a"
        strokeWidth="2.5"
      />

      <ellipse cx="108" cy="214" rx="11" ry="8" fill="#f43f5e" opacity="0.4" />

      {/* 胸鳍 */}
      <path
        className="fin-pectoral"
        d="M 142 205 C 155 235 180 245 185 235 C 188 222 170 205 152 198 Z"
        fill={`url(#${fin})`}
        stroke="#0f172a"
        strokeWidth="1.8"
      />

      {/* 眼与嘴 */}
      <circle cx="106" cy="180" r="10" fill="#0f172a" />
      <circle cx="103" cy="176" r="3.8" fill="#ffffff" />
      <circle cx="109" cy="183" r="1.6" fill="#ffffff" opacity="0.8" />
      <path
        d="M 86 200 C 90 206 98 204 100 200"
        stroke={shade(palette.primary, -0.5)}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
