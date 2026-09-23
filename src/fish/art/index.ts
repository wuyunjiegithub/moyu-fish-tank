import type { ComponentType } from 'react';
import type { FishSpeciesId } from '@/types';
import type { FishArtProps } from './types';
import { GoldfishArt } from './Goldfish';
import { ClownfishArt } from './Clownfish';
import { BettaArt } from './Betta';
import { PufferArt } from './Puffer';

/** 鱼种 → 矢量外观。新增鱼种时在此登记。 */
const ART_BY_SPECIES: Partial<Record<FishSpeciesId, ComponentType<FishArtProps>>> = {
  goldfish: GoldfishArt,
  clownfish: ClownfishArt,
  betta: BettaArt,
  puffer: PufferArt,
};

export function getFishArt(id: FishSpeciesId): ComponentType<FishArtProps> {
  return ART_BY_SPECIES[id] ?? GoldfishArt;
}

export type { FishArtProps };
