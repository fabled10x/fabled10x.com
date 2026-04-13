import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const COMPOSE_PATH = path.resolve(__dirname, '..', '..', 'docker-compose.yml');

describe('docker-compose.yml', () => {
  it('infra_docker_compose_postgres_16_alpine: services.postgres uses postgres:16-alpine + healthcheck + named volume', () => {
    expect(existsSync(COMPOSE_PATH)).toBe(true);
    const yaml = readFileSync(COMPOSE_PATH, 'utf8');

    expect(yaml).toMatch(/services:/);
    expect(yaml).toMatch(/postgres:/);
    expect(yaml).toMatch(/image:\s*postgres:16-alpine/);
    expect(yaml).toMatch(/healthcheck:/);
    expect(yaml).toMatch(/pg_isready/);
    expect(yaml).toMatch(/volumes:/);
    expect(yaml).toMatch(/fabled10x-postgres-data/);
    expect(yaml).toMatch(/5432:5432/);
    expect(yaml).toMatch(/POSTGRES_USER/);
    expect(yaml).toMatch(/POSTGRES_PASSWORD/);
    expect(yaml).toMatch(/POSTGRES_DB/);
  });
});
