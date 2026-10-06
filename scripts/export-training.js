#!/usr/bin/env node
// Exports the admin-only training report (trainingDaily) for a date range
// to .xlsx and .csv — one row per employee per day. (The legacy per-game
// trainingLogs collection from 2026-10-02~10-06 was deleted by the admin on
// 2026-10-06, so it is no longer read.)
//
// Run locally by an admin — same as upload-users.js, it uses the Firebase
// Admin SDK with a service account key, which bypasses firestore.rules
// (the app's rules block all client-side reads of these collections).
//
// Usage:
//   node scripts/export-training.js <from YYYY-MM-DD> <to YYYY-MM-DD> [service-account-key.json]
//
// If the key path is omitted, GOOGLE_APPLICATION_CREDENTIALS is used; if
// that isn't set either, the script falls back to the signed-in gcloud
// account (`gcloud auth print-access-token`) and reads Firestore over its
// REST API. That's how it runs inside Firebase Studio, where gcloud is
// already signed in as the project owner, so no key file needs uploading
// (added 2026-10-06 — the admin's company PC blocks file uploads). Like the
// Admin SDK, an IAM-authenticated REST call is not subject to
// firestore.rules.
// Output files land in the current directory:
//   training-report_<from>_<to>.xlsx / .csv  (CSV has a UTF-8 BOM so Excel
//   opens Korean names correctly)
//
// Column order is fixed here (COLUMNS) rather than in Firestore — the
// Firebase Console always sorts fields alphabetically, so the export is
// the only place the order can be controlled. Rows are sorted by lastAt
// (oldest first).

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Game order requested by the admin: Baccarat, Blackjack, Roulette, Poker —
// each as Count, Minutes, Mistakes. Day totals go last.
const GAMES = ['baccarat', 'blackjack', 'roulette', 'poker'];
const STATS = ['Count', 'Minutes', 'Mistakes'];
const COLUMNS = [
  'date', 'department', 'employeeId', 'name', 'lastAt',
  ...GAMES.flatMap(g => STATS.map(s => g + s)),
  'totalCount', 'totalMinutes', 'totalMistakes', 'sessionCount',
];

function fail(msg) {
  console.error(`오류: ${msg}`);
  process.exit(1);
}

// lastAt is a Firestore Timestamp (Admin SDK) or an ms number (REST path,
// or docs written while the rules still required int) — normalize to ms.
function toMillis(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v.toMillis === 'function') return v.toMillis();
  return null;
}

