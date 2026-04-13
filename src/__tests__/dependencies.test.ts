import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

describe('package dependencies', () => {
  it('infra_resend_installed', () => {
    expect(pkg.dependencies).toHaveProperty('resend');
  });

  it('infra_dependencies_postgres_in_package_json', () => {
    expect(pkg.dependencies).toHaveProperty('postgres');
  });

  it('infra_dependencies_drizzle_orm_in_package_json', () => {
    expect(pkg.dependencies).toHaveProperty('drizzle-orm');
  });

  it('infra_dependencies_drizzle_kit_in_dev_deps', () => {
    expect(pkg.devDependencies).toHaveProperty('drizzle-kit');
  });
});

describe('db npm scripts', () => {
  it('infra_npm_script_db_generate', () => {
    expect((pkg.scripts as Record<string, string>)['db:generate']).toMatch(
      /drizzle-kit\s+generate/,
    );
  });

  it('infra_npm_script_db_migrate', () => {
    expect((pkg.scripts as Record<string, string>)['db:migrate']).toMatch(
      /drizzle-kit\s+migrate/,
    );
  });

  it('infra_npm_script_db_studio', () => {
    expect((pkg.scripts as Record<string, string>)['db:studio']).toMatch(
      /drizzle-kit\s+studio/,
    );
  });

  it('infra_npm_script_db_up', () => {
    expect((pkg.scripts as Record<string, string>)['db:up']).toMatch(
      /docker\s+compose\s+up.*postgres/,
    );
  });

  it('infra_npm_script_db_down', () => {
    expect((pkg.scripts as Record<string, string>)['db:down']).toMatch(
      /docker\s+compose\s+down/,
    );
  });
});
