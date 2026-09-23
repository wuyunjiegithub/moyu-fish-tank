import type { FishPalette } from '@/types';

export interface FishArtProps {
  palette: FishPalette;
  /** 渲染尺寸（正方形外框边长，px） */
  size: number;
}
