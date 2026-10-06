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
//   node scripts/upload-users.js <users.xlsx | .csv | .txt> [service-account-key.json] [--dry-run]
//
// If the key path is omitted, GOOGLE_APPLICATION_CREDENTIALS is used
// instead; if that isn't set either, the signed-in gcloud account writes via
// Firestore's REST API (IAM-authenticated, so firestore.rules don't apply —
// same as the Admin SDK). Added 2026-10-06 because the admin's company PC
// can't upload files (neither the key nor the sheet) into Firebase Studio:
// they now paste the Excel cells into a new .txt file in the Studio editor
// (tab-separated — read as such), and Korean headers 사번/이름/부서/활성 are
// accepted as aliases. --dry-run prints what would be written and stops. Get a key from: Firebase Console > Project Settings >
// Service Accounts > Generate new private key. Never commit that file —
// see .gitignore.
//
// Expected columns (header row, any order): employeeId, name, department,
// active. Existing users/{employeeId} docs are merged (upsert), not
// replaced wholesale — fields not present in the sheet are left alone.

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

const REQUIRED_COLUMNS = ['employeeId', 'name', 'department', 'active'];
const FIRESTORE_BATCH_LIMIT = 500;

const PROJECT_ID = 'casino-dealer-training';

// 한국어 머리글 → 스크립트가 쓰는 영문 컬럼명. 공백/대소문자 무시.
const HEADER_ALIASES = {
  '사번': 'employeeId', '직원번호': 'employeeId', 'employeeid': 'employeeId', 'id': 'employeeId',
  '이름': 'name', '성명': 'name', 'name': 'name',
  '부서': 'department', '소속': 'department', 'department': 'department', 'dept': 'department',
  '활성': 'active', '사용': 'active', '사용여부': 'active', '활성여부': 'active', 'active': 'active',
};
function normalizeHeaders(rows) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => {
    const key = String(k).trim();
    return [HEADER_ALIASES[key.replace(/\s+/g, '').toLowerCase()] || key, v];
  })));
}

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

// Excel에서 복사해 붙여넣은 텍스트(.txt/.tsv)는 탭 구분으로 읽는다.
// raw:true — 사번을 숫자로 바꾸지 않아 앞자리 0이 유지된다.
function readRows(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  let workbook;
  if (ext === '.txt' || ext === '.tsv') {
    const text = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
    workbook = XLSX.read(text, { type: 'string', FS: text.includes('\t') ? '\t' : ',', raw: true });
  } else {
    workbook = XLSX.readFile(inputPath);
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  let rows = normalizeHeaders(XLSX.utils.sheet_to_json(sheet, { defval: '' }));
  // active 칸이 아예 없으면 전원 활성으로 본다(신규 등록의 흔한 경우).
  if (rows.length && !('active' in rows[0])) {
    console.warn('알림: active(활성) 컬럼이 없어 전원 활성(TRUE)으로 등록합니다.');
    rows = rows.map(r => ({ ...r, active: true }));
  }
  // department 칸이 없어도 빈 부서로 등록(나중에 다시 올려서 채울 수 있음).
  if (rows.length && !('department' in rows[0])) rows = rows.map(r => ({ ...r, department: '' }));
  return rows;
}

// 키 파일 없을 때 — gcloud 로그인 토큰으로 REST :commit (500건씩). updateMask로
// name/department/active만 덮어써서 Admin SDK의 set(..., {merge:true})와 같다.
async function uploadWithGcloud(rows) {
  let token;
  try {
    token = execSync('gcloud auth print-access-token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    fail('서비스 계정 키도 없고 gcloud 로그인도 되어 있지 않습니다. 키 경로를 넘기거나 `gcloud auth login` 후 다시 실행하세요.');
  }
  const base = `projects/${PROJECT_ID}/databases/(default)/documents`;
  console.log(`${rows.length}명의 사용자를 users/{employeeId}에 upsert합니다...`);
  let done = 0;
  for (let i = 0; i < rows.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = rows.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const res = await fetch(`https://firestore.googleapis.com/v1/${base}:commit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ writes: chunk.map(r => ({
        update: {
          name: `${base}/users/${r.employeeId}`,
          fields: { name: { stringValue: r.name }, department: { stringValue: r.department }, active: { booleanValue: r.active } },
        },
        updateMask: { fieldPaths: ['name', 'department', 'active'] },
      })) }),
    });
    if (!res.ok) fail(`업로드 실패 (${res.status}): ${(await res.text()).slice(0, 300)}`);
    done += chunk.length;
    console.log(`  ${done} / ${rows.length} 완료`);
  }
  console.log('업로드 완료.');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const [inputPathArg, keyPathArg] = args.filter(a => a !== '--dry-run');
  if (!inputPathArg) {
    fail('사용법: node scripts/upload-users.js <users.xlsx | .csv | .txt> [service-account-key.json] [--dry-run]');
  }
  const inputPath = path.resolve(inputPathArg);
  if (!fs.existsSync(inputPath)) fail(`파일을 찾을 수 없습니다: ${inputPath}`);

  const keyPath = keyPathArg ? path.resolve(keyPathArg) : process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPathArg && !fs.existsSync(keyPath)) fail(`서비스 계정 키 파일을 찾을 수 없습니다: ${keyPath}`);

  const rows = readRows(inputPath);
  const { parsed, errors } = parseRows(rows);
  if (errors.length) {
    console.error(`\n${errors.length}개 행에서 오류가 발견되어 업로드를 중단합니다:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const finalRows = dedupeByEmployeeId(parsed);

  if (dryRun) {
    console.log(`[미리보기] ${finalRows.length}명 — 실제로 쓰지 않았습니다.`);
    console.table(finalRows.map(r => ({ 사번: r.employeeId, 이름: r.name, 부서: r.department || '(빈칸)', 활성: r.active })));
    return;
  }

  if (keyPath && fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    await uploadToFirestore(admin.firestore(), finalRows);
  } else {
    await uploadWithGcloud(finalRows);
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('업로드 중 오류 발생:', e);
    process.exit(1);
  });
}

module.exports = { parseRows, normalizeEmployeeId, normalizeActive, dedupeByEmployeeId, normalizeHeaders, readRows };
