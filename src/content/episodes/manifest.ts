import type { ComponentType } from 'react';
import * as pilotPartyMastersDiscovery from './pilot-party-masters-discovery.mdx';

export interface MdxModule {
  default: ComponentType;
  meta: unknown;
}

export const episodeManifest: Record<string, MdxModule> = {
  'pilot-party-masters-discovery.mdx': pilotPartyMastersDiscovery as unknown as MdxModule,
};
