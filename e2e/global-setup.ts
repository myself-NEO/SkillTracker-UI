import type { FullConfig } from '@playwright/test';
import { signInTestAccounts } from './backend';

/**
 * Signs each project's test account in once for the whole run (tokens are kept in e2e/.auth and
 * reused while valid), instead of once per worker: the backend allows 20 login attempts per 15
 * minutes from one address.
 */
export default async function globalSetup(config: FullConfig) {
  await signInTestAccounts(config.projects.map((project) => project.name));
}
