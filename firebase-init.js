// Firebase bootstrap for the 사번(employee ID) login gate.
// This is a native ES module (loaded via <script type="module"> in
// index.html) so it can `import` straight from the gstatic CDN with no
// build step — main.js itself stays a plain classic script and talks to
// this file only through window.DealerAuth, set at the bottom.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  initializeFirestore, doc, getDoc, getDocFromServer, setDoc, runTransaction,
  collection, query, orderBy, limit, getDocs,
  onSnapshot, updateDoc, deleteDoc, deleteField, increment, serverTimestamp, Timestamp,
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
// Resolves to { ok: true, employeeId, name, department } or { ok: false, reason }.
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
    return { ok: true, employeeId, name: data.name || employeeId, department: data.department || '' };
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
// 방 문서의 시각 필드(startedAt, players.*.finishedAt/lastCorrectAt)는
// 2026-10-06부터 Firestore Timestamp로 저장한다 — 관리자가 Console에서
// 날짜/시간으로 읽을 수 있게(숫자 ms는 13자리 숫자로만 보였음). main.js의
// 배틀 로직은 전부 ms 숫자 연산(카운트다운, RNG seed, 순위 정렬)이라,
// 이 파일이 읽어서 넘겨줄 때(_roomData) 다시 ms로 바꿔 main.js는 그대로
// 둔다. 예전 방(숫자로 저장된 값)도 그대로 통과한다.
const _ts = ms => (ms == null ? null : Timestamp.fromMillis(ms));
const _ms = v => (v && typeof v.toMillis === 'function' ? v.toMillis() : v);
function _roomData(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  data.startedAt = _ms(data.startedAt);
  data.createdAt = _ms(data.createdAt);
  for (const p of Object.values(data.players || {})) {
    if (!p) continue;
    p.finishedAt = _ms(p.finishedAt);
    p.lastCorrectAt = _ms(p.lastCorrectAt);
  }
  return data;
}

function _genRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// 4자리 코드 공간(1만 개)에서 두 호스트가 동시에 같은 코드를 뽑는 드문
// 충돌을 대비해 setDoc이 아니라 트랜잭션으로 생성한다 — 단순 setDoc이면
// 나중에 쓴 쪽이 먼저 만든 방(이미 참가자가 있을 수도 있는)을 조용히
// 덮어써버린다. 코드가 이미 있으면 그 트랜잭션은 아무것도 안 쓰고 그냥
// 새 코드로 재시도한다(최대 5회).
// mode: 'time' | 'round', limitValue: mode==='time'면 제한시간(초, 60
// 이상), mode==='round'면 라운드 수(1 이상) — 둘 다 호스트가 방 설정
// 화면에서 고른 값 그대로, 방 생성 시점에 한 번 박히고 이후 바뀌지
// 않는다(firestore.rules의 update 규칙이 불변으로 강제).
//
// createdAt은 Firestore Timestamp(Console에서 날짜로 보임)로 먼저 써 보고,
// 게시된 규칙이 아직 예전 것(createdAt is int)이라 permission-denied가 나면
// 숫자 ms로 다시 만든다 — 규칙 게시 순서와 무관하게 방 생성이 깨지지
// 않게. 거부된 트랜잭션은 아무것도 쓰지 않으므로 재시도해도 중복 없음.
async function createBattleRoom(employeeId, name, mode, limitValue) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  try {
    return await _createBattleRoom(employeeId, name, mode, limitValue, serverTimestamp());
  } catch (e) {
    if (!e || e.code !== 'permission-denied') throw e;
    console.warn('[battle] createdAt timestamp 거부됨(firestore.rules 미게시?) — 숫자 ms로 재시도');
    return _createBattleRoom(employeeId, name, mode, limitValue, Date.now());
  }
}

