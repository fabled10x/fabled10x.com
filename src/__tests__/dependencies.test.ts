import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

describe('package dependencies', () => {
  it('infra_resend_installed', () => {
    expect(pkg.dependencies).toHaveProperty('resend');
  });
});
