// Firebase bootstrap for the 사번(employee ID) login gate.
// This is a native ES module (loaded via <script type="module"> in
// index.html) so it can `import` straight from the gstatic CDN with no
// build step — main.js itself stays a plain classic script and talks to
// this file only through window.DealerAuth, set at the bottom.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { initializeFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

window.DealerAuth = { lookupEmployee };
// Always fire this, even after an init failure — main.js is waiting on it
// to stop blocking on waitForDealerAuth()'s timeout; lookupEmployee()
// above will throw the real reason on first use either way.
window.dispatchEvent(new Event("dealerauth-ready"));
