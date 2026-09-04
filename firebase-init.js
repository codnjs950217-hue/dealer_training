// Firebase bootstrap for the 사번(employee ID) login gate.
// This is a native ES module (loaded via <script type="module"> in
// index.html) so it can `import` straight from the gstatic CDN with no
// build step — main.js itself stays a plain classic script and talks to
// this file only through window.DealerAuth, set at the bottom.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  initializeFirestore, doc, getDoc, runTransaction,
  collection, query, orderBy, limit, getDocs,
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

window.DealerAuth = { lookupEmployee, submitRouletteRankScore, getRouletteTopScores };
// Always fire this, even after an init failure — main.js is waiting on it
// to stop blocking on waitForDealerAuth()'s timeout; lookupEmployee()
// above will throw the real reason on first use either way.
window.dispatchEvent(new Event("dealerauth-ready"));
