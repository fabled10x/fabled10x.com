import type { ComponentType } from 'react';
import * as partyMasters from './party-masters.mdx';

export interface MdxModule {
  default: ComponentType;
  meta: unknown;
}

export const caseManifest: Record<string, MdxModule> = {
  'party-masters.mdx': partyMasters as unknown as MdxModule,
};