// Trainees are in KST; format independent of the admin machine's timezone.
function formatKST(ms) {
  if (ms == null) return '';
  return new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

// One trainingDaily doc is already one row (date+employeeId); the map
// keeps that keyed in case a range ever returns the same key twice.
// Totals are recomputed from the per-game columns so they always match.
// `users` maps employeeId -> users/{id} data, used to fill department for
// docs written before department was recorded.
function buildRows(dailyDocs, users) {
  const byKey = new Map();
  for (const d of dailyDocs) {
    const key = `${d.date}_${d.employeeId}`;
    if (!byKey.has(key)) {
      const row = { date: d.date, employeeId: d.employeeId, name: d.name || '', department: d.department || '', _lastAtMs: null, sessionCount: 0 };
      GAMES.forEach(g => STATS.forEach(s => { row[g + s] = 0; }));
      byKey.set(key, row);
    }
    const row = byKey.get(key);
    if (!row.department && d.department) row.department = d.department;
    const ms = toMillis(d.lastAt);
    if (ms != null && (row._lastAtMs == null || ms > row._lastAtMs)) row._lastAtMs = ms;
    row.sessionCount += d.sessionCount || 0;
    GAMES.forEach(g => STATS.forEach(s => { row[g + s] += d[g + s] || 0; }));
  }

  const rows = [...byKey.values()];
  for (const row of rows) {
    if (!row.department && users[row.employeeId]) row.department = users[row.employeeId].department || '';
    for (const s of STATS) row['total' + s] = GAMES.reduce((sum, g) => sum + row[g + s], 0);
    row.lastAt = formatKST(row._lastAtMs);
  }
  // lastAt 순(오래된 것 먼저). lastAt이 없는 행은 그 날짜의 시작 시각으로
  // 취급해 날짜 순서는 지킨다.
  const sortKey = r => r._lastAtMs != null ? r._lastAtMs : Date.parse(`${r.date}T00:00:00+09:00`);
  rows.sort((a, b) => sortKey(a) - sortKey(b) || a.employeeId.localeCompare(b.employeeId));
  return rows.map(r => COLUMNS.map(c => r[c]));
}

function writeOutputs(table, baseName) {
  const sheet = XLSX.utils.aoa_to_sheet([COLUMNS, ...table]);
  sheet['!cols'] = COLUMNS.map(c => ({ wch: Math.max(c.length + 2, c === 'lastAt' ? 17 : 10) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Daily');
  XLSX.writeFile(book, `${baseName}.xlsx`);
  fs.writeFileSync(`${baseName}.csv`, '﻿' + XLSX.utils.sheet_to_csv(sheet));
}

const PROJECT_ID = 'casino-dealer-training';

// ---- Admin SDK (service account key) ----
async function loadWithAdmin(keyPath, from, to) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();
  // date는 'YYYY-MM-DD' 문자열이라 사전순 범위 비교 = 날짜 범위 비교.
  // 단일 필드 범위 쿼리라 별도 인덱스가 필요 없다.
  const inRange = name => db.collection(name).where('date', '>=', from).where('date', '<=', to).get();
  const [dailySnap, usersSnap] = await Promise.all([
    inRange('trainingDaily'), db.collection('users').get(),
  ]);
  return {
    daily: dailySnap.docs.map(d => d.data()),
    users: Object.fromEntries(usersSnap.docs.map(d => [d.id, d.data()])),
  };
}

// ---- REST + gcloud 로그인 (키 파일 없을 때) ----
function restValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return Date.parse(v.timestampValue.replace(/(\.\d{3})\d+/, '$1'));
  if ('mapValue' in v) return restFields(v.mapValue.fields);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(restValue);
  return null;
}
function restFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k, restValue(v)]));
}
async function loadWithGcloud(from, to) {
  let token;
  try {
    token = execSync('gcloud auth print-access-token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    fail(
      '서비스 계정 키도 없고 gcloud 로그인도 되어 있지 않습니다.\n' +
      '  세 번째 인자로 키 경로를 넘기거나, `gcloud auth login` 후 다시 실행하세요.'
    );
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const runQuery = async structuredQuery => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    });
    if (!res.ok) throw new Error(`Firestore REST ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return (await res.json()).filter(r => r.document).map(r => r.document);
  };
  const inRange = collectionId => runQuery({
    from: [{ collectionId }],
    where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'date' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: from } } },
      { fieldFilter: { field: { fieldPath: 'date' }, op: 'LESS_THAN_OR_EQUAL', value: { stringValue: to } } },
    ] } },
  }).then(docs => docs.map(d => restFields(d.fields)));
  const [daily, userDocs] = await Promise.all([
    inRange('trainingDaily'), runQuery({ from: [{ collectionId: 'users' }] }),
  ]);
  const users = Object.fromEntries(userDocs.map(d => [d.name.split('/').pop(), restFields(d.fields)]));
  return { daily, users };
}

async function main() {
  const [, , from, to, keyPathArg] = process.argv;
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  if (!isDate(from) || !isDate(to)) {
    fail('사용법: node scripts/export-training.js <시작일 YYYY-MM-DD> <종료일 YYYY-MM-DD> [service-account-key.json]');
  }
  if (from > to) fail(`시작일(${from})이 종료일(${to})보다 늦습니다.`);

  const keyPath = keyPathArg ? path.resolve(keyPathArg) : process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPathArg && !fs.existsSync(keyPath)) fail(`서비스 계정 키 파일을 찾을 수 없습니다: ${keyPath}`);
  const { daily, users } = (keyPath && fs.existsSync(keyPath))
    ? await loadWithAdmin(keyPath, from, to)
    : await loadWithGcloud(from, to);
  const table = buildRows(daily, users);

  const baseName = `training-report_${from}_${to}`;
  writeOutputs(table, baseName);
  console.log(`${table.length}행 추출 완료 → ${baseName}.xlsx, ${baseName}.csv`);
}

if (require.main === module) {
  main().catch(e => {
    console.error('추출 중 오류 발생:', e);
    process.exit(1);
  });
}

module.exports = { buildRows, writeOutputs, formatKST, COLUMNS };
