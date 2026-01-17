import { cleanupE2E } from './e2e-setup';

export default async function teardownE2E() {
  await cleanupE2E();
}