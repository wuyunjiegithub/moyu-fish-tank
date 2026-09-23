import type { RefObject } from 'react';

/**
 * 抚摸手势光标。
 *
 * 没用 CSS `cursor: url(...)`：那只能贴一张静态图，而「摸鱼」要的是手上带抚摩的
 * 动势。所以改成——悬停在鱼身上时把系统光标藏掉（`.fish-node { cursor: none }`），
 * 由这个跟随指针的 DOM 手代替，动效才有地方挂。
 *
 * 手型上下翻转（指尖朝下、手背朝上），触点落在 viewBox 的 (14.7, 5)，
 * 外层按此偏移，让指尖正好压在指针上。
 */
export const PET_HAND_HOTSPOT = { x: 14.7, y: 5 } as const;

export function PetHand({ handRef }: { handRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="pet-hand" ref={handRef} aria-hidden>
      {/* 白手。白底上用描边＋投影勾出轮廓，深色壁纸上靠投影拉开层次 */}
      <svg
        viewBox="0 0 32 32"
        width={32}
        height={32}
        fill="rgb(255 255 255 / 0.94)"
        stroke="rgb(30 41 59 / 0.32)"
        strokeWidth={0.9}
        strokeLinejoin="round"
      >
        <rect x="8.8" y="16.5" width="3.6" height="9" rx="1.8" transform="rotate(-10 10.6 18)" />
        <rect x="12.9" y="17" width="3.6" height="10" rx="1.8" transform="rotate(-3 14.7 19)" />
        <rect x="17" y="17" width="3.6" height="9.4" rx="1.8" transform="rotate(4 18.8 19)" />
        <rect x="21.1" y="16" width="3.4" height="7.8" rx="1.7" transform="rotate(11 22.8 18)" />
        <rect x="4.6" y="12.4" width="3.8" height="7.6" rx="1.9" transform="rotate(38 6.5 16)" />
        <rect x="8" y="7" width="15.6" height="12.4" rx="5.6" />
        <rect x="11.4" y="1.2" width="9" height="8" rx="3" />
      </svg>
    </div>
  );
}