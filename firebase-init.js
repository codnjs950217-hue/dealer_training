// Firebase bootstrap for the 사번(employee ID) login gate.
// This is a native ES module (loaded via <script type="module"> in
// index.html) so it can `import` straight from the gstatic CDN with no
// build step — main.js itself stays a plain classic script and talks to
// this file only through window.DealerAuth, set at the bottom.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJjIW0ufpyKYLYpRPK7_t0xFuVnpFsoWk",
  authDomain: "casino-dealer-training.firebaseapp.com",
  projectId: "casino-dealer-training",
  storageBucket: "casino-dealer-training.firebasestorage.app",
  messagingSenderId: "159937756859",
  appId: "1:159937756859:web:ee8bcc7197fec7cc68b39e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Looks up users/{employeeId} and checks active === true.
// Resolves to { ok: true, employeeId, name } or { ok: false, reason }.
async function lookupEmployee(employeeId) {
  const ref = doc(db, "users", employeeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "not_found" };
  const data = snap.data();
  if (data.active !== true) return { ok: false, reason: "inactive" };
  return { ok: true, employeeId, name: data.name || employeeId };
}

window.DealerAuth = { lookupEmployee };
window.dispatchEvent(new Event("dealerauth-ready"));
