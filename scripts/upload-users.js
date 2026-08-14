#!/usr/bin/env node
// Bulk-upserts users/{employeeId} documents into Firestore from a
// users.xlsx or users.csv file (same file reader handles both formats).
//
// Run locally by an admin — this is a CLI tool, never exposed to the
// browser app. It uses the Firebase Admin SDK with a service account key,
// which bypasses firestore.rules entirely (the app's own rules block all
// client-side writes to `users` on purpose — see firestore.rules).
//
// Usage:
//   node scripts/upload-users.js <users.xlsx-or-csv> [service-account-key.json]
//
// If the key path is omitted, GOOGLE_APPLICATION_CREDENTIALS is used
// instead. Get a key from: Firebase Console > Project Settings >
// Service Accounts > Generate new private key. Never commit that file —
// see .gitignore.
//
// Expected columns (header row, any order): employeeId, name, department,
// active. Existing users/{employeeId} docs are merged (upsert), not
// replaced wholesale — fields not present in the sheet are left alone.

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

const REQUIRED_COLUMNS = ['employeeId', 'name', 'department', 'active'];
const FIRESTORE_BATCH_LIMIT = 500;

function fail(msg) {
  console.error(`오류: ${msg}`);
  process.exit(1);
}

// Excel stores numeric-looking IDs as numbers by default — force to a
// plain integer string ("501482", never "501482.0" or "5.01482e+5") since
// Firestore doc IDs here are strings and the login gate looks them up as
// typed text. If the sheet's employeeId column is formatted as Text in
// Excel, leading zeros survive; if it's a plain number, Excel has already
// dropped them before this script ever sees the value — nothing to do
// about that here, only in how the sheet is authored.
function normalizeEmployeeId(raw) {
  if (typeof raw === 'number') return String(Math.trunc(raw));
  return String(raw ?? '').trim();
}

function normalizeActive(raw) {
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').trim().toLowerCase();
  return ['true', '1', 'y', 'yes', 'o', 'active'].includes(s);
}

// Parses the sheet into { employeeId, name, department, active } rows and
// a list of per-row problems. Pure/no I/O beyond the given workbook, so
// it's the one piece of this script worth testing in isolation.
function parseRows(rows) {
  if (!rows.length) return { parsed: [], errors: ['파일에 데이터 행이 없습니다.'] };

  const header = Object.keys(rows[0]);
  const missingCols = REQUIRED_COLUMNS.filter(c => !header.includes(c));
  if (missingCols.length) {
    return { parsed: [], errors: [`필수 컬럼이 없습니다: ${missingCols.join(', ')} (실제 컬럼: ${header.join(', ')})`] };
  }

  const parsed = [];
  const errors = [];
  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for the header row, +1 to make it 1-indexed
    const employeeId = normalizeEmployeeId(row.employeeId);
    const name = String(row.name ?? '').trim();
    const department = String(row.department ?? '').trim();
    const active = normalizeActive(row.active);

    if (!employeeId) { errors.push(`${rowNum}행: employeeId가 비어 있습니다.`); return; }
    if (!name) { errors.push(`${rowNum}행 (employeeId=${employeeId}): name이 비어 있습니다.`); return; }

    parsed.push({ employeeId, name, department, active });
  });
  return { parsed, errors };
}

// Same employeeId appearing twice within one file: last row wins (matches
// the "upsert" framing — a later row is a correction of an earlier one).
function dedupeByEmployeeId(rows) {
  const byId = new Map();
  for (const r of rows) {
    if (byId.has(r.employeeId)) {
      console.warn(`경고: employeeId ${r.employeeId} 가 파일 내에서 중복됩니다 — 마지막 행 값으로 덮어씁니다.`);
    }
    byId.set(r.employeeId, r);
  }
  return [...byId.values()];
}

async function uploadToFirestore(db, rows) {
  console.log(`${rows.length}명의 사용자를 users/{employeeId}에 upsert합니다...`);
  let done = 0;
  for (let i = 0; i < rows.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = rows.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach(r => {
      const ref = db.collection('users').doc(r.employeeId);
      batch.set(ref, { name: r.name, department: r.department, active: r.active }, { merge: true });
    });
    await batch.commit();
    done += chunk.length;
    console.log(`  ${done} / ${rows.length} 완료`);
  }
  console.log('업로드 완료.');
}

async function main() {
  const [, , inputPathArg, keyPathArg] = process.argv;
  if (!inputPathArg) {
    fail('사용법: node scripts/upload-users.js <users.xlsx 또는 users.csv> [service-account-key.json]');
  }
  const inputPath = path.resolve(inputPathArg);
  if (!fs.existsSync(inputPath)) fail(`파일을 찾을 수 없습니다: ${inputPath}`);

  const keyPath = keyPathArg ? path.resolve(keyPathArg) : process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath || !fs.existsSync(keyPath)) {
    fail(
      'Firebase 서비스 계정 키(JSON)를 찾을 수 없습니다.\n' +
      '  두 번째 인자로 경로를 넘기거나 GOOGLE_APPLICATION_CREDENTIALS 환경변수를 설정하세요.\n' +
      '  (Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성)'
    );
  }

  const workbook = XLSX.readFile(inputPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const { parsed, errors } = parseRows(rows);
  if (errors.length) {
    console.error(`\n${errors.length}개 행에서 오류가 발견되어 업로드를 중단합니다:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const finalRows = dedupeByEmployeeId(parsed);

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  await uploadToFirestore(db, finalRows);
}

if (require.main === module) {
  main().catch(e => {
    console.error('업로드 중 오류 발생:', e);
    process.exit(1);
  });
}

module.exports = { parseRows, normalizeEmployeeId, normalizeActive, dedupeByEmployeeId };