async function _createBattleRoom(employeeId, name, mode, limitValue, createdAt) {
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
        // 기록용 값(코드 어디서도 다시 읽지 않음). startedAt은 카운트다운/
        // RNG seed로 숫자 연산에 쓰이므로 ms 그대로 둔다.
        createdAt,
        startedAt: null,
        mode, limitValue,
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

// 2026-10-02 변경: 호스트가 나가도 배틀이 이미 시작(playing)된 뒤라면
// 더 이상 방을 통째로 지우지 않는다 — 나머지 참가자가 배틀을 계속
// 진행할 수 있어야 하므로, 호스트도 "참가자 한 명이 빠지는" 것과 똑같이
// 처리한다(방 자체는 유지, 호스트의 players 항목만 제거). 호스트가
// 아직 시작도 안 한 대기실(waiting)에서 나가는 경우만 예전처럼 방을
// 즉시 삭제한다 — 호스트 없이는 시작할 방법이 없는 단계라 지우는 게
// 맞다. 호스트가 아닌 참가자는 상태와 무관하게 항상 자기 항목만 제거
// (기존 동작 그대로), 그 결과 참가자가 0명이 되면 방도 함께 삭제한다.
async function leaveBattleRoom(code, employeeId) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.hostId === employeeId && data.status === 'waiting') {
      tx.delete(ref);
      return;
    }
    const players = { ...(data.players || {}) };
    delete players[employeeId];
    if (Object.keys(players).length === 0) {
      tx.delete(ref);
      return;
    }
    tx.update(ref, { [`players.${employeeId}`]: deleteField() });
  });
}

// startedAt을 지금 이 순간이 아니라 5초 뒤로 박아 쓴다 — 모든 참가자의
// 화면이 'playing' 전환을 받자마자 바로 룰렛이 도는 게 아니라, 그
// startedAt까지 "곧 시작합니다" 카운트다운을 먼저 보게 한다
// (Sims.roulettePay._armBattleReady, main.js). battleEndAt(60초 마감)은
// 이 startedAt을 그대로 기준으로 삼으므로 준비 시간만큼 실제 플레이
// 시간이 줄지는 않는다.
//
// 2026-10-05: 5초 → 6초. 화면엔 5부터 보여야 하는데, 참가자는 이
// 'playing' 전환을 네트워크 왕복만큼 늦게 받아 남은 시간이 이미 4.x초라
// 4부터 뜨는 문제가 있었다. 1초 여유를 더 두고 표시는 최대 5로 자르면
// (main.js _armBattleReady) 최대 ~2초 늦게 받은 기기까지 5부터 보이고,
// 실제 시작 시각은 여전히 모든 기기가 같다.
const BATTLE_READY_LEAD_MS = 6000;
async function startBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  await updateDoc(doc(db, "battleRooms", code), { status: 'playing', startedAt: _ts(Date.now() + BATTLE_READY_LEAD_MS) });
}

// 자기 자신의 항목만 점(.) 경로로 patch한다 — { players: { [id]: {...} } }
// 형태(중첩 객체)로 쓰면 Firestore가 players 맵 전체를 이 한 명 데이터로
// 갈아치워버려 다른 플레이어 기록이 사라진다. 점 경로 문자열 키라면
// 서로 다른 경로를 건드리는 동시 updateDoc끼리 충돌 없이 병합된다.
//
// lastCorrectAt(2026-10-02, 순위 판정용): 제한시간 모드는 전원이 거의
// 같은 순간(제한시간 종료)에 finishedAt을 찍으므로 그걸로는 순위를 가를
// 수 없다 — 대신 "마지막 정답을 실제로 맞힌 시각"을 따로 받아서 저장한다
// (main.js의 submitPay()/_endBattleLocal()이 채워서 넘김). players 맵
// 내부 필드는 firestore.rules가 스키마를 깊이 검증하지 않으므로(바깥쪽
// 7개 키만 검증) 이 필드 추가에 규칙 재배포는 필요 없다.
async function submitBattleResult(code, employeeId, score, mistakes, lastCorrectAt) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  await updateDoc(doc(db, "battleRooms", code), {
    [`players.${employeeId}.score`]: score,
    [`players.${employeeId}.mistakes`]: mistakes,
    [`players.${employeeId}.finished`]: true,
    [`players.${employeeId}.finishedAt`]: _ts(Date.now()),
    [`players.${employeeId}.lastCorrectAt`]: _ts(lastCorrectAt),
  });
}

