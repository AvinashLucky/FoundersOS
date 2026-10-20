/**
 * save-session.js — Unified session saver for competitor research.
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage: node research/explorers/save-session.js <competitor-id>
 *
 * Examples:
 *   node research/explorers/save-session.js invideo
 *   node research/explorers/save-session.js heygen
 * ─────────────────────────────────────────────────────────────────────────────
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { saveManualSession } from '../lib/session-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../');

const [,, competitorId] = process.argv;

if (!competitorId) {
  console.error('\nUsage: node research/explorers/save-session.js <competitor-id>\n');
  console.error('  Competitor ID must match a folder in research/competitors/<id>/\n');
  process.exit(1);
}

const configPath = path.join(ROOT, 'research/competitors', competitorId, 'config.js');
if (!fs.existsSync(configPath)) {
  console.error(`\n❌ No config found at: ${configPath}`);
  console.error(`   Create research/competitors/${competitorId}/config.js first\n`);
  process.exit(1);
}

const { default: config } = await import(pathToFileURL(configPath).href);
const sessionPath = path.join(ROOT, 'research/browser-sessions', `${competitorId}.json`);

// Competitor configs can override session-save behavior via getSession().
// Default: manual browser login (works for any third-party app).
if (typeof config.getSession === 'function') {
  // Programmatic auth (e.g. Avion-style Supabase API login)
  console.log(`\n🔑 Using programmatic auth for ${config.name}...`);
  const session = await config.getSession();
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  console.log(`✅ Session saved → ${sessionPath}`);
} else {
  // Manual login (default for third-party competitors)
  await saveManualSession({
    appUrl: config.appUrl,
    sessionPath,
    competitorName: config.name,
  });
}
