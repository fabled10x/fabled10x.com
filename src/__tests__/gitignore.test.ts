import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const GITIGNORE_PATH = path.resolve(__dirname, '..', '..', '.gitignore');

describe('.gitignore db volume documentation', () => {
  it('infra_gitignore_documents_docker_volume: mentions docker volume data handling (doc or rule)', () => {
    expect(existsSync(GITIGNORE_PATH)).toBe(true);
    const text = readFileSync(GITIGNORE_PATH, 'utf8');

    const mentionsDocker = /docker/i.test(text);
    const mentionsVolume = /volume/i.test(text);
    const hasDataRule = /^\/?data\/?/m.test(text);
    const hasPostgresRule = /postgres/i.test(text);

    expect(mentionsDocker || mentionsVolume || hasDataRule || hasPostgresRule).toBe(
      true,
    );
  });
});
