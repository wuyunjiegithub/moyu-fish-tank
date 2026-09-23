import type { FishPalette, FishSpeciesId } from '@/types';
import { alpha } from './color';
import { getFishArt } from './art';

interface FishRendererProps {
  speciesId: FishSpeciesId;
  palette: FishPalette;
  /** 正方形外框边长（px） */
  size: number;
  /** 鳍摆动周期与相位，用于错开每尾鱼的节奏 */
  finPeriod?: number;
  finDelay?: number;
}

/**
 * 鱼的统一渲染入口。
 * 只负责挑选外观与挂载动效变量；位置、朝向、鼓气由外层图层控制。
 */
export function FishRenderer({
  speciesId,
  palette,
  size,
  finPeriod = 1.6,
  finDelay = 0,
}: FishRendererProps) {
  const Art = getFishArt(speciesId);

  return (
    <div
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 5px 9px ${alpha(palette.primary, 0.3)})`,
        // 鳍摆动的节奏由外层注入，幅度由各鱼种自身声明
        ['--fin-period' as string]: `${finPeriod}s`,
        ['--fin-delay' as string]: `${finDelay}s`,
      }}
    >
      <Art palette={palette} size={size} />
    </div>
  );
}
