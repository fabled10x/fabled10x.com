import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

afterEach(() => {
  cleanup();
});

// MSW server wiring — uncomment when src/__tests__/mocks/msw-server.ts exists
// import { server } from './mocks/msw-server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
