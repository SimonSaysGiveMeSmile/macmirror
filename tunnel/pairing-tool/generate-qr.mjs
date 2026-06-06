#!/usr/bin/env node
// MacMirror — host-side pairing QR generator (Milestone 1).
//
// Builds the pairing payload defined in tunnel/protocol/PAIRING.md:
//   macmirror://pair?host=<ipv6>&port=<n>&fp=<cert-sha256-hex>&tok=<token>&v=1
// and renders it as a scannable QR (terminal + PNG), plus a tappable link.
//
// The `fp` (host TLS cert fingerprint) is what the client PINS to defeat MITM;
// `tok` is a single-use session token. This is the HOST half of QR pairing —
// the CLIENT half (camera scan + verify + connect) lands in the moonlight-ios
// fork under client/.
//
// Usage:
//   node generate-qr.mjs                 # auto-detect global IPv6, port from sunshine.conf
//   node generate-qr.mjs --host <addr>   # override host address (e.g. a specific IPv6 or LAN IP)
//   node generate-qr.mjs --port 3333     # override base port
//   MACMIRROR_OUT=/path/qr.png node generate-qr.mjs

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import QRCode from 'qrcode';

const HOME = os.homedir();
const CERT = path.join(HOME, '.config/sunshine/credentials/cacert.pem');
const CONF = path.join(HOME, '.config/sunshine/sunshine.conf');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// --- cert fingerprint (DER SHA-256), lowercased hex, no colons -------------
function certFingerprint() {
  if (!fs.existsSync(CERT)) {
    throw new Error(`Host cert not found at ${CERT} — start the host once to generate it.`);
  }
  const out = execFileSync('openssl',
    ['x509', '-in', CERT, '-noout', '-fingerprint', '-sha256'], { encoding: 'utf8' });
  // "sha256 Fingerprint=61:C1:10:..."
  return out.split('=')[1].trim().replace(/:/g, '').toLowerCase();
}

// --- base port (parse sunshine.conf `port = NNNN`, default 3333) -----------
function basePort() {
  const cli = arg('port');
  if (cli) return Number(cli);
  try {
    const m = fs.readFileSync(CONF, 'utf8').match(/^\s*port\s*=\s*(\d+)/m);
    if (m) return Number(m[1]);
  } catch {}
  return 3333;
}

// --- pick the host address -------------------------------------------------
// Prefer a global IPv6 (the cross-internet path, matching Son-of-Anton).
// Also surface a LAN IPv4 as the `lan` hint for same-network fast-path.
function addresses() {
  const ifaces = os.networkInterfaces();
  const v6 = [];
  let lan4 = null;
  for (const list of Object.values(ifaces)) {
    for (const a of list || []) {
      if (a.internal) continue;
      if (a.family === 'IPv6' && a.scopeid === 0 &&
          !a.address.startsWith('fe80') && a.address !== '::1') {
        v6.push(a.address);
      }
      if (a.family === 'IPv4' && !lan4) lan4 = a.address;
    }
  }
  return { v6, lan4 };
}

function buildURL({ host, port, fp, tok, name, lan }) {
  const q = new URLSearchParams({ host, port: String(port), fp, tok, v: '1' });
  if (name) q.set('name', name);
  if (lan) q.set('lan', lan);
  // host in the URL keeps brackets out of the query value; client wraps [v6] when dialing
  return `macmirror://pair?${q.toString()}`;
}

async function main() {
  const fp = certFingerprint();
  const port = basePort();
  const { v6, lan4 } = addresses();
  const host = arg('host', v6[0] || lan4 || '::1');
  const tok = crypto.randomBytes(16).toString('base64url'); // 128-bit single-use token
  const name = os.hostname().replace(/\.local$/, '');
  const lan = lan4 || undefined;

  const url = buildURL({ host, port, fp, tok, name, lan });

  console.log('\n  MacMirror — pairing payload (Milestone 1)\n');
  console.log(`  host (dial) : ${host}${host.includes(':') ? `  →  [${host}]:${port}` : `:${port}`}`);
  console.log(`  base port   : ${port}`);
  console.log(`  cert fp     : ${fp.slice(0, 16)}…  (pinned by client)`);
  console.log(`  token       : ${tok}  (single-use)`);
  if (v6.length > 1) console.log(`  other IPv6  : ${v6.slice(1).join(', ')}`);
  if (lan) console.log(`  LAN hint    : ${lan}`);
  console.log(`\n  link: ${url}\n`);

  // Terminal QR
  console.log(await QRCode.toString(url, { type: 'terminal', small: true }));

  // PNG QR
  const outPng = process.env.MACMIRROR_OUT || path.join(path.dirname(new URL(import.meta.url).pathname), 'pair-qr.png');
  await QRCode.toFile(outPng, url, { width: 512, margin: 2 });
  console.log(`  PNG written: ${outPng}`);
  console.log('\n  NOTE: stock Moonlight cannot scan this yet — consuming it is the');
  console.log('  client-fork task (camera scan + fingerprint pin + token). This proves');
  console.log('  the host half of QR pairing.\n');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
