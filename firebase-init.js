// Firebase bootstrap for the 사번(employee ID) login gate.
// This is a native ES module (loaded via <script type="module"> in
// index.html) so it can `import` straight from the gstatic CDN with no
// build step — main.js itself stays a plain classic script and talks to
// this file only through window.DealerAuth, set at the bottom.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  initializeFirestore, doc, getDoc, runTransaction,
  collection, query, orderBy, limit, getDocs,
  onSnapshot, updateDoc, deleteField,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJjIW0ufpyKYLYpRPK7_t0xFuVnpFsoWk",
  authDomain: "casino-dealer-training.firebaseapp.com",
  projectId: "casino-dealer-training",
  storageBucket: "casino-dealer-training.firebasestorage.app",
  messagingSenderId: "159937756859",
  appId: "1:159937756859:web:ee8bcc7197fec7cc68b39e"
};

// Init errors (bad config, blocked script, etc.) are caught here rather
// than left to throw at module-eval time — that would just kill this
// script silently with nothing but a browser-console stack trace, leaving
// window.DealerAuth undefined and main.js's waitForDealerAuth() spinning
// for its full 8s timeout before showing a generic "can't reach server"
// with no indication *why*. Capturing it means lookupEmployee() can throw
// a specific, visible error immediately instead.
//
// initializeFirestore(..., { experimentalAutoDetectLongPolling: true })
// instead of plain getFirestore() — Firestore's default transport is a
// streaming WebChannel connection that some proxied/restrictive networks
// (corporate firewalls, some containerized preview environments) block or
// hang on, even though plain HTTPS requests (e.g. a REST GET) go through
// fine. This makes the SDK probe and fall back to long-polling
// automatically instead of hanging on the streaming connection. Safe
// default — slightly more request overhead, no functional downside — left
// on unconditionally rather than only after confirming streaming is
// actually the problem.
let db, initError = null;
try {
  const app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch (e) {
  initError = e;
  console.error('[DealerAuth] Firebase 초기화 실패:', e);
}

// Looks up users/{employeeId} and checks active === true.
// Resolves to { ok: true, employeeId, name } or { ok: false, reason }.
// Throws (with the original Firebase error's .code/.message intact) on
// any Firestore/network failure — main.js's Auth.login() is responsible
// for turning that into a readable on-screen message.
async function lookupEmployee(employeeId) {
  if (initError) {
    throw new Error('Firebase 초기화 실패: ' + initError.message);
  }
  try {
    const ref = doc(db, "users", employeeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ok: false, reason: "not_found" };
    const data = snap.data();
    if (data.active !== true) return { ok: false, reason: "inactive" };
    return { ok: true, employeeId, name: data.name || employeeId };
  } catch (e) {
    console.error(`[DealerAuth] users/${employeeId} 조회 실패:`, e.code || '(no code)', e.message, e);
    throw e;
  }
}

// Roulette Pay Practice's "🏆 랭킹 도전" (60s timed challenge, 고급 난이도
// only) leaderboard. One doc per employeeId (rouletteRankings/{employeeId})
// holds that person's personal-best challenge score — not a log of every
// attempt — so submitScore() only overwrites when the new run beats the
// stored one. Uses a transaction (not read-then-write) so two tabs/devices
// submitting at nearly the same instant can't race and silently drop the
// higher score.
async function submitRouletteRankScore(employeeId, name, score, mistakes) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "rouletteRankings", employeeId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists() && snap.data().score >= score) return; // keep existing personal best
    tx.set(ref, { name, score, mistakes, updatedAt: Date.now() });
  });
}

// Top N personal-best scores, highest first. Single-field orderBy only
// (score desc) — Firestore auto-indexes single fields, so this needs no
// manual composite-index setup in the Firebase console, unlike a
// multi-field sort (e.g. score desc + mistakes asc) would.
async function getRouletteTopScores(n = 20) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const q = query(collection(db, "rouletteRankings"), orderBy("score", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ employeeId: d.id, ...d.data() }));
}

// ---- 룰렛 "⚔️ 배틀하기" (2-5인 실시간 대결, room-code 기반) ----
// Cloud Functions가 없는 순수 클라이언트+Firestore 구조라, 방 하나 =
// battleRooms/{4자리코드} 문서 하나에 players 맵을 통째로 넣어 onSnapshot
// 리스너 하나로 방 전체 상태(대기실 인원, 진행 상태, 각자 점수)를 모든
// 클라이언트가 실시간으로 받게 한다. 서버 권위 로직이 없으므로 "누가
// 방장인지/자기 항목만 쓰는지"는 rouletteRankings와 동일하게 진짜 인증
// 없이 문서 스키마 검증(firestore.rules)에만 의존한다 — 이 파일은 순수
// Firestore CRUD 레이어로 유지하고, 게임 로직(언제 종료 판정을 내릴지,
// 순위를 어떻게 계산할지)은 main.js의 Sims.roulettePay.battle에 둔다.
function _genRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// 4자리 코드 공간(1만 개)에서 두 호스트가 동시에 같은 코드를 뽑는 드문
// 충돌을 대비해 setDoc이 아니라 트랜잭션으로 생성한다 — 단순 setDoc이면
// 나중에 쓴 쪽이 먼저 만든 방(이미 참가자가 있을 수도 있는)을 조용히
// 덮어써버린다. 코드가 이미 있으면 그 트랜잭션은 아무것도 안 쓰고 그냥
// 새 코드로 재시도한다(최대 5회).
async function createBattleRoom(employeeId, name) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = _genRoomCode();
    const ref = doc(db, "battleRooms", code);
    let created = false;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return; // 코드 충돌 — 이 트랜잭션은 아무것도 안 씀, 재시도
      tx.set(ref, {
        hostId: employeeId,
        status: 'waiting',
        createdAt: Date.now(),
        startedAt: null,
        players: { [employeeId]: { name, score: 0, mistakes: 0, finished: false, finishedAt: null } },
      });
      created = true;
    });
    if (created) return code;
  }
  throw new Error('room_create_failed');
}