// "마지막 사람이 끝났는지" 판정은 onSnapshot 리스너의 캐시된 스냅샷이
// 아니라 트랜잭션 안에서 새로 tx.get()한 데이터로 다시 계산한다 — 두
// 명이 거의 동시에 마지막으로 끝나도 트랜잭션 재시도로 안전하고, 이미
// 'finished'면 그냥 no-op(멱등)이라 15초 유예 fallback이 중복 호출해도
// 안전하다.
//
// 2026-10-02 버그 수정: 이 함수가 실제로는 "전원 완료"를 전혀 확인하지
// 않고 호출될 때마다 무조건 status를 'finished'로 바꿔버렸다 — 위
// 주석이 말하는 재확인 로직이 코드에 없었다. 그래서 한 명만 먼저
// 끝나도(submitBattleResult 직후 이 함수를 부름) 방 전체가 즉시
// 'finished'로 넘어가 나머지 참가자의 플레이 화면 위로 결과 오버레이가
// 덮이는 버그가 있었다. force:true(main.js의 _armGraceTimer, 탭을
// 닫아버린 참가자에 대한 최후 안전망)일 때만 이 확인을 건너뛰고
// 무조건 종료한다 — 정상 경로(force 없음)는 players 전원이
// finished===true일 때만 상태를 바꾼다.
async function finishBattleRoom(code, force = false) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const ref = doc(db, "battleRooms", code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status === 'finished') return;
    if (!force) {
      const players = data.players || {};
      const allFinished = Object.values(players).every(p => p && p.finished === true);
      if (!allFinished) return; // 아직 다른 참가자가 플레이 중 — 상태 그대로 유지
    }
    tx.update(ref, { status: 'finished' });
  });
}

// 결과 화면의 [종료하기] 확인 후 호출 — 부르는 사람이 호스트인지와
// 무관하게 방 문서를 무조건 삭제한다(leaveBattleRoom의 "본인 항목만
// 제거" 로직과 다름). 방이 삭제되면 구독 중인 모든 클라이언트가
// onSnapshot(null)을 받아 각자 메인 화면으로 돌아간다 — 기록이 남지
// 않는 일회성 배틀이라는 설계상 결과 화면을 벗어나는 유일한 경로.
async function endBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  await deleteDoc(doc(db, "battleRooms", code));
}

// onSnapshot 구독 래퍼 — unsubscribe 함수를 그대로 반환하므로 호출부가
// 저장해뒀다가 teardown 시 그냥 호출하면 된다.
function subscribeBattleRoom(code, onChange, onError) {
  if (initError) { if (onError) onError(initError); return () => {}; }
  const ref = doc(db, "battleRooms", code);
  return onSnapshot(ref, (snap) => onChange(_roomData(snap)), onError);
}

// 대기실 보조 갱신용 1회성 서버 직접 읽기(2026-10-05) — onSnapshot은
// 호스트가 코드를 공유하러 다른 앱에 다녀오면(모바일 백그라운드로
// 연결이 끊김) 재연결 backoff 동안, 또는 롱폴링으로 떨어진 네트워크에서
// 참가자 입장을 늦게 전달할 수 있다. 캐시가 아니라 항상 서버에서 읽어야
// 의미가 있으므로 getDoc이 아니라 getDocFromServer를 쓴다.
async function fetchBattleRoom(code) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const snap = await getDocFromServer(doc(db, "battleRooms", code));
  return _roomData(snap);
}

