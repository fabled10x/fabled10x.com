import type { ComponentType } from 'react';
import * as aiDelivery2026Q3 from './ai-delivery-2026-q3.mdx';
import * as workflowMastery2026Q4 from './workflow-mastery-2026-q4.mdx';

export interface MdxModule {
  default: ComponentType;
  meta: unknown;
}

export const cohortManifest: Record<string, MdxModule> = {
  'ai-delivery-2026-q3.mdx': aiDelivery2026Q3 as unknown as MdxModule,
  'workflow-mastery-2026-q4.mdx': workflowMastery2026Q4 as unknown as MdxModule,
};
