#!/usr/bin/env node
/*
 * No-Docker local Postgres for development.
 *
 * Powered by Prisma 7's built-in `prisma dev` (PGlite under the hood) — a real
 * Postgres engine with pgvector, no Docker daemon required. This script:
 *   1. starts (or reuses) a detached dev server named "thongthai",
 *   2. captures its DATABASE_URL,
 *   3. applies migrations (`prisma migrate deploy`),
 *   4. optionally seeds (`--seed`),
 *   5. prints the URL to put in backend/.env.
 *
 *   pnpm db:dev          # start + migrate
 *   pnpm db:dev:seed     # start + migrate + seed demo data
 *   pnpm db:dev:stop     # stop the server
 *
 * First run downloads the `prisma dev` subcommand (needs network once).
 * Note: the full app also needs REDIS_URL; this only provisions Postgres.
 */
import { execSync } from 'node:child_process';

const NAME = 'thongthai';
const withSeed = process.argv.includes('--seed');
const URL_RE = /postgres:\/\/[^\s'"]+/;

function run(cmd, env) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
    env: env ?? process.env,
  });
}

function findUrl() {
  // Starting prints the URL; if it's already running, fall back to `ls`.
  try {
    const started = run(`npx prisma dev --detach --name ${NAME}`);
    const m = started.match(URL_RE);
    if (m) return m[0];
  } catch {
    /* already running — fall through to ls */
  }
  const listed = run(`npx prisma dev ls`);
  const m = listed.match(URL_RE);
  return m ? m[0] : null;
}

console.log('▶ Starting local dev database (prisma dev — no Docker)…');
const url = findUrl();
if (!url) {
  console.error('✗ Could not determine the dev database URL from `prisma dev`.');
  process.exit(1);
}
const dbEnv = { ...process.env, DATABASE_URL: url };

console.log('▶ Applying migrations…');
execSync('npx prisma migrate deploy', { stdio: 'inherit', env: dbEnv });

if (withSeed) {
  console.log('▶ Seeding demo data…');
  execSync('pnpm seed', { stdio: 'inherit', env: dbEnv });
}

console.log('\n✅ Local dev database ready (no Docker).');
console.log(`   DATABASE_URL=${url}`);
console.log('   → put that line in backend/.env, then run `pnpm start:dev`.');
console.log('   → stop the database with `pnpm db:dev:stop`.');
