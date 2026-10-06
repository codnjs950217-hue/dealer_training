#!/usr/bin/env node
// Exports the admin-only training report (trainingDaily, plus the legacy
// per-game trainingLogs rows from 2026-10-02~10-06) for a date range to
// .xlsx and .csv — one row per employee per day.
//
// Run locally by an admin — same as upload-users.js, it uses the Firebase
// Admin SDK with a service account key, which bypasses firestore.rules
// (the app's rules block all client-side reads of these collections).
//
// Usage:
//   node scripts/export-training.js <from YYYY-MM-DD> <to YYYY-MM-DD> [service-account-key.json]
//
// If the key path is omitted, GOOGLE_APPLICATION_CREDENTIALS is used.
// Output files land in the current directory:
//   training-report_<from>_<to>.xlsx / .csv  (CSV has a UTF-8 BOM so Excel
//   opens Korean names correctly)
//
// Column order is fixed here (COLUMNS) rather than in Firestore — the
// Firebase Console always sorts fields alphabetically, so the export is
// the only place the order can be controlled. Rows are sorted by lastAt
// (oldest first).

const fs = require('fs');
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

// lastAt is a Firestore Timestamp (current) or ms number (written while
// the rules still required int, and legacy trainingLogs) — normalize to ms.
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

// Merges trainingDaily docs and legacy trainingLogs docs (one per game) into
// one row per date+employeeId. Totals are recomputed from the per-game
// columns so legacy rows (which never had totals) come out consistent.
// `users` maps employeeId -> users/{id} data, used to fill department for
// docs written before department was recorded.
function buildRows(dailyDocs, legacyDocs, users) {
  const byKey = new Map();
  const rowFor = d => {
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
    return row;
  };

  for (const d of dailyDocs) {
    const row = rowFor(d);
    GAMES.forEach(g => STATS.forEach(s => { row[g + s] += d[g + s] || 0; }));
  }
  for (const d of legacyDocs) {
    const g = String(d.game || '').toLowerCase();
    if (!GAMES.includes(g)) continue;
    const row = rowFor(d);
    row[g + 'Count'] += d.playCount || 0;
    row[g + 'Minutes'] += d.playMinutes || 0;
    row[g + 'Mistakes'] += d.mistakes || 0;
  }

  const rows = [...byKey.values()];
  for (const row of rows) {
    if (!row.department && users[row.employeeId]) row.department = users[row.employeeId].department || '';
    for (const s of STATS) row['total' + s] = GAMES.reduce((sum, g) => sum + row[g + s], 0);
    row.lastAt = formatKST(row._lastAtMs);
  }
  // lastAt 순(오래된 것 먼저). lastAt이 없는 예전 행은 그 날짜의 시작
  // 시각으로 취급해 날짜 순서는 지킨다.
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

async function main() {
  const [, , from, to, keyPathArg] = process.argv;
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  if (!isDate(from) || !isDate(to)) {
    fail('사용법: node scripts/export-training.js <시작일 YYYY-MM-DD> <종료일 YYYY-MM-DD> [service-account-key.json]');
  }
  if (from > to) fail(`시작일(${from})이 종료일(${to})보다 늦습니다.`);

  const keyPath = keyPathArg ? path.resolve(keyPathArg) : process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath || !fs.existsSync(keyPath)) {
    fail(
      'Firebase 서비스 계정 키(JSON)를 찾을 수 없습니다.\n' +
      '  세 번째 인자로 경로를 넘기거나 GOOGLE_APPLICATION_CREDENTIALS 환경변수를 설정하세요.\n' +
      '  (Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성)'
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  // date는 'YYYY-MM-DD' 문자열이라 사전순 범위 비교 = 날짜 범위 비교.
  // 단일 필드 범위 쿼리라 별도 인덱스가 필요 없다.
  const inRange = name => db.collection(name).where('date', '>=', from).where('date', '<=', to).get();
  const [dailySnap, legacySnap, usersSnap] = await Promise.all([
    inRange('trainingDaily'), inRange('trainingLogs'), db.collection('users').get(),
  ]);
  const users = Object.fromEntries(usersSnap.docs.map(d => [d.id, d.data()]));
  const table = buildRows(dailySnap.docs.map(d => d.data()), legacySnap.docs.map(d => d.data()), users);

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
