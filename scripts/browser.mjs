// Shared Playwright launcher: uses the Chromium already in the Playwright cache
// (the pinned playwright package skips its own browser download).
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!existsSync(cache)) return undefined;
  const dirs = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    const app = join(cache, d, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
    if (existsSync(app)) return app;
    const arm = app.replace('chrome-mac-x64', 'chrome-mac-arm64');
    if (existsSync(arm)) return arm;
  }
  return undefined;
}

export async function launch() {
  return chromium.launch({ executablePath: findChromium(), args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
}
