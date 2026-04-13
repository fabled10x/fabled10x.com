import type { ComponentType } from 'react';
import * as workflowTemplates from './workflow-templates.mdx';
import * as discoveryToolkit from './discovery-toolkit.mdx';

export interface MdxModule {
  default: ComponentType;
  meta: unknown;
}

export const productManifest: Record<string, MdxModule> = {
  'workflow-templates.mdx': workflowTemplates as unknown as MdxModule,
  'discovery-toolkit.mdx': discoveryToolkit as unknown as MdxModule,
};