// ---- 트레이닝 로그 (2026-10-02, 2026-10-06 일별 1행으로 개편) ----
// 점수/랭킹이 아니라 "얼마나 트레이닝했는지"만 관리자(개발자)가 나중에
// Excel로 추출해 분석하기 위한 비공개 집계 — 사용자에게는 절대 보여주지
// 않는다(firestore.rules가 read 자체를 전부 막아둠). main.js의
// TrainingLog._checkpoint가 1분마다/화면이 숨겨질 때/게임 화면을 떠날 때
// "지난 저장 이후 늘어난 만큼"을 넘겨 호출한다.
//
// trainingDaily/{YYYY-MM-DD}_{employeeId} = 한 사람의 하루 = 문서 1개(엑셀
// 1행). 게임별 값은 중첩 맵이 아니라 {game}Minutes/{game}Count/
// {game}Mistakes 평평한 필드로 둔다 — CSV로 그대로 펼쳐지고, firestore.
// rules가 필드 하나하나의 타입을 검증할 수 있다. 같은 값을 total*에도
// 함께 더해 Console에서 문서만 열어도 하루 합계가 보이게 한다. 매 쓰기마다
// 4개 게임 필드를 전부 보내고(안 한 게임은 increment(0)) 모든 행이 같은
// 칸 구성을 갖게 한다 — 안 한 게임은 빈칸이 아니라 0.
//
// increment() 필드 트랜스폼 + setDoc(..., {merge:true})로 "문서가 있으면
// 더하고 없으면 0부터 만든다"를 읽기 없이 한 번의 원자적 쓰기로 처리.
//
// 날짜는 서버 시각이 아니라 트레이니 브라우저의 로컬 날짜로 끊는다 —
// 실습실 PC가 KST라고 가정하면 그게 실제 "하루"와 맞는 기준이다.
//
// 예전 형식(trainingLogs/{date}_{employeeId}_{game}, 게임마다 1행)은
// 2026-10-06부터 더 쓰지 않는다 — 단, trainingDaily 규칙이 아직 배포되기
// 전이라 permission-denied가 나면 그쪽으로 한 번 더 써서 기록을 잃지
// 않게 한다(거부된 쓰기는 아무것도 반영하지 않으므로 중복 없음).
const TRAINING_GAMES = ['blackjack', 'baccarat', 'roulette', 'poker']; // firestore.rules trainingDaily hasOnly와 일치
async function logTrainingSession({ employeeId, name, department, game, playMinutes, playCount, mistakes, sessionCount }) {
  if (initError) throw new Error('Firebase 초기화 실패: ' + initError.message);
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const perGame = {};
  for (const g of TRAINING_GAMES) {
    const mine = g === game.toLowerCase(); // 'Baccarat' -> 'baccarat'
    perGame[`${g}Minutes`]  = increment(mine ? playMinutes : 0);
    perGame[`${g}Count`]    = increment(mine ? playCount : 0);
    perGame[`${g}Mistakes`] = increment(mine ? mistakes : 0);
  }
  const daily = lastAt => setDoc(doc(db, "trainingDaily", `${date}_${employeeId}`), {
    date, employeeId, name, department, lastAt,
    totalMinutes: increment(playMinutes),
    totalCount: increment(playCount),
    totalMistakes: increment(mistakes),
    sessionCount: increment(sessionCount),
    ...perGame,
  }, { merge: true });
  try {
    // lastAt: Timestamp(Console에서 날짜로 보임) → 예전 규칙(lastAt is int)
    // 이면 숫자 ms → trainingDaily 규칙 자체가 없으면 예전 trainingLogs 순.
    try {
      await daily(serverTimestamp());
    } catch (e) {
      if (!e || e.code !== 'permission-denied') throw e;
      await daily(now.getTime());
    }
  } catch (e) {
    if (e && e.code !== 'permission-denied') throw e;
    console.warn('[TrainingLog] trainingDaily 거부됨(firestore.rules 미배포?) — 예전 trainingLogs 형식으로 기록');
    await setDoc(doc(db, "trainingLogs", `${date}_${employeeId}_${game}`), {
      date, employeeId, name, game,
      playMinutes: increment(playMinutes),
      playCount: increment(playCount),
    }, { merge: true });
  }
}

window.DealerAuth = {
  lookupEmployee, submitRouletteRankScore, getRouletteTopScores,
  createBattleRoom, joinBattleRoom, leaveBattleRoom, startBattleRoom,
  submitBattleResult, finishBattleRoom, endBattleRoom, subscribeBattleRoom,
  fetchBattleRoom,
  logTrainingSession,
};
// Always fire this, even after an init failure — main.js is waiting on it
// to stop blocking on waitForDealerAuth()'s timeout; lookupEmployee()
// above will throw the real reason on first use either way.
window.dispatchEvent(new Event("dealerauth-ready"));