// 이미 참가 중이면 그대로 성공 처리(중복 클릭 방어). 정원(5명)/시작
// 여부는 트랜잭션 안에서 다시 읽어 확인 — Firestore 낙관적 동시성으로
// 동시에 여러 명이 입장해도 정원 초과가 정확히 막힌다.
async function joinBattleRoom(code, employeeId, name) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not_found');
    const data = snap.data();
    if (data.players && data.players[employeeId]) return; // 이미 참가 중 — no-op
    if (data.status !== 'waiting') throw new Error('already_started');
    const count = data.players ? Object.keys(data.players).length : 0;
    if (count >= 5) throw new Error('room_full');
    tx.update(ref, { [`players.${employeeId}`]: { name, score: 0, mistakes: 0, finished: false, finishedAt: null } });
  });
}

// status==='waiting'일 때만 호스트 이탈 = 방 삭제(대기실에서 방장이
// 나가면 방 자체가 사라지는 게 자연스러움). 그 외(진행 중/종료됨)에는
// 호스트든 아니든 그냥 자기 항목만 제거 — 경기 중에 방을 통째로 지우면
// 남은 플레이어들의 리스너/화면이 끊기므로 절대 금지.
async function leaveBattleRoom(code, employeeId) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status === 'waiting' && data.hostId === employeeId) {
      tx.delete(ref);
      return;
    }
    tx.update(ref, { [`players.${employeeId}`]: deleteField() });
  });
}

async function startBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  await updateDoc(doc(db, "battleRooms", code), { status: 'playing', startedAt: Date.now() });
}

// 자기 자신의 항목만 점(.) 경로로 patch한다 — { players: { [id]: {...} } }
// 형태(중첩 객체)로 쓰면 Firestore가 players 맵 전체를 이 한 명 데이터로
// 갈아치워버려 다른 플레이어 기록이 사라진다. 점 경로 문자열 키라면
// 서로 다른 경로를 건드리는 동시 updateDoc끼리 충돌 없이 병합된다.
async function submitBattleResult(code, employeeId, score, mistakes) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  await updateDoc(doc(db, "battleRooms", code), {
    [`players.${employeeId}.score`]: score,
    [`players.${employeeId}.mistakes`]: mistakes,
    [`players.${employeeId}.finished`]: true,
    [`players.${employeeId}.finishedAt`]: Date.now(),
  });
}

// "마지막 사람이 끝났는지" 판정은 onSnapshot 리스너의 캐시된 스냅샷이
// 아니라 트랜잭션 안에서 새로 tx.get()한 데이터로 다시 계산한다 — 두
// 명이 거의 동시에 마지막으로 끝나도 트랜잭션 재시도로 안전하고, 이미
// 'finished'면 그냥 no-op(멱등)이라 15초 유예 fallback이 중복 호출해도
// 안전하다.
async function finishBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status === 'finished') return;
    tx.update(ref, { status: 'finished' });
  });
}

// 방을 없애고 새로 만드는 대신 같은 코드/참가자를 유지한 채 'waiting'으로
// 되돌린다 — 매 라운드 코드를 다시 공유할 필요 없이 같은 방에서 계속
// 재대결할 수 있게 하기 위함. status==='finished'일 때만 허용(진행 중인
// 방을 실수로 리셋하는 것 방지, firestore.rules에도 동일하게 강제).
// 참가자 목록은 그대로 두고 각자의 score/mistakes/finished만 초기화 —
// 리셋 시점에 라운드를 놓친 사람이 있어도 다음 라운드에 자동으로 다시
// 참여하게 된다(재입장 불필요).
async function resetBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status !== 'finished') return;
    const players = {};
    Object.keys(data.players || {}).forEach(id => {
      players[id] = { name: data.players[id].name, score: 0, mistakes: 0, finished: false, finishedAt: null };
    });
    tx.update(ref, { status: 'waiting', startedAt: null, players });
  });
}

// onSnapshot 구독 래퍼 — unsubscribe 함수를 그대로 반환하므로 호출부가
// 저장해뒀다가 teardown 시 그냥 호출하면 된다.
function subscribeBattleRoom(code, onChange, onError) {
  if (initError) { if (onError) onError(initError); return () => {}; }
  const ref = doc(db, "battleRooms", code);
  return onSnapshot(ref, (snap) => onChange(snap.exists() ? snap.data() : null), onError);
}

window.DealerAuth = {
  lookupEmployee, submitRouletteRankScore, getRouletteTopScores,
  createBattleRoom, joinBattleRoom, leaveBattleRoom, startBattleRoom,
  submitBattleResult, finishBattleRoom, resetBattleRoom, subscribeBattleRoom,
};
// Always fire this, even after an init failure — main.js is waiting on it
// to stop blocking on waitForDealerAuth()'s timeout; lookupEmployee()
// above will throw the real reason on first use either way.
window.dispatchEvent(new Event("dealerauth-ready"));
