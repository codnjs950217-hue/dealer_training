/* ============================================================
   Casino Dealer Training System — Main App
   ============================================================ */

// ---- CARD ENGINE ----

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function createDeck(n = 1) {
  const d = [];
  for (let i = 0; i < n; i++)
    for (const s of SUITS)
      for (const r of RANKS)
        d.push({ suit: s, rank: r, red: s === '♥' || s === '♦' });
  return shuffle(d);
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pip layout for the numeral cards (2-10) — A/J/Q/K keep the single big
// center suit (.card-suit-center) unchanged. Each entry is [row, col]:
// row/col are just key names ('1'..'5'/'1b'/'4b', 'L'/'C'/'R') rendered as
// data-row/data-col attributes — the actual top%/left% positions for each
// key live in style.css (.card-pips .pip[data-row=...]/[data-col=...]),
// so position tuning never needs a main.js change. Rows below the midline
// ('4','4b','5') get pipRotated()'s 180deg flip, matching a real deck.
// '1b'/'4b' are the extra half-step rows the 10 needs for its top-/
// bottom-center pips so they don't sit in the same row as the column pips
// (which occupy row 2/row 4 for ranks 9-10).
const PIP_LAYOUTS = {
  '2':  [['1','C'],['5','C']],
  '3':  [['1','C'],['3','C'],['5','C']],
  '4':  [['1','L'],['1','R'],['5','L'],['5','R']],
  '5':  [['1','L'],['1','R'],['3','C'],['5','L'],['5','R']],
  '6':  [['1','L'],['1','R'],['3','L'],['3','R'],['5','L'],['5','R']],
  '7':  [['1','L'],['1','R'],['2','C'],['3','L'],['3','R'],['5','L'],['5','R']],
  '8':  [['1','L'],['1','R'],['2','C'],['3','L'],['3','R'],['4','C'],['5','L'],['5','R']],
  '9':  [['1','L'],['1','R'],['2','L'],['2','R'],['3','C'],['4','L'],['4','R'],['5','L'],['5','R']],
  '10': [['1','L'],['1','R'],['1b','C'],['2','L'],['2','R'],['4','L'],['4','R'],['4b','C'],['5','L'],['5','R']],
};
function pipRotated(row) { return row === '4' || row === '4b' || row === '5'; }
function pipsHTML(rank, suit) {
  return PIP_LAYOUTS[rank].map(([row, col]) =>
    `<span class="pip${pipRotated(row) ? ' pip-rot' : ''}" data-row="${row}" data-col="${col}">${suit}</span>`
  ).join('');
}

// J/Q/K face cards: real illustrated card art (.svg image files), not
// hand-drawn shapes. Source: the "English pattern playing cards" SVG
// set by Dmitry Fomin on Wikimedia Commons — CC0 (public domain, no
// attribution required):
// https://commons.wikimedia.org/wiki/Category:SVG_English_pattern_playing_cards
// Downloaded once into assets/cards/ (12 files, {rank}_of_{suit}.svg for
// J/Q/K × 4 suits — A/2-10 don't need art files, PIP_LAYOUTS already
// draws them).
const FACE_RANK_NAME = { J: 'jack', Q: 'queen', K: 'king' };
const SUIT_NAME = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };

function cardHTML(c, faceDown = false) {
  if (faceDown) return `<div class="card back notranslate" translate="no"><div class="card-pattern"></div></div>`;
  // J/Q/K: REVISION 8 (2026-08-24). Rev 7 kept the source art at a flat
  // 80% size and covered ITS OWN baked-in corner index with two opaque
  // white "mask" divs so it wouldn't show through inset from our real
  // corner index. Bug + explicit user rejection: giving
  // .card-illustration-wrap `position:relative` (needed so the mask divs
  // could be positioned inside it) promoted it into the CSS "positioned
  // elements" paint tier — the SAME tier .card-corner lives in — where
  // paint order follows DOM order, not who's "on top" logically. Since
  // the top .card-corner comes BEFORE .card-illustration-wrap in this
  // markup, the wrap (and its mask) ended up painting OVER the top
  // corner index instead of staying under it. Masking was also rejected
  // outright as an approach, independent of the bug: user wants the
  // corner index's full visibility structurally guaranteed (a z-index
  // rule), not incidentally true because a same-colored patch happens to
  // sit in the right place.
  // Rev 8: dropped both mask divs entirely. .card-corner.top/.bottom
  // (style.css) now carry z-index:2, so this app's own corner index
  // ALWAYS paints above .card-illustration-wrap no matter what — not
  // contingent on any geometry. Independently, .card-illustration-wrap
  // is no longer a flat 80%: it now uses the same corner-derived
  // clamp() formula the old (pre-rev-6) .card-face-art used — computed
  // from each context's real --corner-offset-x/-y and
  // --corner-rank-fs/-suit-fs, so the illustration's own box is sized to
  // actually clear the corner by construction, not by relying on the
  // z-index safety net to hide an overlap. The source image's own tiny
  // baked-in index (see assets/cards/*.svg) is small enough at this
  // reduced scale, and far enough inside the box's own margin, that it
  // no longer reads as a conflicting duplicate next to our real one.
  if (FACE_RANK_NAME[c.rank]) {
    const src = `/assets/cards/${FACE_RANK_NAME[c.rank]}_of_${SUIT_NAME[c.suit]}.svg`;
    return `
    <div class="card card-illustrated notranslate" translate="no">
      <div class="card-corner top"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>
      <div class="card-illustration-wrap">
        <img class="card-illustration" src="${src}" alt="${c.rank}${c.suit}" draggable="false">
      </div>
      <div class="card-corner bottom"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>
    </div>`;
  }
  // data-rank on the wrapper is only ever read by CSS, for rank "10" —
  // its 2-digit corner index is wider than every other numeral's single
  // digit, so style.css's .card-pips[data-rank="10"] bumps
  // --corner-digits to 2, which feeds directly into the size-driven
  // --pip-safe-left formula (see that rule's own comment) so 10's L/R
  // columns automatically sit further from the corners than every other
  // rank's. Doesn't change which cells PIP_LAYOUTS picks or how many
  // pips render.
  const center = PIP_LAYOUTS[c.rank]
    ? `<div class="card-pips" data-rank="${c.rank}">${pipsHTML(c.rank, c.suit)}</div>`
    : `<div class="card-suit-center">${c.suit}</div>`;
  return `
    <div class="card notranslate${c.red ? ' red' : ''}" translate="no">
      <div class="card-corner top"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>
      ${center}
      <div class="card-corner bottom"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>
    </div>`;
}

// ---- ROUTER ----

const App = {
  _game: null, _mode: null,
  closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('sidebar-open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  },
  toggleSidebar() {
    const open = document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active', open);
  },
  // In-app restart (↺ button): re-deal/re-init the current sim but keep its
  // accumulated Rounds/Score — only a real page load or coming back from the
  // home screen should zero those out.
  reload() { this.navigate(this._game, this._mode, true); },
  navigate(game, mode, isRestart) {
    // Leaving Blackjack's Pay Practice sim (Home, another game, or even a
    // reload/restart of the same sim) never runs any of its own teardown —
    // #app's HTML just gets replaced — so its per-seat pay-timer interval
    // and NEXT HAND auto-advance timeout would otherwise keep running in
    // the background and, on returning, immediately start writing stale
    // elapsed-time text into the freshly recreated (same-id) DOM. Stopping
    // them here, before anything else changes, guarantees a clean slate
    // regardless of where the trainee navigates to. init() also calls this
    // defensively on entry, so this isn't the only guard, just the first.
    if (this._game === 'blackjack' && typeof Sims !== 'undefined' && Sims.blackjack && Sims.blackjack.stopTimers) {
      Sims.blackjack.stopTimers();
    }
    this._game = game; this._mode = mode || null;
    this.closeSidebar();
    const titleEl = document.getElementById('top-bar-title');
    if (titleEl) titleEl.style.display = game === 'home' ? 'none' : 'flex';
    document.querySelectorAll('.sidebar-link, .sidebar-sub-link').forEach(el => {
      el.classList.toggle('active',
        el.dataset.game === game && el.dataset.mode === (mode || ''));
    });
    const el = document.getElementById('app');
    if (game === 'home')            { el.innerHTML = Views.home(); return; }
    if (!mode)                      { el.innerHTML = Views.gameLanding(game); return; }
    if (mode === 'tutorial')        { el.innerHTML = Views.tutorial(game); return; }
    if (mode === 'simulation') {
      if (game === 'blackjack') el.innerHTML = Views.blackjackSim();
      if (game === 'baccarat')  el.innerHTML = Views.baccaratSim();
      Sims[game] && Sims[game].init(isRestart);
    }
    if (mode === 'paysim' && game === 'baccarat') {
      el.innerHTML = Views.baccaratPaySim();
      Sims.baccaratPay && Sims.baccaratPay.init(isRestart);
    }
    if (mode === 'paysim' && game === 'roulette') {
      el.innerHTML = Views.roulettePaySim();
      Sims.roulettePay && Sims.roulettePay.init(isRestart);
    }
    if (game === 'poker') {
      if (mode === 'isp') { el.innerHTML = Views.ispSim(); Sims.poker.isp.init(isRestart); }
      if (mode === 'tcp') { el.innerHTML = Views.tcpSim(); Sims.poker.tcp.init(isRestart); }
      if (mode === 'thp') { el.innerHTML = Views.thpRankSim(); Sims.poker.thpRank.init(isRestart); }
    }
    window.scrollTo(0, 0);
  },
  init() { this.navigate('home'); }
};

// ---- AUTH (사번 로그인, Firestore users/{employeeId}) ----
// firebase-init.js (a separate <script type="module">, see index.html) does
// the actual Firestore call and exposes window.DealerAuth.lookupEmployee —
// module scripts always finish before DOMContentLoaded, so by the time
// Auth.init() below normally runs it's already there; the 'dealerauth-ready'
// event + waitForDealerAuth() below are only a fallback for the unusual
// case Auth.login() gets called before that (e.g. a very fast first click).
const AUTH_STORAGE_KEY = 'dealerAuthSession';

function waitForDealerAuth(timeoutMs = 8000) {
  if (window.DealerAuth) return Promise.resolve(window.DealerAuth);
  return new Promise((resolve, reject) => {
    const onReady = () => { cleanup(); resolve(window.DealerAuth); };
    // firebase-init.js's <script type="module"> has an inline onerror that
    // fires this the instant the module fails to load (bad network/CDN
    // blocked/syntax error) — much faster than waiting out the full
    // timeout below for the same eventual failure.
    const onLoadError = () => {
      cleanup();
      reject(new Error('firebase-init.js를 불러오지 못했습니다 (네트워크 또는 CDN 접근 문제로 추정)'));
    };
    const t = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    function cleanup() {
      clearTimeout(t);
      window.removeEventListener('dealerauth-ready', onReady);
      window.removeEventListener('dealerauth-load-error', onLoadError);
    }
    window.addEventListener('dealerauth-ready', onReady, { once: true });
    window.addEventListener('dealerauth-load-error', onLoadError, { once: true });
  });
}

const Auth = {
  session: null,

  init() {
    const block = document.getElementById('login-block');
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) { block.style.display = 'flex'; return; }
    try {
      this.session = JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      block.style.display = 'flex';
      return;
    }
    // Trust the saved session immediately (no login flash on reload) —
    // login state persists across reloads per spec. Still re-check active
    // status in the background once Firestore is reachable, so an employee
    // deactivated after they logged in gets signed out on their next visit
    // instead of staying logged in forever.
    this._showLoggedIn(this.session.employeeId, this.session.name);
    waitForDealerAuth().then(auth => auth.lookupEmployee(this.session.employeeId)).then(result => {
      if (!result.ok) this.logout();
    }).catch(e => {
      // Offline/unreachable — keep the existing session, but still log it
      // so a silent background failure doesn't look like nothing happened.
      console.error('[Auth] 세션 재확인 실패 (기존 로그인 유지):', e);
    });
  },

  async login(employeeId) {
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit-btn');
    errEl.style.display = 'none';
    if (!employeeId) { errEl.textContent = '사번을 입력하세요.'; errEl.style.display = 'block'; return; }

    btn.disabled = true;
    const prevLabel = btn.textContent;
    btn.textContent = '확인 중...';
    try {
      const auth = await waitForDealerAuth();
      const result = await auth.lookupEmployee(employeeId);
      if (!result.ok) {
        errEl.textContent = result.reason === 'inactive'
          ? '비활성화된 사번입니다. 관리자에게 문의하세요.'
          : '등록되지 않은 사번입니다.';
        errEl.style.display = 'block';
        return;
      }
      this.session = { employeeId: result.employeeId, name: result.name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.session));
      this._showWelcomeThenEnter(this.session.employeeId, this.session.name);
    } catch (e) {
      console.error('[Auth] 로그인 실패:', e);
      errEl.textContent = this._describeError(e);
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  },

  // Turns a raw JS/Firebase error into a specific, readable message instead
  // of a generic "서버에 연결할 수 없습니다" that hides which of Firebase
  // init / Firestore permissions / bad path / network-CORS actually failed.
  // The raw error is always console.error'd above too.
  _describeError(e) {
    const msg = (e && e.message) || String(e);
    if (msg === 'timeout') {
      return 'Firebase 연결이 8초 내에 응답하지 않았습니다. (firebase-init.js가 로드됐는지 콘솔을 확인하세요)';
    }
    const code = e && e.code;
    if (code === 'permission-denied') {
      return `Firestore 권한 오류(permission-denied): 보안 규칙이 users 읽기를 막고 있습니다.`;
    }
    if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'failed-precondition') {
      return `Firestore에 연결할 수 없습니다 (${code}). 네트워크 상태를 확인하세요.`;
    }
    if (code === 'not-found') {
      return `Firestore 조회 경로 오류(not-found): users 컬렉션/문서 경로를 확인하세요.`;
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return `네트워크/CORS 오류로 Firebase에 연결하지 못했습니다: ${msg}`;
    }
    return `오류: ${msg}${code ? ` (${code})` : ''}`;
  },

  // Logging out has to reset more than just the auth session — every game
  // module (blackjack/baccarat/roulette/poker) keeps its own in-memory
  // state and, in several cases (roulette pay's bet timer, Hold'em
  // Ranking's countdown/reveal timers), its own running setInterval —
  // and none of that goes away just from hiding the login overlay again.
  // Previously logout() only did that (toggle #login-block visibility +
  // clear localStorage), which is why re-logging in dropped the trainee
  // right back into whatever game/screen/timer was active before — the
  // underlying #app content, and every game's JS state, had never
  // actually been touched. A full reload is the only way to guarantee
  // *all* of that is gone (every game's closures/intervals/S object,
  // regardless of which one was active) without hand-auditing and
  // resetting each game module individually — after reload, App.init()
  // always starts at Home (see the bottom of App.navigate()) and
  // Auth.init() sees no saved session, so the login screen shows fresh.
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.clear();
    window.location.reload();
  },

  // Fresh (non-restored) login only: swaps the form for a "안녕하세요,
  // {name}님 👋" toast for ~1.8s, then reveals the app underneath — no
  // separate "시작하기" button, the toast itself is the transition.
  // Auth.init()'s silent session-restore path deliberately skips this and
  // goes straight to _showLoggedIn() (no flash on reload, per existing spec).
  _showWelcomeThenEnter(employeeId, name) {
    document.getElementById('login-form').style.display = 'none';
    const welcome = document.getElementById('login-welcome');
    document.getElementById('login-welcome-name').textContent = name;
    welcome.style.display = 'flex';
    setTimeout(() => {
      welcome.style.display = 'none';
      document.getElementById('login-form').style.display = '';
      this._showLoggedIn(employeeId, name);
    }, 1800);
  },

  // Top-bar badge shows "{employeeId} | {name}" — employeeId is the 사번
  // the user logged in with, name is Firestore users/{employeeId}.name.
  _showLoggedIn(employeeId, name) {
    document.getElementById('login-block').style.display = 'none';
    document.getElementById('top-bar-user-name').textContent = `${employeeId} | ${name}`;
    document.getElementById('top-bar-user').style.display = 'flex';
  }
};

// ---- GAME META ----

const GAMES = {
  baccarat:  { name: 'Baccarat',  icon: '🃏', desc: 'Master the elegant game of Baccarat. Learn dealing procedures, third-card rules, and 5% commission collection.' },
  blackjack: { name: 'Blackjack', icon: '♠',  desc: 'Learn to deal Blackjack with proper procedures, payout calculations, and complete game flow management.' },
  roulette:  { name: 'Roulette',  icon: '🎡', desc: 'Practice roulette procedures, chip handling, wheel spins, and all inside and outside bet payouts.' },
  poker:     { name: 'Poker',     icon: '🂡', desc: 'Practice three Inspire casino poker variants: ISP (5-card stud), TCP (3 cards + 2 community), and THP (Texas Hold\'em).' },
};

// ---- VIEWS ----

const Views = {
  home: () => `
    <div class="home-screen">
      <div class="home-hero">
        <div class="home-hero-cards">
          <div class="hcard-slot" style="transform:rotate(-18deg) translate(-6px,8px)">${cardHTML({ rank: 'A', suit: '♥', red: true })}</div>
          <div class="hcard-slot" style="transform:rotate(5deg) translate(6px,-10px)">${cardHTML({ rank: 'K', suit: '♠', red: false })}</div>
          <div class="hcard-slot" style="transform:rotate(22deg) translate(20px,6px)">${cardHTML({ rank: 'Q', suit: '♦', red: true })}</div>
        </div>
        <div class="home-hero-text">
          <h1 class="home-title">Casino Dealer<br><span class="gold">Training System</span></h1>
        </div>
      </div>
      <div class="home-game-cards">
        <div class="home-game-card home-game-card--baccarat">
          <div class="home-game-icon">🃏</div>
          <div class="home-game-name">Baccarat</div>
          <div class="home-game-divider"></div>
          <div class="home-game-btns">
            <button class="home-game-btn" onclick="App.navigate('baccarat','simulation')">Card Drawing</button>
            <button class="home-game-btn" onclick="App.navigate('baccarat','paysim')">Payout</button>
          </div>
        </div>
        <div class="home-game-card home-game-card--blackjack">
          <div class="home-game-icon">♠</div>
          <div class="home-game-name">Blackjack</div>
          <div class="home-game-divider"></div>
          <div class="home-game-btns">
            <button class="home-game-btn" onclick="App.navigate('blackjack','simulation')">Card Counting</button>
          </div>
        </div>
        <div class="home-game-card home-game-card--roulette">
          <div class="home-game-icon">🎡</div>
          <div class="home-game-name">Roulette</div>
          <div class="home-game-divider"></div>
          <div class="home-game-btns">
            <button class="home-game-btn" onclick="App.navigate('roulette','paysim')">Payout</button>
          </div>
        </div>
        <div class="home-game-card home-game-card--poker">
          <div class="home-game-icon">🂡</div>
          <div class="home-game-name">Poker</div>
          <div class="home-game-divider"></div>
          <div class="home-game-btns">
            <button class="home-game-btn" onclick="App.navigate('poker','thp')">Hold'em Ranking</button>
          </div>
        </div>
      </div>
    </div>`,

  gameLanding: (game) => {
    const g = GAMES[game];
    const simBtns = game === 'baccarat'
      ? `<button class="btn btn-secondary" onclick="App.navigate('baccarat','simulation')">⚡ Drawing Practice</button>
         <button class="btn btn-secondary" onclick="App.navigate('baccarat','paysim')">⚡ Payout Practice</button>`
      : game === 'poker'
      ? `<button class="btn btn-secondary" onclick="App.navigate('poker','isp')">⚡ ISP Practice</button>
         <button class="btn btn-secondary" onclick="App.navigate('poker','tcp')">⚡ TCP Practice</button>
         <button class="btn btn-secondary" onclick="App.navigate('poker','thp')">⚡ THP Practice</button>`
      : game === 'roulette'
      ? `<button class="btn btn-secondary" onclick="App.navigate('roulette','paysim')">⚡ Payout Practice</button>`
      : `<button class="btn btn-secondary" onclick="App.navigate('${game}','simulation')">⚡ Go to Simulation</button>`;
    return `
      <div class="sim-page notranslate" translate="no">
        <p style="color:var(--text-dim);margin-bottom:2rem;max-width:560px">${g.desc}</p>
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <button class="btn btn-primary"   onclick="App.navigate('${game}','tutorial')">▶ Start Tutorial</button>
          ${simBtns}
        </div>
      </div>`;
  },

  tutorial: (game) => {
    const g = GAMES[game];
    const t = TUTORIALS[game];
    const simMode = game === 'poker' ? 'isp' : 'simulation';
    return `
      <div class="tutorial-page">
        <div class="tutorial-header">
          <h1>${g.icon} ${g.name} Tutorial</h1>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('${game}','${simMode}')">Simulation →</button>
        </div>
        <div class="tutorial-layout">
          <div class="tutorial-main">
            <div class="video-section">
              <h2>Video Lessons</h2>
              <div class="video-grid">
                ${t.videos.map((v, i) => `
                  <div class="video-card" onclick="this.closest('.video-grid').querySelectorAll('.video-card').forEach(c=>c.classList.remove('active-video'));this.classList.add('active-video')">
                    <div class="video-thumb"><div class="play-btn">▶</div><span class="video-duration">${v.dur}</span></div>
                    <div class="video-info"><h4>${v.title}</h4><p>${v.desc}</p></div>
                  </div>`).join('')}
              </div>
            </div>
            <div class="guide-section">
              <h2>Dealing Procedure</h2>
              <div class="steps-list">
                ${t.steps.map((s, i) => `
                  <div class="step-item">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-content"><h4>${s.title}</h4><p>${s.desc}</p></div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
          <div class="tutorial-sidebar">
            <div class="rules-card">
              <h3>Key Rules</h3>
              <ul class="rules-list">${t.rules.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
            <div class="payouts-card">
              <h3>Payouts</h3>
              <table class="payout-table">
                ${t.payouts.map(p => `<tr><td>${p.bet}</td><td class="payout-val">${p.pays}</td></tr>`).join('')}
              </table>
            </div>
            <button class="btn btn-primary btn-full" onclick="App.navigate('${game}','${simMode}')">⚡ Practice Simulation</button>
          </div>
        </div>
      </div>`;
  },

  blackjackSim: () => `
    <div class="sim-page blackjack-sim notranslate" translate="no">
      <div class="blackjack-table">
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bj-rounds">0</strong></span>
          <span>Score: <strong id="bj-score">0</strong></span>
          <span>Mistake: <strong id="bj-mistakes">0</strong></span>
        </div>
        <div class="bj-start-bar" id="bj-mode-bar">
          <button class="bj-start-btn" id="bj-start-btn" onclick="Sims.blackjack.newGame()">Standard Mode</button>
          <button class="bj-start-btn" id="bj-speed-btn" onclick="Sims.blackjack.newGameSpeed()">Speed Mode</button>
        </div>
        <div class="bj-play-area">
          <div class="players-row">
            ${[0,1,2,3,4].map(i => `
              <div class="player-spot" id="bj-spot-${i}">
                <div class="bj-pay-timer" id="bj-pay-timer-${i}"></div>
                <div class="hand-display" id="bj-hand-${i}"><div class="hand-cards"></div></div>
                <div class="spot-status-wrap" id="bj-status-${i}"></div>
                <div class="spot-bottom-row">
                  <div class="area-label">P${i < 3 ? i+1 : i+2}</div>
                  <div class="spot-inline-act" id="bj-spot-act-${i}"></div>
                </div>
              </div>`).join('')}
          </div>
          <div class="dealer-area-bj" id="bj-dealer-wrap">
            <div class="bj-deco-shuffler" aria-hidden="true">
              <div class="bj-deco-shuffler-body"></div>
              <div class="bj-deco-shuffler-well"></div>
              <div class="bj-deco-shuffler-slot"></div>
              <div class="bj-deco-shuffler-plate"></div>
              <div class="bj-deco-shuffler-led"></div>
            </div>
            <div class="area-label" id="bj-dealer-label" style="visibility:hidden">DEALER</div>
            <div class="hand-display" id="bj-dealer-hand"></div>
            <div class="dealer-ctrl-area" id="bj-dealer-controls"></div>
          </div>
        </div>
      </div>
    </div>`,

  baccaratSim: () => `
    <div class="sim-page baccarat-sim notranslate" translate="no">
      <div class="bac-sim-body">
      <!-- No step starts active — Card Drawing now lands on the "pick a
           STEP" empty state (see Sims.baccarat's showNoStepState()/
           init()) instead of defaulting into Step 3. Each button carries
           its own always-on color identity (yellow/navy/green — see
           style.css's #bac-step-btn-1/2/3 custom properties) instead of
           a pointer arrow. -->
      <div class="bac-step-panel" id="bac-step-panel">
        <button class="bac-step-btn" id="bac-step-btn-1" onclick="Sims.baccarat.selectStep(1)">
          <span class="bac-step-num">STEP 1</span>
          <span class="bac-step-lbl">COUNTING</span>
        </button>
        <button class="bac-step-btn" id="bac-step-btn-2" onclick="Sims.baccarat.selectStep(2)">
          <span class="bac-step-num">STEP 2</span>
          <span class="bac-step-lbl">DRAWING</span>
        </button>
        <button class="bac-step-btn" id="bac-step-btn-3" onclick="Sims.baccarat.selectStep(3)">
          <span class="bac-step-num">STEP 3</span>
          <span class="bac-step-lbl">FULL<br>SIMULATION</span>
        </button>
      </div>
      <div class="baccarat-table">
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bac-rounds">0</strong></span>
          <span>Score: <strong id="bac-score">0</strong></span>
          <span>Mistake: <strong id="bac-mistakes">0</strong></span>
        </div>
        <!-- "No step selected" landing message — hidden by default
             (style.css), shown only while .baccarat-table carries
             .bac-no-step (see Sims.baccarat's showNoStepState()), which
             also turns the table itself gray and hides the Rounds/
             Score/Mistake overlay above. .bac-no-step-panel is plain
             text with no background/shape of its own, sitting directly
             on the table's gray surface. -->
        <div class="bac-no-step-msg" id="bac-no-step-msg"><div class="bac-no-step-panel">원하는 STEP을 선택하여<br>바카라 카드 드로잉을 연습하세요.</div></div>
        <!-- EXPERIMENTAL layout (real-table-felt reference), compact
             variant: PLAYER WIN and BANKER WIN each stay solo in their
             row's normal flow (so they center to exactly the same
             left/right edges as the BIG6/TIE/SMALL6 and BIG7/SUPER7/
             SMALL7 rows below, all width-locked to --bac-win-w) while
             PLAYER PAIR and BANKER PAIR are pinned via .bac-exp-attach
             to each WIN's own right edge — reading as "attached"
             without shifting WIN's centered position. NO PAIR
             (.bac-exp-nopair-mid) sits further right again, absolutely
             centered vertically between the PLAYER WIN/BANKER WIN rows
             (i.e. between P PAIR and B PAIR) so the three read as one
             connected Pair-judgment group. Same target ids as before
             (bac-b-btn-top, bac-pair-b, bac-tie-btn, bac-pair-mid,
             ...) so none of the judging/rendering logic changed —
             only which slot each button's HTML lands in. CHECK
             (bac-result) keeps its own minimal out-of-the-way corner
             spot below the grid, separate from this group. -->
        <div class="bac-exp-grid">
          <div class="bac-exp-pairwrap">
            <div class="bac-exp-row bac-exp-row-anchor">
              <div class="bac-exp-cell bac-exp-cell-win" id="bac-p-btn-top"></div>
              <div class="bac-exp-attach">
                <div class="bac-exp-cell" id="bac-pair-p"></div>
              </div>
            </div>
            <div class="bac-exp-row bac-exp-row-anchor">
              <div class="bac-exp-cell bac-exp-cell-win" id="bac-b-btn-top"></div>
              <div class="bac-exp-attach">
                <div class="bac-exp-cell" id="bac-pair-b"></div>
              </div>
            </div>
            <div class="bac-exp-cell bac-exp-nopair-mid" id="bac-pair-mid"></div>
            <!-- CONFIRM lives here — a child of .bac-exp-pairwrap (which
                 was ALREADY position:relative, pre-dating CONFIRM
                 entirely), positioned via calc() reaching down past
                 pairwrap's own two WIN rows to the BIG6/BIG7 row pair
                 below it (same left:100%-past-the-row-edge idea as
                 .bac-exp-attach for PLAYER/BANKER PAIR above, just with
                 an explicit top/height calc since the target row pair
                 isn't pairwrap's own direct content). Deliberately NOT a
                 child of a wrapper around the BIG6/BIG7 rows themselves
                 (.bac-exp-63-wrap, tried first) — that wrapper needed
                 position:relative to anchor CONFIRM, which made it the
                 accidental containing block for the WIN/TIE result
                 banner too (announceWinner() injects .bac-win-over-
                 divider into #bac-tie-btn, INSIDE that row pair) and
                 threw the banner's position off, overlapping NEXT HAND.
                 Anchoring to pairwrap instead avoids adding ANY new
                 positioned ancestor between #bac-tie-btn and
                 .baccarat-table, so the banner's own top:var(--bac-
                 banner-top) (relative to .baccarat-table, unchanged)
                 keeps working exactly as before. See
                 [[project_baccarat_result_button]] in memory. -->
            <div class="bac-exp-confirm-attach">
              <div id="bac-result"></div>
            </div>
          </div>
          <!-- STEP 1 (COUNTING) in-game explanation text was removed —
               that context now lives only in the one-time showStepIntro()
               overlay shown on STEP entry (see selectStep() in main.js).
               The pairwrap above (empty in Step 1) is this row's sibling
               anchor for style.css's .bac-exp-pairwrap + .bac-exp-row-3col
               ordering/hiding rules, now that .bac-count-prompt is gone. -->
          <div class="bac-exp-row bac-exp-row-3col">
            <div class="bac-exp-cell" id="bac-exp-big6"></div>
            <div class="bac-exp-cell" id="bac-tie-btn"></div>
            <div class="bac-exp-cell" id="bac-exp-small6"></div>
          </div>
          <!-- STEP 1 (COUNTING) only — correct-answer feedback, set/cleared
               by answerCount()/renderCountQuiz() in JS. Empty by default
               (:empty collapses it in style.css), so it takes no space
               until a correct answer briefly fills it in. -->
          <div class="bac-count-feedback" id="bac-count-feedback"></div>
          <div class="bac-exp-row bac-exp-row-3col">
            <div class="bac-exp-cell" id="bac-exp-big7"></div>
            <div class="bac-exp-cell" id="bac-exp-super7"></div>
            <div class="bac-exp-cell" id="bac-exp-small7"></div>
          </div>
        </div>
        <div class="bac-field">
          <div class="bac-shoe-col">
            <div class="shoe-visual">
              <div class="shoe-label-text">SHOE</div>
              <div class="shoe-card-slot"></div>
            </div>
          </div>
          <div class="bac-banker-zone">
            <div class="bac-zone-lbl bac-lbl-banker">BANKER</div>
            <!-- STEP 2 (DRAWING) only — BANKER WIN judgment button,
                 floated above the BANKER label the same way .bac-zone-lbl
                 itself floats above the cards (same positioned-ancestor/
                 top:calc() technique). Reuses Step 3's exact WIN button
                 classes/style (.btn-bac-banker.bac-win-oval). Injected by
                 Sims.baccarat's showDrawJudgment()/showBankerDrawJudgment();
                 hidden by default (style.css) so Step 1/3 never see it. -->
            <div class="bac-draw-win-anchor bac-draw-win-anchor-banker" id="bac-draw-banker-win"></div>
            <div class="bac-third-slot" id="bac-bh3"></div>
            <div class="bac-hand-wrap bac-bh-wrap" id="bac-bh"></div>
          </div>
          <div class="bac-field-divider"></div>
          <div class="bac-player-zone">
            <div class="bac-zone-lbl bac-lbl-player">PLAYER</div>
            <div class="bac-draw-win-anchor bac-draw-win-anchor-player" id="bac-draw-player-win"></div>
            <div class="bac-hand-wrap bac-ph-wrap" id="bac-ph"></div>
            <div class="bac-third-slot" id="bac-ph3"></div>
          </div>
        </div>
      </div>
      </div>
      <div class="bac-pay-panel" id="bac-pay-panel" style="display:none"></div>
    </div>`,

  roulettePaySim: () => `
    <div class="sim-page rpay-sim notranslate" translate="no">
      <div class="rpay-table">
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="rpay-rounds">0</strong></span>
          <span>Score: <strong id="rpay-score">0</strong></span>
          <span>Mistake: <strong id="rpay-mistakes">0</strong></span>
        </div>
        <div class="rpay-bet-side">
          <div class="rpay-diff-row">
            <button class="rpay-diff-btn rpay-diff-active" id="rpay-diff-easy"   onclick="Sims.roulettePay.setDiff('easy')">초급</button>
            <button class="rpay-diff-btn"                  id="rpay-diff-medium" onclick="Sims.roulettePay.setDiff('medium')">중급</button>
            <button class="rpay-diff-btn"                  id="rpay-diff-hard"   onclick="Sims.roulettePay.setDiff('hard')">고급</button>
          </div>
          <div class="rpay-table-wrap">
            <div class="rpay-full-table betting-table" id="rpay-full-table">${buildBettingTable()}</div>
          </div>
          <div class="bpay-start-overlay" id="rpay-start-overlay">
            <div class="rpay-wheel" id="rpay-wheel"><div class="rpay-wheel-inner" id="rpay-wheel-inner">${buildWheel()}</div><div class="rpay-wheel-center"><button class="bpay-start-btn" onclick="Sims.roulettePay.startSpin()">START</button></div></div>
          </div>
        </div>
        <div class="rpay-right-col">
          <div class="rpay-deco-wheel" aria-hidden="true"><div class="rpay-deco-wheel-inner">${buildWheel()}</div></div>
          <div class="rpay-timer-row">
            <div class="rpay-timer" id="rpay-timer">—</div>
            <div class="rpay-min-bet-lbl">MIN BET &nbsp;5,000</div>
          </div>
          <div class="rpay-undo-row">
            <button class="comm-undo-btn" id="rpay-undo-btn" onclick="Sims.roulettePay.undo()">↩ UNDO</button>
            <button class="comm-all-reset-btn" id="rpay-allreset-btn" onclick="Sims.roulettePay.resetPay()">↺ RESET</button>
          </div>
          <div class="rpay-pay-zone-wrap">
            <div class="rpay-pay-zone" id="rpay-pay-zone"></div>
            <button class="bpay-hint-btn rpay-hint-btn-float" id="rpay-hint-btn" style="display:none" onclick="Sims.roulettePay.showAnswer()" title="정답 보기" aria-label="정답 보기"><span class="bpay-hint-icon">✓</span><span class="bpay-hint-label">정답보기</span></button>
            <div id="rpay-chip-warn-banner" style="visibility:hidden" class="rpay-chip-warn rpay-chip-warn-below">⚠ 머니칩스와 함께 세팅하세요</div>
          </div>
          <div class="rpay-tray-row" id="rpay-comm-panel"></div>
        </div>
      </div>
    </div>`,

  baccaratPaySim: () => `
    <div class="sim-page baccarat-sim notranslate" translate="no">
      <div class="bpay-mode-row">
        <div class="bpay-mode-btns">
          <button id="bpay-btn-commission" class="bpay-mode-btn active" onclick="Sims.baccaratPay.setMode('commission')">💰 Commission (5%)</button>
          <button id="bpay-btn-halfpay"    class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('halfpay')">½ Half Pay</button>
          <button id="bpay-btn-side"       class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('side')">🎯 Option Bet</button>
        </div>
        <div class="bpay-hdr-stats">
          <div id="bpay-stats-comm" style="display:flex;gap:.4rem">
            <span>Rounds: <strong id="bpay-rounds">0</strong></span>
            <span>Score: <strong id="bpay-score">0</strong></span>
            <span>Mistake: <strong id="bpay-mistakes">0</strong></span>
          </div>
          <div id="bpay-stats-side" style="display:none;gap:.4rem">
            <span>Rounds: <strong id="bside-rounds">0</strong></span>
            <span>Score: <strong id="bside-score">0</strong></span>
            <span>Mistake: <strong id="bside-mistakes">0</strong></span>
          </div>
        </div>
      </div>
      <div id="bpay-content">
        <div class="baccarat-table">
          <div class="bpay-positions">
            ${[1].map(i => `
              <div class="bpay-pos" id="bpay-pos-${i}">
                <div class="bpay-oval bpay-b-oval" id="bpay-b-${i}">
                  <div class="bpay-oval-lbl">BANKER</div>
                  <div class="bpay-oval-amt" id="bpay-b-amt-${i}"></div>
                </div>
              </div>`).join('')}
          </div>
          <div class="pay-actions-row" id="bpay-actions-slot"></div>
          <div class="bpay-spread-section" id="bpay-spread-section" style="display:flex"></div>
          <div class="bpay-hint-row" id="bpay-hint-row" style="display:none">
            <button class="bpay-hint-btn" id="bpay-hint-btn" onclick="Sims.baccaratPay.showAnswer()" title="정답 보기" aria-label="정답 보기"><span class="bpay-hint-icon">✓</span><span class="bpay-hint-label">정답보기</span></button>
          </div>
          <div class="bpay-comm-panel" id="bpay-comm-panel"></div>
        </div>
      </div>
      <div id="bside-content" class="bside-sim" style="display:none">
        <div class="baccarat-table">
          <div class="bside-mid-row">
            <div class="bside-layout-pane">
              <div class="bside-zoom-stage" id="bside-zoom-stage">
                <div class="bpay-positions bside-layout">
                  ${[1].map(i => `
                    <div class="bpay-pos bside-pos-wrap" id="bside-pos-${i}">
                      <div class="bside-pos-main">
                        <div class="bside-oval-pair-row">
                          <div class="bpay-oval bpay-p-oval bside-gray-oval" id="bside-p-${i}">
                            <div class="bpay-oval-lbl">PLAYER</div>
                            <div class="bpay-oval-amt" id="bside-p-amt-${i}"></div>
                          </div>
                          <div class="bpay-pair-circ bpay-ppair" id="bside-pp-${i}">P<br>PAIR<div class="bpay-circ-bet" id="bside-pp-amt-${i}"></div></div>
                        </div>
                        <div class="bside-oval-pair-row">
                          <div class="bpay-oval bpay-b-oval bside-gray-oval" id="bside-b-${i}">
                            <div class="bpay-oval-lbl">BANKER</div>
                            <div class="bpay-oval-amt" id="bside-b-amt-${i}"></div>
                          </div>
                          <div class="bpay-pair-circ bpay-bpair" id="bside-bp-${i}">B<br>PAIR<div class="bpay-circ-bet" id="bside-bp-amt-${i}"></div></div>
                        </div>
                        <div class="bpay-circles bside-line6">
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tiger bside-oval-bet" id="bside-bt-${i}"><span class="bside-big-num">6</span>BIG<div class="bpay-circ-bet" id="bside-bt-amt-${i}"></div></div></div>
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tie bside-oval-bet" id="bside-tt-${i}"><span class="bside-big-num">TIE</span><div class="bpay-circ-bet" id="bside-tt-amt-${i}"></div></div></div>
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tiger bside-oval-bet" id="bside-st-${i}"><span class="bside-big-num">6</span>SMALL<div class="bpay-circ-bet" id="bside-st-amt-${i}"></div></div></div>
                        </div>
                        <div class="bpay-circles bside-line7">
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-bd-${i}"><span class="bside-big-num">7</span>BIG<div class="bpay-circ-bet" id="bside-bd-amt-${i}"></div></div></div>
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-s7-${i}"><span class="bside-big-num">7</span>SUPER 7<div class="bpay-circ-bet" id="bside-s7-amt-${i}"></div></div></div>
                          <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-sd-${i}"><span class="bside-big-num">7</span>SMALL<div class="bpay-circ-bet" id="bside-sd-amt-${i}"></div></div></div>
                        </div>
                      </div>
                    </div>`).join('')}
                </div>
              </div>
              <div class="bside-minimap-dock">
                <div class="bside-minimap" id="bside-minimap">
                  <div class="bside-minimap-inner" id="bside-minimap-inner"></div>
                </div>
              </div>
            </div>
            <div class="bside-chipset-pane">
              <div class="pay-actions-row" id="bside-actions-slot"></div>
              <div class="bpay-spread-section" id="bside-spread-section" style="display:none"></div>
              <div class="bpay-hint-row" id="bside-hint-row" style="display:none">
                <button class="bpay-hint-btn" id="bside-hint-btn" onclick="Sims.baccaratSide.showAnswer()" title="정답 보기" aria-label="정답 보기"><span class="bpay-hint-icon">✓</span><span class="bpay-hint-label">정답보기</span></button>
              </div>
            </div>
          </div>
          <div class="bpay-start-overlay" id="bside-start-overlay">
            <button class="bpay-start-btn" onclick="Sims.baccaratSide.deal()">START</button>
          </div>
          <div class="bpay-comm-panel" id="bside-comm-panel" style="display:none"></div>
        </div>
      </div>
    </div>`,

  baccaratSideSim: () => `
    <div class="sim-page baccarat-sim bside-sim notranslate" translate="no">
      <div class="baccarat-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bside-rounds">0</strong></span>
          <span>Score: <strong id="bside-score">0</strong></span>
          <span>Mistake: <strong id="bside-mistakes">0</strong></span>
        </div>
        <div class="bpay-positions bside-layout">
          ${[1].map(i => `
            <div class="bpay-pos bside-pos-wrap" id="bside-pos-${i}">
              <div class="bside-pos-main">
                <div class="bside-oval-pair-row">
                  <div class="bpay-oval bpay-p-oval bside-gray-oval" id="bside-p-${i}">
                    <div class="bpay-oval-lbl">PLAYER</div>
                    <div class="bpay-oval-amt" id="bside-p-amt-${i}"></div>
                  </div>
                  <div class="bpay-pair-circ bpay-ppair" id="bside-pp-${i}">P<br>PAIR<span class="bside-pair-pay">×11</span><div class="bpay-circ-bet" id="bside-pp-amt-${i}"></div></div>
                </div>
                <div class="bside-oval-pair-row">
                  <div class="bpay-oval bpay-b-oval bside-gray-oval" id="bside-b-${i}">
                    <div class="bpay-oval-lbl">BANKER</div>
                    <div class="bpay-oval-amt" id="bside-b-amt-${i}"></div>
                  </div>
                  <div class="bpay-pair-circ bpay-bpair" id="bside-bp-${i}">B<br>PAIR<span class="bside-pair-pay">×11</span><div class="bpay-circ-bet" id="bside-bp-amt-${i}"></div></div>
                </div>
                <div class="bpay-circles bside-line6">
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tiger bside-oval-bet" id="bside-bt-${i}"><span class="bside-big-num">6</span>BIG<span class="bpay-circ-pay">×50</span><div class="bpay-circ-bet" id="bside-bt-amt-${i}"></div></div></div>
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tie bside-oval-bet" id="bside-tt-${i}"><span class="bside-big-num">TIE</span><span class="bpay-circ-pay">×8</span><div class="bpay-circ-bet" id="bside-tt-amt-${i}"></div></div></div>
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-tiger bside-oval-bet" id="bside-st-${i}"><span class="bside-big-num">6</span>SMALL<span class="bpay-circ-pay">×22</span><div class="bpay-circ-bet" id="bside-st-amt-${i}"></div></div></div>
                </div>
                <div class="bpay-circles bside-line7">
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-bd-${i}"><span class="bside-big-num">7</span>BIG<span class="bpay-circ-pay">×30</span><div class="bpay-circ-bet" id="bside-bd-amt-${i}"></div></div></div>
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-s7-${i}"><span class="bside-big-num">7</span>SUPER 7<span class="bpay-circ-pay" id="bside-s7-pay-${i}">×30/40/100</span><div class="bpay-circ-bet" id="bside-s7-amt-${i}"></div></div></div>
                  <div class="bpay-circ-wrap"><div class="bpay-circ bpay-dragon bside-oval-bet" id="bside-sd-${i}"><span class="bside-big-num">7</span>SMALL<span class="bpay-circ-pay">×15</span><div class="bpay-circ-bet" id="bside-sd-amt-${i}"></div></div></div>
                </div>
              </div>
            </div>`).join('')}
        </div>
        <div class="bpay-spread-section" id="bside-spread-section" style="display:none"></div>
        <div class="bpay-start-overlay" id="bside-start-overlay">
          <button class="bpay-start-btn" onclick="Sims.baccaratSide.deal()">START</button>
        </div>
      </div>
      <div class="bpay-comm-panel" id="bside-comm-panel" style="display:none"></div>
    </div>`,

  ispSim: () => `
    <div class="sim-page poker-sim notranslate" translate="no">
      <div class="poker-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
          <span>Mistake: <strong id="pk-mistakes">0</strong></span>
        </div>
        <div class="pk-zone pk-player-zone">
          <div class="pk-zone-label pk-label-player">PLAYER</div>
          <div class="pk-hand" id="pk-player-hand"></div>
          <div class="pk-hand-rank" id="pk-player-rank"></div>
        </div>
        <div class="pk-mid-row">
          <div class="pk-quiz-wrap" id="pk-quiz"></div>
          <div class="pk-result-wrap" id="pk-result"></div>
        </div>
        <div class="pk-zone pk-dealer-zone">
          <div class="pk-hand-rank" id="pk-dealer-rank"></div>
          <div class="pk-hand" id="pk-dealer-hand"></div>
          <div class="pk-zone-label pk-label-dealer">DEALER</div>
        </div>
        <div class="pk-start-bar">
          <button id="pk-start-btn" class="pk-start-btn" onclick="Sims.poker.isp.deal()">DEAL</button>
        </div>
      </div>
    </div>`,

  tcpSim: () => `
    <div class="sim-page poker-sim notranslate" translate="no">
      <div class="poker-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
          <span>Mistake: <strong id="pk-mistakes">0</strong></span>
        </div>
        <div class="pk-zone pk-player-zone">
          <div class="pk-zone-label pk-label-player">PLAYER</div>
          <div class="pk-hand" id="pk-player-hand"></div>
          <div class="pk-hand-rank" id="pk-player-rank"></div>
        </div>
        <div class="pk-community-row">
          <div class="pk-comm-label">COMMUNITY</div>
          <div class="pk-hand pk-comm-hand" id="pk-comm-hand"></div>
        </div>
        <div class="pk-mid-row">
          <div class="pk-quiz-wrap" id="pk-quiz"></div>
          <div class="pk-result-wrap" id="pk-result"></div>
        </div>
        <div class="pk-zone pk-dealer-zone">
          <div class="pk-hand-rank" id="pk-dealer-rank"></div>
          <div class="pk-hand" id="pk-dealer-hand"></div>
          <div class="pk-zone-label pk-label-dealer">DEALER</div>
        </div>
        <div class="pk-start-bar">
          <button id="pk-start-btn" class="pk-start-btn" onclick="Sims.poker.tcp.deal()">DEAL</button>
        </div>
      </div>
    </div>`,

  thpRankSim: () => `
    <div class="sim-page thp-rank-sim notranslate" translate="no">
      <div class="thpr-page-header">
        <div class="thpr-stats-panel">
          <span>Rounds: <strong id="thpr-rounds">0</strong></span>
          <span>Score: <strong id="thpr-score">0</strong></span>
          <span>Mistake: <strong id="thpr-mistakes">0</strong></span>
        </div>
      </div>

      <div class="thpr-table">
        <button class="thpr-help-btn" onclick="Sims.poker.thpRank.showRankHelp()" title="Hand Ranking Guide">?</button>

        <div class="thpr-players-row">
          ${[1,2,3,4,5].map(i => `
            <div class="thpr-player-spot" id="thpr-spot-${i}">
              <div class="thpr-spot-label">Player ${THPR_SEAT_NUM[i - 1]}</div>
              <div class="thpr-hole-wrap">
                <div class="thpr-hole-cards">
                  ${cardHTML(null, true)}${cardHTML(null, true)}
                </div>
              </div>
              <div class="thpr-spot-btns" id="thpr-spot-btns-${i}"></div>
              <div class="thpr-spot-result" id="thpr-spot-result-${i}"></div>
            </div>`).join('')}
        </div>

        <div class="thpr-community-area">
          <div class="thpr-community-main">
            <div class="thpr-community-row">
              <div class="thpr-comm-group" id="thpr-flop">
                <div class="thpr-group-cards">
                  ${cardHTML(null, true)}${cardHTML(null, true)}${cardHTML(null, true)}
                </div>
                <div class="thpr-group-label">FLOP</div>
              </div>
              <div class="thpr-comm-group" id="thpr-turn">
                <div class="thpr-group-cards">${cardHTML(null, true)}</div>
                <div class="thpr-group-label">TURN</div>
              </div>
              <div class="thpr-comm-group" id="thpr-river">
                <div class="thpr-group-cards">${cardHTML(null, true)}</div>
                <div class="thpr-group-label">RIVER</div>
              </div>
            </div>
            <div class="thpr-action-row" id="thpr-action-row">
              <button class="thpr-start-btn" id="thpr-start-btn" onclick="Sims.poker.thpRank.deal()">START</button>
            </div>
          </div>
          <div class="thpr-countdown" id="thpr-countdown"></div>
        </div>

        <div class="thpr-dealer-area">
          <div class="thpr-deco-shuffler" aria-hidden="true">
            <div class="thpr-deco-shuffler-body"></div>
            <div class="thpr-deco-shuffler-well"></div>
            <div class="thpr-deco-shuffler-slot"></div>
            <div class="thpr-deco-shuffler-plate"></div>
            <div class="thpr-deco-shuffler-led"></div>
          </div>
          <div class="thpr-dealer-main">
            <div class="thpr-controls">
              <div class="thpr-feedback" id="thpr-feedback"></div>
            </div>
            <div class="thpr-dealer-group">
              <div class="thpr-dealer-cards" id="thpr-dealer-cards">
                ${cardHTML(null, true)}${cardHTML(null, true)}
              </div>
              <div class="thpr-area-label">DEALER</div>
            </div>
          </div>
        </div>

        <div class="thpr-wrong-overlay" id="thpr-wrong-overlay" style="display:none;"></div>
      </div>

      <div class="thpr-rank-modal-backdrop" id="thpr-rank-modal" style="display:none;" onclick="Sims.poker.thpRank.hideRankHelp(event)">
        <div class="thpr-rank-modal-box" onclick="event.stopPropagation()">
          <button class="thpr-rank-modal-close" onclick="Sims.poker.thpRank.hideRankHelp()">✕</button>
          <div class="thpr-rank-modal-title">Poker Hand Rankings</div>
          <ol class="thpr-rank-list">
            ${THPR_RANK_GUIDE.map((h, i) => `
              <li class="thpr-rank-item">
                <span class="thpr-rank-num">${i + 1}</span>
                <span class="thpr-rank-name">${h.name}</span>
                <span class="thpr-rank-desc">${h.desc}</span>
              </li>`).join('')}
          </ol>
        </div>
      </div>

      <div class="thpr-rank-modal-backdrop" id="thpr-hand-modal" style="display:none;" onclick="Sims.poker.thpRank.hideHandExplain(event)">
        <div class="thpr-rank-modal-box" onclick="event.stopPropagation()">
          <button class="thpr-rank-modal-close" onclick="Sims.poker.thpRank.hideHandExplain()">✕</button>
          <div class="thpr-rank-modal-title" id="thpr-hand-modal-title"></div>
          <div id="thpr-hand-modal-content"></div>
        </div>
      </div>
    </div>`,

};

// ---- TUTORIAL DATA ----

const TUTORIALS = {
  blackjack: {
    videos: [
      { title: 'Introduction to Blackjack Dealing', dur: '8:24', desc: 'Basic card handling and table setup' },
      { title: 'Card Values & Hand Calculation',    dur: '6:10', desc: 'How to calculate hand values including soft hands' },
      { title: 'Dealing Procedure Step-by-Step',   dur: '12:35', desc: 'Complete sequence from shuffle to payout' },
      { title: 'Payout Calculations',              dur: '9:47', desc: '3:2 blackjack, insurance, and split payouts' },
      { title: 'Managing Player Decisions',        dur: '7:20', desc: 'Hit, stand, double down, split procedures' },
      { title: 'Common Mistakes & Corrections',    dur: '11:05', desc: 'How to handle errors and misdeal procedures' },
    ],
    steps: [
      { title: 'Shuffle the Deck',    desc: 'Riffle shuffle 3-5 times, strip shuffle, box. Offer the cut card to a player.' },
      { title: 'Place the Cut Card',  desc: 'Insert yellow cut card ~1 deck from the bottom to limit deck penetration.' },
      { title: 'Burn a Card',         desc: 'Deal one card face-up, announce its value, place in the discard tray.' },
      { title: 'Deal Initial Cards',  desc: 'Deal clockwise from first base — two cards each. Dealer\'s second card is face down (hole card).' },
      { title: 'Check for Natural',   desc: 'If dealer shows Ace or 10-value, peek for a natural. Settle all bets if confirmed.' },
      { title: 'Manage Player Actions', desc: 'Proceed around the table: Hit, Stand, Double Down (one card face down), or Split.' },
      { title: 'Reveal Hole Card',    desc: 'After all players act, turn the hole card. Dealer must hit on ≤16, stand on 17+.' },
      { title: 'Settle Bets',         desc: 'Pay winners 1:1, collect losers. Pay blackjack 3:2. Return bet on a push.' },
    ],
    rules: [
      'Dealer hits on hard/soft 16 or below',
      'Dealer stands on all 17s (hard and soft)',
      'Blackjack pays 3:2',
      'Insurance pays 2:1',
      'Dealer peeks for blackjack on Ace or 10-value',
      'Split Aces receive only one additional card each',
      'Double down allowed on any two-card hand',
    ],
    payouts: [
      { bet: 'Blackjack',    pays: '3:2' },
      { bet: 'Regular Win',  pays: '1:1' },
      { bet: 'Insurance',    pays: '2:1' },
      { bet: 'Push',         pays: 'Even' },
      { bet: 'Double Down',  pays: '1:1' },
    ],
  },

  baccarat: {
    videos: [
      { title: 'Table Setup & Equipment',          dur: '7:15',  desc: 'Shoe, layout, commission box, and chip colors' },
      { title: 'Card Point Values',                dur: '4:30',  desc: '2-9 face value, 10/J/Q/K = 0, Ace = 1' },
      { title: 'Dealing Sequence',                 dur: '10:22', desc: 'Correct order: P1 → B1 → P2 → B2' },
      { title: 'Third Card Rules — Player',        dur: '8:45',  desc: 'Player draws on 0-5, stands on 6-7' },
      { title: 'Third Card Rules — Banker',        dur: '12:10', desc: 'Complex Banker rules based on Player\'s third card' },
      { title: 'Commission Collection',            dur: '5:55',  desc: 'Taking 5% commission on Banker wins' },
    ],
    steps: [
      { title: 'Load the Shoe',           desc: 'Shuffle 8 decks. Burn first card face-up; burn additional cards face-down equal to its value.' },
      { title: 'Deal Initial Cards',      desc: 'Deal in order: Player 1, Banker 1, Player 2, Banker 2. Cards remain face down initially.' },
      { title: 'Announce Points',         desc: 'Reveal both hands. Announce totals — only the units digit counts (e.g. 9+7=16, counts as 6).' },
      { title: 'Check for Natural',       desc: 'If either hand totals 8 or 9, call "Natural [8/9]". No more cards are drawn.' },
      { title: 'Player Third Card Rule',  desc: 'Player total 0-5: draw. Player total 6-7: stand. Announce action clearly.' },
      { title: 'Banker Third Card Rule',  desc: 'Apply the Banker drawing table based on Banker total AND Player\'s third card value.' },
      { title: 'Announce Winner',         desc: 'Compare final totals. Announce "Player wins", "Banker wins", or "Tie". Show totals.' },
      { title: 'Settle Bets',             desc: 'Pay Player 1:1. Pay Banker 1:1 less 5% commission. Pay Tie 8:1. Record commission.' },
    ],
    rules: [
      'Only units digit of total counts',
      'Natural 8 or 9 = no more cards',
      'Player draws on 0-5, stands on 6-7',
      'Banker rules depend on Player\'s third card',
      '5% commission on all Banker wins',
      'Tie bet does not affect Player/Banker bets',
    ],
    payouts: [
      { bet: 'Player',      pays: '1:1' },
      { bet: 'Banker',      pays: '1:1 (−5%)' },
      { bet: 'Tie',         pays: '8:1' },
    ],
  },

  roulette: {
    videos: [
      { title: 'Equipment & Setup',          dur: '6:40',  desc: 'Wheel, ball, layout, chip colors and floats' },
      { title: 'Accepting Bets & Colour Up', dur: '9:15',  desc: 'Coloured chips and buy-in procedures' },
      { title: 'Spinning the Wheel',         dur: '5:20',  desc: 'Proper spin technique and no-more-bets call' },
      { title: 'Announcing the Result',      dur: '4:10',  desc: 'Placing the dolly, calling number/colour/section' },
      { title: 'Inside Bet Payouts',         dur: '11:30', desc: 'Straight up, split, street, corner, line' },
      { title: 'Outside Bet Payouts',        dur: '8:55',  desc: 'Red/black, odd/even, dozens, columns, high/low' },
    ],
    steps: [
      { title: 'Open the Table',     desc: 'Place the float. Check wheel balance and ball track. Announce table minimum and maximum.' },
      { title: 'Colour Up Players',  desc: 'Exchange cash or chips for coloured roulette chips. Each player gets a unique colour at their chosen unit value.' },
      { title: 'Accept Bets',        desc: 'Players place bets on the layout. You may assist with late or complex bet placements.' },
      { title: 'Spin the Wheel',     desc: 'Spin the wheel one direction, launch the ball in the opposite direction with consistent speed and force.' },
      { title: 'Call No More Bets',  desc: 'When the ball begins to drop, wave hand over the layout and call "No more bets." Reject any late chips.' },
      { title: 'Announce Result',    desc: 'When ball settles, announce: number, colour, odd/even, high/low. e.g. "17, Red, Odd, Low."' },
      { title: 'Place the Dolly',    desc: 'Place the win marker (dolly) on the winning number. Do not clear any bets until all payouts are complete.' },
      { title: 'Clear & Pay',        desc: 'Remove all losing bets first. Calculate and pay all winners — inside bets before outside bets.' },
    ],
    rules: [
      'Ball must complete at least 3 full revolutions',
      'Call "No more bets" before the ball descends',
      'Dolly must be placed before clearing any chips',
      'Pay inside bets before outside bets',
      'Coloured chips have no value off the roulette table',
      '0 is green — neither red nor black',
    ],
    payouts: [
      { bet: 'Straight Up (1 no.)',   pays: '35:1' },
      { bet: 'Split (2 nos.)',         pays: '17:1' },
      { bet: 'Street (3 nos.)',        pays: '11:1' },
      { bet: 'Corner (4 nos.)',        pays: '8:1'  },
      { bet: 'Line (6 nos.)',          pays: '5:1'  },
      { bet: 'Dozen / Column',         pays: '2:1'  },
      { bet: 'Red/Black, Odd/Even',    pays: '1:1'  },
      { bet: 'High (19-36)/Low (1-18)',pays: '1:1'  },
    ],
  },

  poker: {
    videos: [
      { title: 'Poker Hand Rankings',         dur: '8:00',  desc: 'Royal Flush through High Card — all 9 hand rankings explained' },
      { title: 'ISP — Inspire Stud Poker',    dur: '10:30', desc: '5-card stud dealing procedure and hand comparison method' },
      { title: 'TCP — Three Card Poker',       dur: '9:15',  desc: '3 hole cards + 2 community cards: dealing and evaluation' },
      { title: 'THP — Texas Hold\'em Poker',   dur: '14:20', desc: 'Flop, Turn, River procedure and best-hand determination' },
      { title: 'Comparing Hands Quickly',     dur: '7:45',  desc: 'Speed techniques for comparing dealer and player hands' },
      { title: 'Payout Procedures',           dur: '6:30',  desc: 'Collecting losing bets and paying winning hands correctly' },
    ],
    steps: [
      { title: 'Shuffle & Cut',         desc: 'Riffle shuffle 3–5 times. Present cut card to a player. Insert ~1 deck from the bottom.' },
      { title: 'Burn a Card',           desc: 'Deal one card face-up to the discard tray before beginning the hand.' },
      { title: 'Deal Hole Cards',       desc: 'Deal clockwise: ISP — 5 cards each. TCP — 3 cards each. THP — 2 cards each.' },
      { title: 'Reveal Community Cards', desc: 'TCP: place 2 community cards face-up in the center. THP: deal Flop (3), Turn (1), River (1).' },
      { title: 'Evaluate Hands',        desc: 'Compare hands by rank. Equal rank: compare kickers from highest to lowest until a winner is found.' },
      { title: 'Announce Winner',       desc: 'Clearly announce "Dealer wins", "Player wins", or "Tie". Flip both hands face-up to show.' },
      { title: 'Settle Bets',           desc: 'Collect losing bets. Pay winners per the payout schedule. Settle any bonus bets separately.' },
      { title: 'Prepare Next Hand',     desc: 'Clear all cards to the discard tray. Confirm all bets are settled before the next deal.' },
    ],
    rules: [
      'Standard 52-card deck, no jokers',
      'Hand ranks (high→low): Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card',
      'ISP: best hand from 5 hole cards',
      'TCP: best 5-card hand using 3 hole cards + 2 community cards',
      'THP: best 5-card hand from 2 hole cards + 5 community cards (board)',
      'Equal rank: compare kickers from highest to lowest — if all equal, it is a Tie',
    ],
    payouts: [
      { bet: 'Player Win',      pays: '1:1' },
      { bet: 'Pair or Better',  pays: 'Bonus' },
      { bet: 'Straight',        pays: '4:1' },
      { bet: 'Three of a Kind', pays: '30:1' },
      { bet: 'Straight Flush',  pays: '40:1' },
      { bet: 'Royal Flush',     pays: '100:1' },
    ],
  },
};

// ============================================================
//  POKER HAND EVALUATORS
// ============================================================

function pkRankVal(r) {
  return r==='A'?14 : r==='K'?13 : r==='Q'?12 : r==='J'?11 : +r;
}

function evalPokerHand(hand) {
  const vals = hand.map(c => pkRankVal(c.rank)).sort((a, b) => b - a);
  const isFlush = hand.every(c => c.suit === hand[0].suit);
  let isStraight = vals[0] - vals[4] === 4 && new Set(vals).size === 5;
  let sHigh = vals[0];
  if (!isStraight && vals[0] === 14 && vals[1] === 5 && vals[4] === 2) { isStraight = true; sHigh = 5; }
  const freq = {};
  vals.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const grp = Object.entries(freq).map(([v, c]) => [+v, c]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const cnt = grp.map(g => g[1]), gv = grp.map(g => g[0]);
  if (isFlush && isStraight) return sHigh === 14 ? {r:9, l:'Royal Flush',    tb:[14]} : {r:8, l:'Straight Flush',  tb:[sHigh]};
  if (cnt[0] === 4)                               return {r:7, l:'Four of a Kind',  tb:gv};
  if (cnt[0] === 3 && cnt[1] === 2)               return {r:6, l:'Full House',       tb:gv};
  if (isFlush)                                    return {r:5, l:'Flush',            tb:vals};
  if (isStraight)                                 return {r:4, l:'Straight',         tb:[sHigh]};
  if (cnt[0] === 3)                               return {r:3, l:'Three of a Kind',  tb:gv};
  if (cnt[0] === 2 && cnt[1] === 2)               return {r:2, l:'Two Pair',         tb:gv};
  if (cnt[0] === 2)                               return {r:1, l:'Pair',             tb:gv};
  return                                                 {r:0, l:'High Card',        tb:vals};
}

function cmpPokerHands(a, b) {
  if (a.r !== b.r) return a.r > b.r ? 1 : -1;
  for (let i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
    if ((a.tb[i]||0) !== (b.tb[i]||0)) return (a.tb[i]||0) > (b.tb[i]||0) ? 1 : -1;
  }
  return 0;
}

function bestPokerHand(cards) {
  if (cards.length === 5) return evalPokerHand(cards);
  let best = null;
  function pick(i, acc) {
    if (acc.length === 5) { const ev = evalPokerHand(acc); if (!best || cmpPokerHands(ev, best) > 0) best = ev; return; }
    for (let j = i; j < cards.length; j++) pick(j + 1, [...acc, cards[j]]);
  }
  pick(0, []);
  return best;
}

function bestPokerHandCards(cards) {
  let bestEv = null, bestCards = null;
  function pick(i, acc) {
    if (acc.length === 5) {
      const ev = evalPokerHand(acc);
      if (!bestEv || cmpPokerHands(ev, bestEv) > 0) { bestEv = ev; bestCards = [...acc]; }
      return;
    }
    for (let j = i; j < cards.length; j++) pick(j + 1, [...acc, cards[j]]);
  }
  pick(0, []);
  return { ev: bestEv, bestCards };
}

// ============================================================
//  THP EVALUATOR API
// ============================================================

const HAND_NAMES = [
  'High Card', 'One Pair', 'Two Pair', 'Three of a Kind',
  'Straight', 'Flush', 'Full House', 'Four of a Kind',
  'Straight Flush', 'Royal Straight Flush'
];

// Highest to lowest, for the hand-ranking help modal
const THPR_RANK_GUIDE = [
  { name: 'Royal Straight Flush', desc: 'A, K, Q, J, 10 of the same suit.' },
  { name: 'Straight Flush',       desc: 'Five sequential cards, all the same suit.' },
  { name: 'Four of a Kind',       desc: 'Four cards of the same rank.' },
  { name: 'Full House',           desc: 'Three of a kind plus a pair.' },
  { name: 'Flush',                desc: 'Five cards of the same suit, not in sequence.' },
  { name: 'Straight',             desc: 'Five sequential cards, mixed suits.' },
  { name: 'Three of a Kind',      desc: 'Three cards of the same rank.' },
  { name: 'Two Pair',             desc: 'Two separate pairs.' },
  { name: 'One Pair',             desc: 'Two cards of the same rank.' },
  { name: 'High Card',            desc: 'No matching combination — highest card plays.' },
];

// Real casino tables skip seat #4 — internal player index (1-5, left to
// right, unchanged) maps to displayed seat number 1/2/3/5/6.
const THPR_SEAT_NUM = [1, 2, 3, 5, 6];

function valToRank(v) {
  return v === 14 ? 'A' : v === 13 ? 'K' : v === 12 ? 'Q' : v === 11 ? 'J' : String(v);
}

// Spelled-out singular rank word (10 and up), digits below that — matches
// the round-end display convention: "Ace High", "Tens", but "8s" not
// "Eights". Plural is always this + 's' (every case here pluralizes
// regularly, including the digit forms).
function _thpRankWord(v) {
  return v === 14 ? 'Ace' : v === 13 ? 'King' : v === 12 ? 'Queen' : v === 11 ? 'Jack' : v === 10 ? 'Ten' : String(v);
}

// Builds the "(...)" qualifier shown after a hand-rank name at round end
// — e.g. "One Pair (8s)", "Two Pair (Aces & Tens)", "High Card (Ace
// High)" — using the tiebreak array evalPokerHand() already computed
// (no re-evaluation, purely a display string built from existing data).
// Returns '' for hand ranks where the name alone is unambiguous (Royal
// Flush is always the same five ranks).
function _thpRankDetail(handInfo) {
  var r = handInfo.rank, tb = handInfo.tiebreak;
  var w = _thpRankWord;
  var plural = function(v) { return w(v) + 's'; };
  switch (r) {
    case 0: return w(tb[0]) + ' High';                     // High Card
    case 1: return plural(tb[0]);                           // One Pair
    case 2: return plural(tb[0]) + ' & ' + plural(tb[1]);   // Two Pair
    case 3: return plural(tb[0]);                           // Three of a Kind
    case 4: return w(tb[0]) + ' High';                      // Straight
    case 5: return w(tb[0]) + ' High';                      // Flush
    case 6: return plural(tb[0]) + ' over ' + plural(tb[1]); // Full House
    case 7: return plural(tb[0]);                           // Four of a Kind
    case 8: return w(tb[0]) + ' High';                      // Straight Flush
    default: return '';                                      // Royal Flush
  }
}

// Returns { rank, rankName, tiebreak, bestFive, ev } for 5–7 cards
function evaluateBestHand(cards) {
  const { ev, bestCards } = bestPokerHandCards(cards);
  return { rank: ev.r, rankName: HAND_NAMES[ev.r], tiebreak: ev.tb, bestFive: bestCards, ev };
}

// Returns { cmp, dealer, player } — cmp >0 dealer wins, <0 player wins, 0 tie
function compareHands(dealerCards, playerCards) {
  const d = evaluateBestHand(dealerCards);
  const p = evaluateBestHand(playerCards);
  return { cmp: cmpPokerHands(d.ev, p.ev), dealer: d, player: p };
}

function _thpExplain(winner, d, p) {
  if (winner === 'TIE') return 'Both have ' + p.rankName;
  const wEv = winner === 'PAY' ? p : d;
  const lEv = winner === 'PAY' ? d : p;
  const who = winner === 'PAY' ? 'Player' : 'Dealer';
  if (wEv.rank !== lEv.rank) return who + ': ' + wEv.rankName + ' > ' + lEv.rankName;
  const wt = wEv.tiebreak, lt = lEv.tiebreak;
  for (let i = 0; i < Math.max(wt.length, lt.length); i++) {
    const wv = wt[i] || 0, lv = lt[i] || 0;
    if (wv !== lv) {
      return i === 0
        ? who + ': higher ' + wEv.rankName
        : who + ': kicker ' + valToRank(wv) + ' > ' + valToRank(lv);
    }
  }
  return who + ' wins';
}

function _thpVerboseExplain(winner, d, p) {
  if (winner === 'TIE') return 'It is a push — both have ' + p.rankName + '.';
  const wEv = winner === 'PAY' ? p : d;
  const lEv = winner === 'PAY' ? d : p;
  const who = winner === 'PAY' ? 'Player' : 'Dealer';
  if (wEv.rank !== lEv.rank) {
    return who + ' wins because ' + wEv.rankName + ' is higher than ' + lEv.rankName + '.';
  }
  const wt = wEv.tiebreak, lt = lEv.tiebreak;
  for (let i = 0; i < Math.max(wt.length, lt.length); i++) {
    const wv = wt[i] || 0, lv = lt[i] || 0;
    if (wv !== lv) {
      return i === 0
        ? who + ' wins with a higher ' + wEv.rankName.toLowerCase() + '.'
        : who + ' wins with a better kicker (' + valToRank(wv) + ' > ' + valToRank(lv) + ').';
    }
  }
  return who + ' wins.';
}

// Main API — returns winner + full detail object
function getResult(dealerCards, playerCards) {
  const { cmp, dealer, player } = compareHands(dealerCards, playerCards);
  const winner = cmp > 0 ? 'TAKE' : cmp < 0 ? 'PAY' : 'TIE';
  return {
    winner,
    dealerRankName: dealer.rankName,
    playerRankName: player.rankName,
    dealerRankDetail: _thpRankDetail(dealer),
    playerRankDetail: _thpRankDetail(player),
    dealerBestFiveCards: dealer.bestFive,
    playerBestFiveCards: player.bestFive,
    shortExplanation: _thpExplain(winner, dealer, player),
    verboseExplanation: _thpVerboseExplain(winner, dealer, player)
  };
}

// ---- TEST RUNNER (call runThpTests() in browser console) ----
function runThpTests() {
  const c = mkCard;
  const tests = [
    {
      name: '1. Player pair vs dealer high card',
      dHole: [c('A','♠'), c('K','♥')],
      pHole: [c('2','♣'), c('2','♥')],
      comm:  [c('3','♣'), c('7','♦'), c('J','♠'), c('Q','♣'), c('5','♥')],
      expect: 'PAY'
    },
    {
      name: '2. Dealer higher pair (K vs Q)',
      dHole: [c('K','♥'), c('K','♠')],
      pHole: [c('Q','♦'), c('Q','♣')],
      comm:  [c('2','♣'), c('3','♦'), c('7','♠'), c('9','♣'), c('J','♥')],
      expect: 'TAKE'
    },
    {
      name: '3. Same pair (8s), kicker decides — dealer A > player K',
      dHole: [c('A','♣'), c('3','♥')],
      pHole: [c('K','♦'), c('4','♣')],
      comm:  [c('8','♠'), c('8','♥'), c('2','♣'), c('5','♦'), c('7','♠')],
      expect: 'TAKE'
    },
    {
      name: '4. Ace-low straight (wheel A-2-3-4-5)',
      dHole: [c('K','♥'), c('Q','♦')],
      pHole: [c('5','♣'), c('8','♥')],
      comm:  [c('A','♠'), c('2','♣'), c('3','♦'), c('4','♠'), c('9','♥')],
      expect: 'PAY'
    },
    {
      name: '5. Ace-high straight (10-J-Q-K-A)',
      dHole: [c('9','♥'), c('8','♠')],
      pHole: [c('A','♦'), c('5','♣')],
      comm:  [c('10','♠'), c('J','♣'), c('Q','♦'), c('K','♥'), c('2','♣')],
      expect: 'PAY'
    },
    {
      name: '6. Flush — player K-flush beats dealer J-flush',
      dHole: [c('J','♠'), c('10','♦')],
      pHole: [c('K','♠'), c('Q','♦')],
      comm:  [c('A','♠'), c('8','♠'), c('5','♠'), c('3','♠'), c('2','♦')],
      expect: 'PAY'
    },
    {
      name: '7. Full house — dealer K-full beats player Q-full',
      dHole: [c('K','♠'), c('K','♣')],
      pHole: [c('Q','♠'), c('J','♣')],
      comm:  [c('Q','♥'), c('Q','♦'), c('K','♦'), c('3','♥'), c('3','♣')],
      expect: 'TAKE'
    },
    {
      name: '8. Board plays — both use A-K-Q-J-10 straight — TIE',
      dHole: [c('2','♠'), c('3','♥')],
      pHole: [c('4','♦'), c('5','♣')],
      comm:  [c('A','♠'), c('K','♣'), c('Q','♥'), c('J','♦'), c('10','♣')],
      expect: 'TIE'
    },
    {
      name: '9. Same hand different suits — TIE',
      dHole: [c('8','♠'), c('2','♦')],
      pHole: [c('8','♥'), c('2','♣')],
      comm:  [c('K','♠'), c('K','♥'), c('A','♦'), c('Q','♣'), c('J','♠')],
      expect: 'TIE'
    },
    {
      name: '10a. Royal Straight Flush vs High Card',
      dHole: [c('9','♠'), c('8','♠')],
      pHole: [c('10','♥'), c('5','♣')],
      comm:  [c('A','♥'), c('K','♥'), c('Q','♥'), c('J','♥'), c('2','♣')],
      expect: 'PAY'
    },
    {
      name: '10b. Straight Flush vs Full House',
      dHole: [c('K','♠'), c('K','♦')],
      pHole: [c('J','♣'), c('10','♣')],
      comm:  [c('9','♣'), c('8','♣'), c('7','♣'), c('2','♦'), c('A','♠')],
      expect: 'PAY'
    }
  ];
  let passed = 0, failed = 0;
  const results = tests.map(function(t) {
    const r = getResult([...t.dHole, ...t.comm], [...t.pHole, ...t.comm]);
    const ok = r.winner === t.expect;
    if (ok) passed++; else failed++;
    return { test: t.name, expect: t.expect, got: r.winner, ok: ok, dealer: r.dealerRankName, player: r.playerRankName, why: r.shortExplanation };
  });
  console.table(results);
  console.log('Tests: ' + passed + '/' + (passed + failed) + ' passed');
  return { passed, failed, results };
}

function mkCard(rank, suit) {
  return { rank, suit, red: suit === '♥' || suit === '♦' };
}

const THP_CURATED = [
  {
    title: '키커 결정전',
    difficulty: 'medium',
    desc: '셋 다 킹 원페어 — 키커로 승자를 가려보세요',
    community: [mkCard('K','♠'), mkCard('7','♦'), mkCard('2','♣'), mkCard('9','♥'), mkCard('3','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('K','♥'), mkCard('A','♦')] },
      { name: '플레이어 2', cards: [mkCard('K','♦'), mkCard('Q','♠')] },
      { name: '플레이어 3', cards: [mkCard('5','♣'), mkCard('6','♥')] },
      { name: '딜러',      cards: [mkCard('K','♣'), mkCard('J','♠')] },
    ]
  },
  {
    title: '보드 스트레이트 스플릿',
    difficulty: 'hard',
    desc: '커뮤니티 카드만으로 최강 스트레이트 완성 — 모두 스플릿일까요?',
    community: [mkCard('A','♠'), mkCard('K','♦'), mkCard('Q','♣'), mkCard('J','♥'), mkCard('10','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('2','♥'), mkCard('3','♦')] },
      { name: '플레이어 2', cards: [mkCard('5','♣'), mkCard('6','♠')] },
      { name: '플레이어 3', cards: [mkCard('4','♥'), mkCard('7','♣')] },
      { name: '딜러',      cards: [mkCard('8','♦'), mkCard('9','♠')] },
    ]
  },
  {
    title: '플러시 키커 비교',
    difficulty: 'medium',
    desc: '세 명이 플러시 — 두 번째 카드로 순위를 가려보세요',
    community: [mkCard('A','♥'), mkCard('J','♥'), mkCard('7','♥'), mkCard('3','♥'), mkCard('2','♣')],
    players: [
      { name: '플레이어 1', cards: [mkCard('K','♥'), mkCard('5','♦')] },
      { name: '플레이어 2', cards: [mkCard('Q','♥'), mkCard('6','♠')] },
      { name: '플레이어 3', cards: [mkCard('4','♦'), mkCard('8','♦')] },
      { name: '딜러',      cards: [mkCard('10','♥'), mkCard('4','♠')] },
    ]
  },
  {
    title: '풀하우스 순위',
    difficulty: 'hard',
    desc: '두 명이 풀하우스 — 쓰리오브어카인드가 높은 쪽이 이깁니다',
    community: [mkCard('8','♠'), mkCard('8','♦'), mkCard('K','♣'), mkCard('K','♥'), mkCard('5','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('8','♣'), mkCard('3','♦')] },
      { name: '플레이어 2', cards: [mkCard('K','♦'), mkCard('2','♠')] },
      { name: '플레이어 3', cards: [mkCard('A','♦'), mkCard('Q','♣')] },
      { name: '딜러',      cards: [mkCard('J','♠'), mkCard('10','♦')] },
    ]
  },
  {
    title: '휠 스트레이트',
    difficulty: 'medium',
    desc: 'A-2-3-4-5 = 5 하이 스트레이트 (휠) — A가 작은 숫자로 쓰입니다',
    community: [mkCard('A','♠'), mkCard('2','♦'), mkCard('3','♣'), mkCard('9','♥'), mkCard('K','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('4','♥'), mkCard('5','♦')] },
      { name: '플레이어 2', cards: [mkCard('J','♣'), mkCard('Q','♠')] },
      { name: '플레이어 3', cards: [mkCard('6','♣'), mkCard('7','♦')] },
      { name: '딜러',      cards: [mkCard('4','♣'), mkCard('8','♠')] },
    ]
  },
  {
    title: '카운터페이트 (족보 무력화)',
    difficulty: 'hard',
    desc: '보드의 AA+KK가 최강 두 쌍 — 홀카드의 페어는 의미 없고 키커로만 순위가 결정됩니다',
    community: [mkCard('A','♠'), mkCard('A','♦'), mkCard('K','♣'), mkCard('K','♥'), mkCard('7','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('7','♥'), mkCard('6','♦')] },
      { name: '플레이어 2', cards: [mkCard('2','♣'), mkCard('3','♠')] },
      { name: '플레이어 3', cards: [mkCard('Q','♦'), mkCard('J','♠')] },
      { name: '딜러',      cards: [mkCard('10','♣'), mkCard('9','♦')] },
    ]
  },
  {
    title: '포카드 키커',
    difficulty: 'medium',
    desc: '보드에 포카드 완성 — 홀카드 높은 쪽이 승리',
    community: [mkCard('9','♠'), mkCard('9','♦'), mkCard('9','♣'), mkCard('9','♥'), mkCard('2','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('A','♦'), mkCard('K','♦')] },
      { name: '플레이어 2', cards: [mkCard('K','♣'), mkCard('Q','♠')] },
      { name: '플레이어 3', cards: [mkCard('Q','♦'), mkCard('J','♠')] },
      { name: '딜러',      cards: [mkCard('J','♦'), mkCard('7','♠')] },
    ]
  },
  {
    title: '스트레이트 플러시 vs 포카드',
    difficulty: 'hard',
    desc: '스트레이트 플러시(8위)는 포카드(7위)보다 강합니다 — 희귀 상황 숙지',
    community: [mkCard('5','♥'), mkCard('6','♥'), mkCard('7','♥'), mkCard('7','♠'), mkCard('7','♦')],
    players: [
      { name: '플레이어 1', cards: [mkCard('8','♥'), mkCard('9','♥')] },
      { name: '플레이어 2', cards: [mkCard('7','♣'), mkCard('A','♠')] },
      { name: '플레이어 3', cards: [mkCard('K','♦'), mkCard('Q','♠')] },
      { name: '딜러',      cards: [mkCard('J','♦'), mkCard('10','♣')] },
    ]
  },
  {
    title: '투페어 키커',
    difficulty: 'easy',
    desc: '보드 투페어 상황 — 홀카드가 키커 역할',
    community: [mkCard('J','♠'), mkCard('J','♦'), mkCard('8','♣'), mkCard('8','♥'), mkCard('2','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('A','♦'), mkCard('3','♦')] },
      { name: '플레이어 2', cards: [mkCard('K','♣'), mkCard('4','♠')] },
      { name: '플레이어 3', cards: [mkCard('Q','♦'), mkCard('6','♠')] },
      { name: '딜러',      cards: [mkCard('10','♠'), mkCard('9','♦')] },
    ]
  },
  {
    title: '스트레이트 높이 비교',
    difficulty: 'easy',
    desc: '모두 스트레이트이지만 가장 높은 끝 카드로 순위 결정',
    community: [mkCard('5','♠'), mkCard('6','♦'), mkCard('7','♣'), mkCard('8','♥'), mkCard('K','♠')],
    players: [
      { name: '플레이어 1', cards: [mkCard('9','♣'), mkCard('10','♠')] },
      { name: '플레이어 2', cards: [mkCard('4','♥'), mkCard('3','♦')] },
      { name: '플레이어 3', cards: [mkCard('9','♦'), mkCard('J','♠')] },
      { name: '딜러',      cards: [mkCard('A','♣'), mkCard('Q','♦')] },
    ]
  },
];

// ============================================================
//  SIMULATIONS
// ============================================================

const Sims = {

  // ---- BLACKJACK ----
  blackjack: (() => {
    const N = 5;
    let S = {};
    let bjFlipId = 0;

    const $ = id => document.getElementById(id);
    const msg    = () => {};
    const msgCol = () => {};
    const actions = () => {};
    const stats   = ()    => { $('bj-rounds').textContent = S.rounds; $('bj-score').textContent = S.score; $('bj-mistakes').textContent = S.mistakes; };
    const addMistake = () => { S.mistakes++; stats(); };
    const dealerCtrl      = h => { const e = $('bj-dealer-controls'); if (e) e.innerHTML = h; };
    const clearDealerCtrl = () => { const e = $('bj-dealer-controls'); if (e) e.innerHTML = ''; };
    const setSpotAct  = (i, h) => { const e = $(`bj-spot-act-${i}`); if (e) e.innerHTML = h; };
    const clearSpotAct = i     => { const e = $(`bj-spot-act-${i}`); if (e) e.innerHTML = ''; };
    const enableStart  = ()    => { const e = $('bj-mode-bar'); if (e) { e.style.opacity = ''; e.style.visibility = ''; } };
    const disableStart = ()    => {
      const e = $('bj-mode-bar'); if (e) { e.style.opacity = '0.4'; e.style.visibility = 'hidden'; }
      const lbl = $('bj-dealer-label'); if (lbl) lbl.style.visibility = '';
    };

    function bval(c) {
      if (c.rank === 'A') return 11;
      if (['J','Q','K','10'].includes(c.rank)) return 10;
      return +c.rank;
    }
    function total(hand) {
      let t = hand.reduce((s, c) => s + bval(c), 0);
      let a = hand.filter(c => c.rank === 'A').length;
      while (t > 21 && a--) t -= 10;
      return t;
    }

    // Return a card from deck that won't create BJ with firstCard
    function nonBJCard(firstCard) {
      for (let j = S.deck.length - 1; j >= 0; j--) {
        if (total([firstCard, S.deck[j]]) !== 21) {
          const [c] = S.deck.splice(j, 1);
          return c;
        }
      }
      return S.deck.pop();
    }

    function pullRank(rank) {
      const idx = S.deck.findIndex(c => c.rank === rank);
      if (idx >= 0) { const [c] = S.deck.splice(idx, 1); return c; }
      return S.deck.pop();
    }
    function pullFrom(ranks) {
      const idx = S.deck.findIndex(c => ranks.includes(c.rank));
      if (idx >= 0) { const [c] = S.deck.splice(idx, 1); return c; }
      return S.deck.pop();
    }
    // Dealer's first (showing) card should never be an ace. A 10-value
    // upcard (10/J/Q/K) is the only other precondition for a natural
    // two-card Dealer Blackjack once the trainee draws again (ace excluded
    // above, so 10 + Ace is the sole path) — throttling how often THAT
    // upcard is dealt directly rate-limits Dealer Blackjack frequency at
    // the hand-generation stage, without touching the trainee-driven draw
    // (dealerDraw()/safeHit()), dealerShouldDraw(), or the Pay/Push/Take
    // judging in testAnswer(), all of which stay exactly as before —
    // Dealer Blackjack still plays out with the same judging when it does
    // happen, it's just rarer. Naturally a 10-value upcard would show ~33%
    // of the time (4 of the 12 non-ace ranks); DEALER_TEN_UPCARD_RATE
    // drops that to ~12%, so Dealer Blackjack becomes roughly a third as
    // frequent instead of disappearing outright. The other 2-9 upcards
    // (which can never two-card-blackjack) fill the rest, unchanged
    // relative to each other, keeping the rest of the practice pool varied.
    const DEALER_TEN_UPCARD_RATE = 0.12;
    function pullDealerUpcard() {
      const TEN_VALUE = ['10', 'J', 'Q', 'K'];
      const NON_TEN = ['2', '3', '4', '5', '6', '7', '8', '9'];
      // Decide the target rank *group* first, then search for it — picking
      // "allow ten" as a loose OR on the search predicate would collapse to
      // just "any non-ace card" (whichever rank happens to sit first in the
      // shuffled deck), which stops DEALER_TEN_UPCARD_RATE from actually
      // controlling the odds. Committing to one target group up front makes
      // the resulting ten-vs-other split match the constant directly.
      const wantTen = Math.random() < DEALER_TEN_UPCARD_RATE;
      const primary = wantTen ? TEN_VALUE : NON_TEN;
      const fallback = wantTen ? NON_TEN : TEN_VALUE;
      let idx = S.deck.findIndex(c => primary.includes(c.rank));
      if (idx < 0) idx = S.deck.findIndex(c => fallback.includes(c.rank));
      if (idx >= 0) { const [c] = S.deck.splice(idx, 1); return c; }
      // Deck has nothing left but aces near a reshuffle boundary.
      const idx2 = S.deck.findIndex(c => c.rank !== 'A');
      if (idx2 >= 0) { const [c] = S.deck.splice(idx2, 1); return c; }
      return S.deck.pop();
    }

    function safeHit(hand) {
      const indices = Array.from({length: S.deck.length}, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (const idx of indices) {
        if (total([...hand, S.deck[idx]]) <= 21) { const [c] = S.deck.splice(idx, 1); return c; }
      }
      return S.deck.pop();
    }

    function isSoftHand(hand) {
      const hardSum = hand.reduce((s, c) => {
        if (c.rank === 'A') return s + 1;
        if (['J','Q','K','10'].includes(c.rank)) return s + 10;
        return s + parseInt(c.rank);
      }, 0);
      return total(hand) > hardSum;
    }
    function dealerShouldDraw(hand) {
      const dv = total(hand);
      if (dv < 17) return true;
      if (dv === 17 && isSoftHand(hand)) return true;
      return false;
    }
    function stopPayTimer() {
      if (S.payTimerInterval) { clearInterval(S.payTimerInterval); S.payTimerInterval = null; }
    }
    // Kills every outstanding timer/interval this sim can have running —
    // the per-seat pay-timer interval AND the NEXT HAND auto-advance
    // setTimeout from showFinalResult(). Reassigning S (as init() does)
    // only replaces what the *new* S points to; it does nothing to an
    // already-scheduled setInterval/setTimeout still holding a reference
    // to the *old* S via closure, which is exactly what let a stale timer
    // interval keep writing into a freshly re-entered #bj-pay-timer-N
    // element (same id, brand new DOM) after leaving for Home and coming
    // back — hence calling this explicitly, both when navigating away
    // (App.navigate) and defensively again at the top of init().
    function stopAllTimers() {
      stopPayTimer();
      if (S.nextHandTimer) { clearTimeout(S.nextHandTimer); S.nextHandTimer = null; }
    }
    function startPayTimer(i) {
      stopPayTimer();
      S.payTimerStart = performance.now();
      const el = $(`bj-pay-timer-${i}`);
      if (el) el.textContent = '0s';
      S.payTimerInterval = setInterval(() => {
        const e = $(`bj-pay-timer-${i}`);
        if (!e) return;
        const sec = Math.floor((performance.now() - S.payTimerStart) / 1000);
        e.textContent = `${sec}s`;
      }, 200);
    }
    function adjustDealerLayout() {
      const wrapEl = $('bj-dealer-wrap');
      const handEl = $('bj-dealer-hand');
      if (!wrapEl || !handEl) return;
      const cards = handEl.querySelectorAll('.bj-flip-card');
      if (cards.length <= 1) { cards.forEach(c => c.style.marginLeft = ''); return; }
      // Cards sit in their own centered grid column now, independent of the
      // Draw/Stop controls column, so the full wrap width is available to them.
      const availW = wrapEl.offsetWidth;
      const cardW = cards[0].offsetWidth || 60;
      const n = cards.length;
      const defaultGap = 6;
      const needed = n * cardW + (n - 1) * defaultGap;
      let gap;
      if (needed <= availW) {
        gap = defaultGap;
      } else {
        gap = Math.max(-cardW * 0.65, (availW - n * cardW) / (n - 1));
      }
      Array.from(cards).forEach((c, i) => { c.style.marginLeft = i === 0 ? '' : `${gap}px`; });
    }
    function adjustPlayerHandScale(idx) {
      const handEl = $(`bj-hand-${idx}`);
      if (!handEl) return;
      const hc = handEl.querySelector('.hand-cards');
      if (!hc) return;
      hc.style.transform = '';
      const naturalH = hc.scrollHeight;
      const boxH = handEl.offsetHeight;
      if (!naturalH || naturalH <= boxH) { hc.style.transformOrigin = ''; return; }
      const scale = boxH / naturalH;
      hc.style.transform = `scale(${scale.toFixed(3)})`;
      hc.style.transformOrigin = 'top left';
    }
    function showDealerControls() {
      const dv = total(S.dh);
      const soft = isSoftHand(S.dh);
      const label = (soft && dv === 17) ? `Soft ${dv}` : `${dv}`;
      msg(`Dealer: ${label}. Draw or Stop?`);
      dealerCtrl(`
        <button class="dealer-ctrl-btn dealer-draw-btn" onclick="Sims.blackjack.dealerDraw()">Draw Card</button>
        <button class="dealer-ctrl-btn dealer-stop-btn" onclick="Sims.blackjack.dealerStop()">Stop</button>
      `);
    }
    function showDealerAlert(text, callback) {
      const area = $('bj-dealer-wrap');
      if (!area) { setTimeout(callback, 1400); return; }
      const ov = document.createElement('div');
      ov.className = 'dealer-alert-overlay';
      ov.innerHTML = `<div class="dealer-alert-text">${text}</div>`;
      area.appendChild(ov);
      setTimeout(() => { ov.remove(); callback(); }, 1400);
    }

    // Flip-card wrapper for player spot cards (52x74)
    function bjFlipHTML(card, id, revealed = true) {
      return `<div class="bj-flip-card${revealed ? ' bj-revealed' : ''}" id="bjfc${id}">` +
        `<div class="bj-flip-inner">` +
          `<div class="bj-flip-back"><div class="card back"><div class="card-pattern"></div></div></div>` +
          `<div class="bj-flip-front">${cardHTML(card)}</div>` +
        `</div></div>`;
    }
    function bjReveal(id) {
      const e = document.getElementById(`bjfc${id}`);
      if (e) e.classList.add('bj-revealed');
    }

    const STATUS_BADGE = {
      blackjack: '<div class="spot-status s-bj">BJ ♠</div>',
      bust: '<div class="spot-status s-bust">BUST</div>',
      win:  '<div class="spot-status s-win">PAY</div>',
      lose: '<div class="spot-status s-lose">TAKE</div>',
      push: '<div class="spot-status s-push">PUSH</div>',
    };

    function renderPlayers() {
      S.players.forEach((p, i) => {
        const spot   = $(`bj-spot-${i}`);
        const handEl = $(`bj-hand-${i}`);
        const statEl = $(`bj-status-${i}`);
        if (!spot) return;

        const hcEl = handEl.querySelector('.hand-cards');
        if (p.hideCards) {
          if (hcEl) hcEl.innerHTML = '';
        } else {
          if (hcEl) hcEl.innerHTML = p.hand.map(c => bjFlipHTML(c, ++bjFlipId, true)).join('');
          requestAnimationFrame(() => adjustPlayerHandScale(i));
        }

        const showBadge = p.hideCards || (p.status !== 'active' && p.status !== 'stand');
        statEl.innerHTML = showBadge ? (STATUS_BADGE[p.status] || '') : '';

        spot.className = 'player-spot';
        if (S.phase === 'player'   && i === S.current)   spot.classList.add('active');
        if (S.phase === 'pay-test' && i === S.payTestIdx) spot.classList.add('pay-test-active');
        if (p.status === 'bust' && p.hideCards) spot.classList.add('faded');
      });
    }

    function showHandAnim(idx, type, callback) {
      const spot = $(`bj-spot-${idx}`);
      if (!spot) { callback(); return; }
      const wrap = document.createElement('div');
      wrap.className = 'hand-anim-wrap';
      const inner = document.createElement('div');
      inner.className = `hand-anim hand-anim-${type}`;
      inner.textContent = type === 'hit' ? '✊' : '🤚';
      // Small HIT/STAY label next to the hand gesture (2026-08-27) — teaches
      // the gesture's meaning alongside the gesture itself. Pure label, no
      // gameplay effect. `.hand-anim` (not this wrap) carries the 180°
      // flip that makes the emoji read right-side-up from the trainee's
      // side — see that class's own comment in style.css for why the
      // bubble doesn't need any counter-rotation of its own.
      const bubble = document.createElement('div');
      bubble.className = 'hand-anim-bubble';
      bubble.textContent = type === 'hit' ? 'HIT' : 'STAY';
      wrap.appendChild(inner);
      wrap.appendChild(bubble);
      spot.appendChild(wrap);
      setTimeout(() => { wrap.remove(); callback(); }, 480);
    }

    function autoDecide() {
      const i = S.current;
      const pv = total(S.players[i].hand);
      S.pendingAction = pv >= 17 ? 'stand' : 'hit';
      setSpotAct(i, `<button class="spot-btn spot-next-btn" onclick="Sims.blackjack.executeAction()">Next Action</button>`);
      msg(`Player ${i + 1}`);
      actions('');
    }

    function enterDealerPhase() {
      S.dealerPhase = true;
      S.phase = 'dealer';
      renderPlayers();
      actions('');
      showDealerControls();
    }
    function advancePlayer() {
      if (S.current >= 0) clearSpotAct(S.current);
      S.current++;
      while (S.current < N) {
        if (S.players[S.current].status === 'active') break;
        S.current++;
      }
      if (S.current >= N) { enterDealerPhase(); return; }
      renderPlayers();
      autoDecide();
    }
    function nextHand() {
      if (S.speedMode) Sims.blackjack.newGameSpeed();
      else              Sims.blackjack.newGame();
    }

    function startPayTest() {
      // Only clears the spot-action buttons for every seat — never the
      // bj-pay-timer text. A hand already resolved (correct Pay/Push/Take)
      // has its interval stopped by startPayTimer()'s own stopPayTimer()
      // call, so its last "Ns" reading is already frozen in place; wiping
      // it here on every subsequent startPayTest() call (e.g. when moving
      // to the next seat) was erasing that seat's final elapsed time
      // instead of leaving it where the timer was shown. The one timer
      // that DOES need resetting — the seat about to become active — gets
      // that from startPayTimer(i) below, which sets its own text to '0s'.
      for (let i = 0; i < N; i++) {
        clearSpotAct(i);
      }
      while (S.payTestIdx >= 0) {
        const p = S.players[S.payTestIdx];
        if (p.status === 'bust' || p.hideCards) { S.payTestIdx--; continue; }
        break;
      }
      if (S.payTestIdx < 0) { showFinalResult(); return; }

      S.phase = 'pay-test';
      const i = S.payTestIdx;
      setSpotAct(i, `<div class="spot-pay-row">
        <button class="spot-btn spot-pay-btn"  onclick="Sims.blackjack.testAnswer('pay')">Pay</button>
        <button class="spot-btn spot-push-btn" onclick="Sims.blackjack.testAnswer('push')">Push</button>
        <button class="spot-btn spot-take-btn" onclick="Sims.blackjack.testAnswer('take')">Take</button>
      </div>`);
      // startPayTest() runs again for the SAME seat on a MISTAKE retry
      // (testAnswer()'s wrong-answer branch), not just when a genuinely new
      // seat becomes active. Only (re)start the timer when the seat has
      // actually changed — S.payTimerIdx tracks whichever seat the running
      // interval belongs to — so a wrong answer never resets or restarts
      // this seat's elapsed time; the same interval just keeps counting
      // straight through the MISTAKE flash and into the retry.
      if (S.payTimerIdx !== i) {
        startPayTimer(i);
        S.payTimerIdx = i;
      }
      renderPlayers();
      msg(`Player ${i + 1}: Pay, Push, or Take?`);
      actions('');
    }

    function showFinalResult() {
      stopPayTimer();
      S.phase = 'done';
      S.rounds++;
      for (let i = 0; i < N; i++) clearSpotAct(i);
      renderPlayers();
      S.score += S.players.filter(p => p.status === 'win').length;
      stats();
      const table = document.querySelector('.blackjack-table');
      if (table) {
        const ov = document.createElement('div');
        ov.className = 'next-hand-overlay';
        ov.innerHTML = '<div class="next-hand-text">NEXT HAND</div>';
        table.appendChild(ov);
        S.nextHandTimer = setTimeout(() => { ov.remove(); nextHand(); }, 1600);
      } else {
        S.nextHandTimer = setTimeout(() => nextHand(), 1600);
      }
    }

    return {
      stopTimers: stopAllTimers,
      init(isRestart) {
        const wasMidHand = isRestart && S && S.phase && S.phase !== 'idle' && S.phase !== 'done';
        if (S) stopAllTimers();
        const keepRounds   = isRestart && S ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        const keepScore    = isRestart && S ? S.score    : 0;
        const keepMistakes = isRestart && S ? S.mistakes : 0;
        S = { deck: createDeck(6), players: [], dh: [], current: 0, dealerPhase: false,
              rounds: keepRounds, score: keepScore, mistakes: keepMistakes, pendingAction: null, payTestIdx: 4, phase: 'idle',
              payTimerStart: null, payTimerInterval: null, payTimerIdx: null, speedMode: false, nextHandTimer: null };
        bjFlipId = 0;
        stats();
      },

      newGame() {
        stopPayTimer();
        S.payTimerIdx = null;
        if (S.deck.length < 30) S.deck = createDeck(6);
        S.speedMode = false;
        S.players = Array.from({length: N}, () => ({ hand: [], status: 'active', hideCards: false }));
        S.dh = [];
        S.current = 0;
        S.dealerPhase = false;
        S.pendingAction = null;
        S.payTestIdx = 4;
        S.phase = 'player';
        for (let i = 0; i < N; i++) {
          clearSpotAct(i);
          const st = $(`bj-status-${i}`); if (st) st.innerHTML = '';
          const sp = $(`bj-spot-${i}`);   if (sp) sp.className = 'player-spot';
          const t  = $(`bj-pay-timer-${i}`); if (t) t.textContent = '';
        }
        clearDealerCtrl();
        disableStart();

        // 1 of 5 spots gets an ace-led low hand (A + 2-5 = soft 13-16 → guaranteed hit)
        const hitSpots = new Set(
          [...Array(N)].map((_, i) => i).sort(() => Math.random() - .5).slice(0, 1)
        );

        // Round 1: first card per player
        for (let i = 0; i < N; i++) {
          S.players[i].hand.push(hitSpots.has(i) ? pullRank('A') : S.deck.pop());
        }
        // Dealer upcard: never an ace
        S.dh.push(pullDealerUpcard());

        // Round 2: second card per player
        for (let i = 0; i < N; i++) {
          if (hitSpots.has(i)) {
            // A + 2/3/4/5 → soft 13-16, always triggers a hit
            S.players[i].hand.push(pullFrom(['2','3','4','5']));
          } else {
            S.players[i].hand.push(nonBJCard(S.players[i].hand[0]));
          }
        }

        // Clear hand displays
        for (let i = 0; i < N; i++) {
          const hc = document.querySelector(`#bj-hand-${i} .hand-cards`);
          if (hc) { hc.innerHTML = ''; hc.style.transform = ''; }
        }
        $('bj-dealer-hand').innerHTML = '';

        // Animated deal: P0 P1 P2 P3 P4 D  P0 P1 P2 P3 P4
        const steps = [];
        for (let i = 0; i < N; i++) steps.push({ type: 'player', idx: i, card: S.players[i].hand[0] });
        steps.push({ type: 'dealer', card: S.dh[0] });
        for (let i = 0; i < N; i++) steps.push({ type: 'player', idx: i, card: S.players[i].hand[1] });
        steps.forEach((step, n) => {
          setTimeout(() => {
            const id = ++bjFlipId;
            if (step.type === 'player') {
              const el = document.querySelector(`#bj-hand-${step.idx} .hand-cards`);
              if (!el) return;
              el.insertAdjacentHTML('beforeend', bjFlipHTML(step.card, id, false));
              setTimeout(() => bjReveal(id), 90);
            } else {
              const el = $('bj-dealer-hand');
              if (!el) return;
              el.insertAdjacentHTML('beforeend', bjFlipHTML(step.card, id, false));
              setTimeout(() => bjReveal(id), 90);
            }
          }, n * 140);
        });

        setTimeout(() => {
          stats();
          msg('Game started!');
          S.current = -1;
          for (let i = 0; i < N; i++) adjustPlayerHandScale(i);
          advancePlayer();
        }, steps.length * 140 + 320);
      },

      // Speed Mode: every player hand is dealt AND auto-resolved (hit until 17+,
      // same mimic-dealer rule as a manually-played Next Action) before the
      // trainee sees the table, so practice starts right at the dealer's own
      // Draw/Stop turn instead of stepping through each player's decisions.
      newGameSpeed() {
        stopPayTimer();
        S.payTimerIdx = null;
        if (S.deck.length < 30) S.deck = createDeck(6);
        S.speedMode = true;
        S.players = Array.from({length: N}, () => ({ hand: [], status: 'active', hideCards: false }));
        S.dh = [];
        S.current = N;
        S.dealerPhase = false;
        S.pendingAction = null;
        S.payTestIdx = 4;
        S.phase = 'player';
        for (let i = 0; i < N; i++) {
          clearSpotAct(i);
          const st = $(`bj-status-${i}`); if (st) st.innerHTML = '';
          const sp = $(`bj-spot-${i}`);   if (sp) sp.className = 'player-spot';
          const t  = $(`bj-pay-timer-${i}`); if (t) t.textContent = '';
        }
        clearDealerCtrl();
        disableStart();

        for (let i = 0; i < N; i++) {
          const p = S.players[i];
          p.hand.push(S.deck.pop(), S.deck.pop());
          while (total(p.hand) < 17) {
            p.hand.push(safeHit(p.hand));
          }
          p.status = total(p.hand) > 21 ? 'bust' : 'stand';
        }
        S.dh.push(pullDealerUpcard());

        const dealerEl = $('bj-dealer-hand');
        if (dealerEl) dealerEl.innerHTML = S.dh.map(c => bjFlipHTML(c, ++bjFlipId, true)).join('');

        renderPlayers();
        for (let i = 0; i < N; i++) adjustPlayerHandScale(i);
        stats();
        msg('Game started!');
        enterDealerPhase();
      },

      executeAction() {
        const i = S.current;
        const p = S.players[i];
        const type = S.pendingAction;
        clearSpotAct(i);

        showHandAnim(i, type === 'stand' ? 'stay' : 'hit', () => {
          if (type === 'hit') {
            const newCard = safeHit(p.hand);
            p.hand.push(newCard);
            const hcHit = document.querySelector(`#bj-hand-${i} .hand-cards`);
            const id = ++bjFlipId;
            if (hcHit) hcHit.insertAdjacentHTML('beforeend', bjFlipHTML(newCard, id, false));
            setTimeout(() => bjReveal(id), 90);
            setTimeout(() => {
              adjustPlayerHandScale(i);
              const pv = total(p.hand);
              if (pv > 21) {
                p.status = 'bust';
                renderPlayers();
                msg(`Player ${i + 1}: Bust!`);
                setTimeout(() => advancePlayer(), 400);
              } else if (pv === 21) {
                p.status = 'stand';
                renderPlayers();
                msg(`Player ${i + 1}: 21`);
                setTimeout(() => advancePlayer(), 400);
              } else {
                autoDecide();
              }
            }, 420);
          } else {
            p.status = 'stand';
            setTimeout(() => advancePlayer(), 380);
          }
        });
      },

      dealerDraw() {
        if (!dealerShouldDraw(S.dh)) {
          addMistake();
          showDealerAlert('Over Draw!', () => showDealerControls());
          return;
        }
        clearDealerCtrl();
        const newCard = safeHit(S.dh);
        S.dh.push(newCard);
        const el = $('bj-dealer-hand');
        const id = ++bjFlipId;
        if (el) el.insertAdjacentHTML('beforeend', bjFlipHTML(newCard, id, false));
        setTimeout(() => bjReveal(id), 90);
        setTimeout(() => { adjustDealerLayout(); showDealerControls(); }, 400);
      },

      dealerStop() {
        if (dealerShouldDraw(S.dh)) {
          addMistake();
          showDealerAlert('Mistake!', () => showDealerControls());
          return;
        }
        clearDealerCtrl();
        S.payTestIdx = 4;
        startPayTest();
      },

      testAnswer(answer) {
        const i = S.payTestIdx;
        const pv = total(S.players[i].hand);
        const dv = total(S.dh);
        const correct = pv > dv ? 'pay' : pv === dv ? 'push' : 'take';

        if (answer !== correct) {
          addMistake();
          clearSpotAct(i);
          const table = document.querySelector('.blackjack-table');
          if (table) {
            const ov = document.createElement('div');
            ov.className = 'mistake-overlay';
            ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
            table.appendChild(ov);
            setTimeout(() => { ov.remove(); startPayTest(); }, 1600);
          }
          return;
        }

        S.players[i].status = correct === 'pay' ? 'win' : correct === 'push' ? 'push' : 'lose';
        S.payTestIdx--;
        clearSpotAct(i);
        renderPlayers();
        setTimeout(() => startPayTest(), 400);
      },
    };
  })(),

  // ---- BACCARAT ----
  baccarat: (() => {
    const DENOMS = [
      { value: 100000000, label: '1억',  color: '#8e44ad' },
      { value: 10000000,  label: '1천만', color: '#e67e22' },
      { value: 1000000,   label: '1백만', color: '#795548' },
      { value: 100000,    label: '10만',  color: '#c9a84c' },
      { value: 50000,     label: '5만',   color: '#27ae60' },
      { value: 10000,     label: '1만',   color: '#e74c3c' },
      { value: 5000,      label: '5천',   color: '#2980b9' },
      { value: 1000,      label: '1천',   color: '#7f8c8d' },
    ];

    function createBacDeck() {
      const tens = new Set(['10','J','Q','K']);
      const d = [];
      for (let i = 0; i < 8; i++)
        for (const s of SUITS)
          for (const r of RANKS)
            if (!tens.has(r) || i < 4)
              d.push({ suit: s, rank: r, red: s === '♥' || s === '♦' });
      return shuffle(d);
    }

    function mc(r, s) { return { rank: r, suit: s, red: s === '♥' || s === '♦' }; }

    // init: [P1,P2,B1,B2], extra: B3 for player7-with-banker-draw, P3 for banker6, null for super7
    const BSCEN_P7 = [
      { init: [['7','♠'],['K','♥'],['2','♣'],['3','♦']], extra: ['Q','♠'] },  // pp=7 stand, bp=5→draw Q→5
      { init: [['7','♥'],['J','♦'],['A','♠'],['3','♣']], extra: ['K','♦'] },  // pp=7 stand, bp=4→draw K→4
      { init: [['3','♣'],['4','♦'],['2','♥'],['2','♠']], extra: ['J','♣'] },  // pp=7 stand, bp=4→draw J→4
      { init: [['5','♦'],['2','♣'],['A','♥'],['3','♠']], extra: ['K','♣'] },  // pp=7 stand, bp=4→draw K→4
      { init: [['7','♦'],['K','♠'],['6','♣'],['Q','♥']], extra: null },       // pp=7, bp=6 both stand → SUPER 7, 4 cards, 30:1
      { init: [['7','♣'],['J','♥'],['6','♦'],['10','♠']], extra: null },      // pp=7, bp=6 both stand → SUPER 7, 4 cards, 30:1
    ];
    const BSCEN_B6 = [
      { init: [['A','♠'],['2','♥'],['3','♣'],['3','♦']], extra: ['J','♠'] },  // pp=3→J(0)=3, bp=6 stand
      { init: [['2','♠'],['A','♥'],['4','♣'],['2','♦']], extra: ['K','♠'] },  // pp=3→K(0)=3, bp=6 stand
      { init: [['3','♠'],['A','♥'],['2','♣'],['4','♦']], extra: ['Q','♦'] },  // pp=4→Q(0)=4, bp=6 stand
      { init: [['2','♣'],['2','♦'],['3','♥'],['3','♠']], extra: ['10','♣'] }, // pp=4→10(0)=4, bp=6 stand
      { init: [['A','♣'],['4','♦'],['2','♥'],['4','♠']], extra: ['J','♦'] },  // pp=5→J(0)=5, bp=6 stand
      { init: [['3','♣'],['A','♥'],['6','♦'],['Q','♠']], extra: ['3','♠'] },  // pp=4→3=7, bp=6 stand → SUPER 7, 5 cards, 40:1
      { init: [['A','♣'],['2','♥'],['6','♠'],['J','♣']], extra: ['4','♦'] },  // pp=3→4=7, bp=6 stand → SUPER 7, 5 cards, 40:1
    ];

    function pushForcedScenario() {
      const list = Math.random() < 0.5 ? BSCEN_P7 : BSCEN_B6;
      const s = list[Math.floor(Math.random() * list.length)];
      const [p1, p2, b1, b2] = s.init.map(c => mc(...c));
      if (s.extra) {
        S.deck.push(mc(...s.extra), b2, p1, b1, p2);
      } else {
        S.deck.push(b2, p1, b1, p2);
      }
    }

    let S = {};
    let flipId = 0;

    const $ = id => document.getElementById(id);
    const msg     = t => { const e = $('bac-msg'); if (e) { e.textContent = t; e.style.color = ''; } };
    const actions = h => { const e = $('bac-actions'); if (e) e.innerHTML = h; };
    // START (before the first hand) and NEXT HAND (after every hand after
    // that) share one spot and one look — the Pair judgment area's
    // centered mid (NO PAIR) slot, right under the result text. Only the
    // label differs. The banker/player Pair slots are cleared alongside
    // it so the whole row reads as just this one button.
    const showCtaBtn = (label) => {
      setBtn('bac-pair-b', '');
      setBtn('bac-pair-p', '');
      setBtn('bac-pair-mid', `<button class="bac-cta-btn" onclick="Sims.baccarat.deal()">${label}</button>`);
    };
    const showStartBar = () => showCtaBtn('START');
    const showNextBtn  = () => showCtaBtn('NEXT HAND');
    const hideAllCtrl  = () => { setBtn('bac-pair-mid', ''); };
    const enableDraw  = () => { S.rounds === 0 ? showStartBar() : showNextBtn(); };
    const disableDraw = () => { hideAllCtrl(); };

    function bval(c) {
      if (['10','J','Q','K'].includes(c.rank)) return 0;
      if (c.rank === 'A') return 1;
      return +c.rank;
    }
    const pts = h => h.reduce((s, c) => s + bval(c), 0) % 10;

    function bankerRule(bt, pThird) {
      if (pThird === null) return bt <= 5;
      const v = bval(pThird);
      if (bt <= 2) return true;
      if (bt === 3) return v !== 8;
      if (bt === 4) return v >= 2 && v <= 7;
      if (bt === 5) return v >= 4 && v <= 7;
      if (bt === 6) return v === 6 || v === 7;
      return false;
    }

    // Gates PLAYER WIN/BANKER WIN/TIE, BIG6/SMALL6/BIG7/SMALL7/SUPER7, and
    // CONFIRM (checkResult()) — the actual winner (and obviously the
    // card-count-dependent specials) can still change once a pending draw
    // resolves, so none of these are a safe guess until the hand is
    // genuinely done. Computed live off the actual hand lengths + the
    // same draw rules quizInitial()/quizBanker() use, instead of a
    // manually-toggled flag, so it can't drift out of sync across the
    // several draw entry/exit points. checkResult()'s own OLDER
    // needsDrawP/needsDrawB ('initial' source) and bankerRule(bp,pThird)
    // ('banker' source) pre-checks are each exactly equivalent to
    // `!handFullyDrawn()` at that stage (verified by derivation, not just
    // by inspection) — this guard now runs first and returns before
    // either old check is reached, so both are unreachable dead code.
    // Left in place rather than deleted: harmless, and removing "existing
    // game logic" wasn't asked for.
    function handFullyDrawn() {
      const bp = pts(S.bh);
      if (S.bh.length === 3) return true; // banker drew — nothing left to draw, ever
      if (S.ph.length === 3) return !bankerRule(bp, S.pThird); // player drew, banker's turn resolved?
      // Still 2+2 — mirrors quizInitial()'s correctChoice==='win' cases:
      // final either on a natural, or when player stands (pp>5) AND
      // banker would also stand (a draw is genuinely never coming).
      const pp = pts(S.ph);
      if (pp >= 8 || bp >= 8) return true;
      if (pp <= 5) return false;
      return !bankerRule(bp, null);
    }

    function flipHTML(card, id, extraClass = '', sideways = false) {
      const fc = `<div class="flip-card${extraClass ? ' ' + extraClass : ''}" id="fc${id}"><div class="flip-inner">
        <div class="flip-back"><div class="card back"><div class="card-pattern"></div></div></div>
        <div class="flip-front">${cardHTML(card)}</div>
      </div></div>`;
      return sideways ? `<div class="bac-card-sideways">${fc}</div>` : fc;
    }
    function revealFlip(id) { const e = $(`fc${id}`); if (e) e.classList.add('revealed'); }

    function setBtn(id, html) { const e = $(id); if (e) e.innerHTML = html; }

    function clearInlineBtns() {
      ['bac-b-btn-top','bac-p-btn-top','bac-tie-btn','bac-result',
       'bac-exp-big6','bac-exp-small6','bac-exp-big7','bac-exp-small7','bac-exp-super7'].forEach(id => {
        const e = $(id); if (e) e.innerHTML = '';
      });
      actions('');
    }

    function showMistake(retryFn, msg = 'MISTAKE!') {
      S.mistakes++;
      const mEl = $('bac-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      clearInlineBtns();
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = `<div class="mistake-text${msg === 'OVER DRAW' ? ' overdraw-text' : ''}">${msg}</div>`;
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
    }

    // One-time "level start" overlay shown on every STEP transition (not
    // per-question) — title + description fade in, hold, fade out, then
    // onDone() runs the step's actual setup. Same appended-to-.baccarat-
    // table technique as showMistake()'s overlay, but opacity-only
    // transitions (no scale/pop) per explicit "과도한 애니메이션 금지".
    function showStepIntro(title, desc, onDone) {
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) { onDone(); return; }
      const ov = document.createElement('div');
      ov.className = 'bac-step-intro-overlay';
      ov.innerHTML = `<div class="bac-step-intro-title">${title}</div><div class="bac-step-intro-desc">${desc}</div>`;
      tbl.appendChild(ov);
      // Added in a separate frame so the initial opacity:0 actually
      // paints before .bac-step-intro-show's opacity:1 kicks the CSS
      // transition off — adding both classes in the same tick would let
      // the browser coalesce them into one paint with no visible fade.
      requestAnimationFrame(() => ov.classList.add('bac-step-intro-show'));
      setTimeout(() => {
        ov.classList.remove('bac-step-intro-show');
        setTimeout(() => { ov.remove(); onDone(); }, 350);
      }, 1700);
    }

    // "Pick a STEP" landing state — Card Drawing now opens with NO step
    // selected at all (explicit ask: STEP 1/2/3 all inactive, table
    // genuinely empty — no cards, no result buttons, no PLAYER/BANKER
    // labels, no center divider). Unlike the earlier dismissible-overlay
    // attempt (superseded), there's no separate "content underneath" to
    // reveal by clicking away — .bac-no-step just gates what's visible
    // via CSS, toggled here, and the state persists until a step is
    // actually picked. The .bac-no-step-msg text is static markup
    // (Views.baccaratSim()) that this class reveals — no innerHTML/DOM
    // creation needed, unlike showStepIntro() above. (The STEP buttons
    // themselves no longer change for this state — they carry their own
    // always-on color identity/glow regardless of whether a step is
    // picked yet, see style.css.)
    function showNoStepState() {
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.add('bac-no-step');
    }
    function hideNoStepState() {
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.remove('bac-no-step');
    }

    // Forced-PAIR-first guard: fired by every WIN/TIE/BIG/SMALL/SUPER7/
    // DRAW/CONFIRM handler below when S.pairDone is still false. Counts a
    // Mistake (same as showMistake()) but is deliberately NOT
    // showMistake() itself — that one clears the board and blacks it out
    // via .mistake-overlay for "you judged wrong"; this fires on every
    // premature tap before PAIR is even attempted, so it must leave the
    // board and the trainee's current picks completely untouched (no
    // clearInlineBtns(), no retry callback) and just cancel that one
    // click. A lightweight toast (.pair-required-toast), not alert().
    function showPairRequiredToast() {
      S.mistakes++;
      const mEl = $('bac-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      // Replace instead of stack if the trainee taps multiple guarded
      // buttons in quick succession — one toast, its timer restarted.
      const existing = tbl.querySelector('.pair-required-toast');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'pair-required-toast';
      t.textContent = '⚠ 먼저 PAIR 판정을 진행하세요.';
      tbl.appendChild(t);
      setTimeout(() => t.remove(), 1800);
    }

    // Same light-nudge pattern as showPairRequiredToast() just above —
    // guards BIG6/SMALL6/BIG7/SMALL7/SUPER7 (via handFullyDrawn()) and
    // the PAIR row (via S.initialDealRevealed) from being answered before
    // the cards they depend on are actually visible. Deliberately reuses
    // the toast style, not showMistake()'s full-screen overlay, for the
    // same reason: this is a repeatable "not yet" guard, not a scored
    // wrong answer — the board and any picks already made stay untouched.
    function showCardsNotRevealedToast() {
      S.mistakes++;
      const mEl = $('bac-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const existing = tbl.querySelector('.pair-required-toast');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'pair-required-toast';
      t.textContent = '⚠ 모든 카드가 공개된 후 선택해주세요.';
      tbl.appendChild(t);
      setTimeout(() => t.remove(), 1800);
    }

    // Same light-nudge pattern as the two toasts above — guards
    // BIG6/SMALL6/BIG7/SUPER7/SMALL7 from being picked before a main
    // result (PLAYER WIN/BANKER WIN) is chosen. TIE does NOT satisfy
    // this guard: none of these specials are ever a valid combination
    // with a tie (see DIM_ON_WINNER's 'tie' entry, which already dims
    // every special), so only 'player-win'/'banker-win' count.
    function showMainResultRequiredToast() {
      S.mistakes++;
      const mEl = $('bac-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const existing = tbl.querySelector('.pair-required-toast');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'pair-required-toast';
      t.textContent = '⚠️ 메인 결과를 먼저 선택하세요.';
      tbl.appendChild(t);
      setTimeout(() => t.remove(), 1800);
    }

    function dealSequence(cards, targets, onDone) {
      const ids = [];
      cards.forEach((card, i) => {
        const id = ++flipId; ids.push(id);
        setTimeout(() => {
          const el = $(targets[i]);
          if (el) el.insertAdjacentHTML('beforeend', flipHTML(card, id));
        }, i * 420);
      });
      setTimeout(() => {
        ids.forEach(id => revealFlip(id));
        setTimeout(onDone, 650);
      }, (cards.length - 1) * 420 + 430);
    }

    function addCard(hand, elId, onDone, extraClass = '', sideways = false) {
      const card = S.deck.pop();
      hand.push(card);
      const id = ++flipId;
      const el = $(elId);
      if (el) el.insertAdjacentHTML('beforeend', flipHTML(card, id, extraClass, sideways));
      setTimeout(() => { revealFlip(id); setTimeout(onDone, 400); }, 350);
      return card;
    }

    function generateBets() {
      const amounts = [10000, 50000, 100000, 500000, 1000000, 2000000, 3000000];
      return Array.from({length: 5}, () => ({
        amount: amounts[Math.floor(Math.random() * amounts.length)] * (1 + Math.floor(Math.random() * 4)),
        side: Math.random() > 0.45 ? 'player' : 'banker',
        active: Math.random() > 0.15,
      }));
    }

    function renderBets() {
      const row = $('bac-betting-row');
      if (!row || !S.bets) return;
      row.innerHTML = S.bets.map((b, i) => {
        if (!b.active) return `<div class="bet-seat empty-seat"><div class="seat-label">P${i+1}</div></div>`;
        let rem = b.amount;
        const chips = [];
        for (const d of DENOMS) {
          const cnt = Math.floor(rem / d.value);
          if (cnt > 0) { chips.push({...d, cnt: Math.min(cnt, 4)}); rem -= cnt * d.value; }
          if (chips.length >= 3) break;
        }
        const chipHTML = chips.map(ch =>
          `<div class="chip-stack-mini" style="--chip-color:${ch.color}">${ch.label}</div>`
        ).join('');
        return `<div class="bet-seat">
          <div class="seat-label">P${i+1}</div>
          <div class="chip-pile-mini">${chipHTML}</div>
          <div class="bet-side-badge ${b.side}">${b.side === 'player' ? 'P' : 'B'}</div>
          <div class="bet-amount-text">${b.amount >= 10000 ? (b.amount/10000).toFixed(0)+'만' : b.amount.toLocaleString()}</div>
        </div>`;
      }).join('');
    }

    // Winner/special buttons no longer judge on click — they just toggle
    // a pick (S.resultPicks) on and off; CHECK is what actually submits.
    // Selection reads via dimming the OTHER, now-irrelevant buttons
    // (.bac-choice-dim) instead of highlighting the picked one — see
    // .bac-choice-dim's own comment in style.css for why (cross-device
    // border/glow rendering was unreliable). Driven entirely by the
    // WINNER pick (S.resultPicks.winner); a special picked with no
    // winner yet dims nothing, since there's no group to judge it
    // against. This is a "what's still a valid next pick" guide, not a
    // "here's what you clicked" indicator — so the keep-bright set per
    // winner is each side's OWN specials (the only ones that can
    // actually be correct alongside that winner in checkResult()'s
    // scoring: e.g. PLAYER WIN + player-big7/small7/super7 is a real
    // combination, PLAYER WIN + banker-big6/small6 never is) — fixed
    // 2026-08-20 after an earlier version had this backwards (dimmed
    // the winner's own specials, kept the other side's specials bright).
    const DIM_ON_WINNER = {
      'player-win': ['banker-win', 'tie', 'banker-big6', 'banker-small6'],
      'banker-win': ['player-win', 'tie', 'player-big7', 'super7', 'player-small7'],
      'tie':        ['player-win', 'banker-win', 'banker-big6', 'banker-small6', 'player-big7', 'super7', 'player-small7'],
    };
    // Same "what's still a valid next pick" guide as DIM_ON_WINNER, one
    // level deeper: once a card-count special is picked, its sibling
    // within the same winner's group dims too — e.g. PLAYER WIN + BIG 7
    // dims SMALL 7 (mutually exclusive: a hand can't be both 2 and 3
    // cards). SUPER 7 is deliberately absent from every list here and has
    // no entry of its own — real Baccarat treats it as an INDEPENDENT
    // side bet from Big/Small (card count vs. point/rank matchup), so a
    // hand can require BOTH e.g. player-small7 AND super7 at once; picking
    // one must never dim the other. See checkResult()'s `correctSuper7`
    // for the matching scoring-side change (2026-08-20, per explicit
    // request — this used to dim super7 against big7/small7 and vice
    // versa, which was wrong).
    const DIM_ON_SPECIAL = {
      'player-big7':   ['player-small7'],
      'player-small7': ['player-big7'],
      'banker-big6':   ['banker-small6'],
      'banker-small6': ['banker-big6'],
    };
    // Each button is now its own standalone piece (no more paired
    // sub-rows) since the experimental layout scatters BIG6/SMALL6/BIG7/
    // SMALL7 into their own grid cells instead of stacking them under
    // their WIN button.
    // BIG6/SMALL6/BIG7/SMALL7/SUPER7's inner text stack: a big central
    // number (6 or 7) with a smaller BIG/SMALL/SUPER label under it,
    // instead of one plain "BIG 6"-style string — purely a text-layout
    // change, no effect on the button's own shape/size/color (those all
    // still come from .bac-felt-circle/.bac-circle-btn + the button's
    // own color-family class, untouched here).
    const circleInner = (num, label) =>
      `<span class="bac-circle-num">${num}</span><span class="bac-circle-label">${label}</span>`;
    // B PAIR/P PAIR's inner text stack: two lines, SAME size/weight —
    // deliberately no big/small emphasis between the letter and "PAIR"
    // (unlike circleInner() above), per explicit feedback that circleInner
    // made B/P PAIR read as if one character were being highlighted over
    // the other. Still two lines (kept from the earlier stacked-layout
    // request), just uniform now.
    const pairInner = (letter) =>
      `<span class="bac-pair-line">${letter}</span><span class="bac-pair-line">PAIR</span>`;
    function winBtns(source) {
      const wp = S.resultPicks.winner, sp = S.resultPicks.special;
      const dim = (label) => {
        if (wp && DIM_ON_WINNER[wp] && DIM_ON_WINNER[wp].includes(label)) return ' bac-choice-dim';
        if (sp && DIM_ON_SPECIAL[sp] && DIM_ON_SPECIAL[sp].includes(label)) return ' bac-choice-dim';
        return '';
      };
      // Subtle permanent "pressed-in" look on the literal pick(s) — SUPER
      // 7 is its own independent boolean (S.resultPicks.super7), not part
      // of `sp`, so a hand needing BOTH e.g. player-small7 AND super7 can
      // show both as pressed simultaneously. Separate from .bac-
      // choice-dim: dimming is the reliable cross-device SIGNAL (see its
      // own comment in style.css for why it replaced border highlighting
      // entirely); this press is just a tactile nicety layered back on
      // top now that the signal itself doesn't depend on it.
      const pressed = (label) =>
        (label === wp || label === sp || (label === 'super7' && S.resultPicks.super7)) ? ' bac-choice-pressed' : '';
      // SUPER 7 is one result, not a BIG/SMALL choice — clicking it opens
      // the payout popup (pickSuper7()) instead of toggling directly; the
      // chosen ratio (S.resultPicks.superPayout) shows as a third, smallest
      // line under the SUPER label once set. Independent of `sp` — see
      // pressed() above.
      const super7Sub = S.resultPicks.super7 && S.resultPicks.superPayout
        ? `<span class="bac-super7-payout-tag">(${S.resultPicks.superPayout})</span>` : '';
      // Shape hooks only (see .bac-win-oval/.bac-felt-circle in CSS) — no
      // change to onclick handlers or judging logic. WIN buttons render as
      // a long oval (the biggest shape on the felt); TIE/BIG/SMALL/SUPER7
      // all render as equal-size circles, matching a real table's layout.
      return {
        bankerWin:    `<button class="btn-bac-banker bac-inline-btn bac-win-oval${dim('banker-win')}${pressed('banker-win')}" onclick="Sims.baccarat.toggleWinnerPick('banker-win','${source}')">BANKER WIN</button>`,
        bankerBig6:   `<button class="btn-bac-banker bac-inline-btn btn-bac-special bac-felt-circle bac-circle-btn${dim('banker-big6')}${pressed('banker-big6')}" onclick="Sims.baccarat.toggleSpecialPick('banker-big6','${source}')">${circleInner('6','BIG')}</button>`,
        bankerSmall6: `<button class="btn-bac-banker bac-inline-btn btn-bac-special bac-felt-circle bac-circle-btn${dim('banker-small6')}${pressed('banker-small6')}" onclick="Sims.baccarat.toggleSpecialPick('banker-small6','${source}')">${circleInner('6','SMALL')}</button>`,
        tie:          `<button class="btn-bac-tie bac-inline-btn bac-felt-circle bac-circle-btn${dim('tie')}${pressed('tie')}" onclick="Sims.baccarat.toggleWinnerPick('tie','${source}')"><span class="bac-circle-num">TIE</span></button>`,
        super7:       `<button class="btn-bac-super7 bac-inline-btn btn-bac-special bac-felt-circle bac-circle-btn${dim('super7')}${pressed('super7')}" onclick="Sims.baccarat.pickSuper7('${source}')">${circleInner('7','SUPER')}${super7Sub}</button>`,
        playerWin:    `<button class="btn-bac-player bac-inline-btn bac-win-oval${dim('player-win')}${pressed('player-win')}" onclick="Sims.baccarat.toggleWinnerPick('player-win','${source}')">PLAYER WIN</button>`,
        playerBig7:   `<button class="btn-bac-player bac-inline-btn btn-bac-special bac-felt-circle bac-circle-btn${dim('player-big7')}${pressed('player-big7')}" onclick="Sims.baccarat.toggleSpecialPick('player-big7','${source}')">${circleInner('7','BIG')}</button>`,
        playerSmall7: `<button class="btn-bac-player bac-inline-btn btn-bac-special bac-felt-circle bac-circle-btn${dim('player-small7')}${pressed('player-small7')}" onclick="Sims.baccarat.toggleSpecialPick('player-small7','${source}')">${circleInner('7','SMALL')}</button>`,
      };
    }

    // Paints all 9 winner/special buttons into the experimental grid's
    // individual cells. Shared by the initial render (show*Quiz) and by
    // refreshResultBtns() (re-painted after every toggle).
    function paintResultGrid(source) {
      const b = winBtns(source);
      setBtn('bac-p-btn-top', b.playerWin);
      setBtn('bac-b-btn-top', b.bankerWin);
      setBtn('bac-tie-btn', b.tie);
      setBtn('bac-exp-big6', b.bankerBig6);
      setBtn('bac-exp-small6', b.bankerSmall6);
      setBtn('bac-exp-big7', b.playerBig7);
      setBtn('bac-exp-small7', b.playerSmall7);
      setBtn('bac-exp-super7', b.super7);
    }

    // Always enabled — its own state never hints at correctness (req. 2).
    // Labeled CONFIRM (was RESULT) — class name/onclick/checkResult()
    // logic untouched, this is a label + color change only.
    function checkBtnHtml(source) {
      return `<button class="bac-check-btn" onclick="Sims.baccarat.checkResult('${source}')">CONFIRM</button>`;
    }

    // Re-paints just the winner/special buttons (not the DRAW slots, Pair
    // row, or CHECK itself) after a toggle, so a pick's highlight shows
    // up immediately without touching anything else on screen.
    function refreshResultBtns(source) {
      paintResultGrid(source);
    }

    function clearPairBtns() {
      setBtn('bac-pair-b', '');
      setBtn('bac-pair-mid', '');
      setBtn('bac-pair-p', '');
    }

    // Purely visual: dims/disables the WIN/TIE/BIG6/etc quiz buttons while
    // the Pair judgment is pending, so the trainee's attention stays on
    // BANKER PAIR / NO PAIR / PLAYER PAIR. Doesn't touch S.pairDone or any
    // click-handling logic — those buttons already reject early clicks on
    // their own (see quizInitial/quizSpecial/quizBanker's pairDone guard).
    function setPairPhaseFocus(active) {
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.toggle('bac-pair-phase', active);
    }

    // Purely visual, same pattern as setPairPhaseFocus() above: dims/
    // disables every result button (WIN/TIE/BIG6/etc, the Pair row, and
    // RESULT) while a third-card draw animation is running, instead of
    // the old clearInlineBtns()/clearPairBtns() approach of emptying
    // them out. Buttons stay exactly where/how big they were — only a
    // dim filter + pointer-events:none — so the layout never shifts,
    // nothing blinks away and back, and nothing gets repositioned while
    // the card animates in. Turned back off once the post-draw quiz
    // screen (showBankerDrawQuiz()/showSpecialQuiz()) repaints.
    function setDrawPhaseFocus(active) {
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.toggle('bac-draw-phase', active);
    }

    function renderPairBtns() {
      const bLocked = S.pairPicked.banker;
      const pLocked = S.pairPicked.player;
      // No ground-truth dimming here, by design: this renders before the
      // trainee has picked anything (or with one side of a double-pair
      // still open), and dimming off the real bPair/pPair would show the
      // answer before they've judged it themselves — defeats the whole
      // training purpose. Only a button the trainee has ALREADY correctly
      // picked (bLocked/pLocked) is disabled+dimmed; NO PAIR dims only
      // once that's happened for a real pair, i.e. strictly after a
      // correct pick, never as a pre-pick hint. B PAIR/P PAIR never dim
      // each other on lock alone: they're independent (a hand can have
      // either, neither, or both), so confirming one says nothing about
      // the other.
      const noPairDim = (bLocked || pLocked) ? ' bac-choice-dim' : '';
      // .bac-pair-circle: the round corner-mark shape on a real table.
      // NO PAIR now shares the exact same shape/size (positioned via
      // .bac-exp-nopair-mid, not a real table position but still styled
      // to read as part of the same Pair-judgment group).
      setBtn('bac-pair-b', `<button class="btn-bac-pair bac-felt-circle bac-pair-circle"${bLocked ? ' disabled' : ''} onclick="Sims.baccarat.quizPair('banker-pair')">${pairInner('B')}</button>`);
      setBtn('bac-pair-mid', `<button class="btn-bac-pair bac-felt-circle bac-pair-circle${noPairDim}" onclick="Sims.baccarat.quizPair('no-pair')">NO PAIR</button>`);
      setBtn('bac-pair-p', `<button class="btn-bac-pair bac-felt-circle bac-pair-circle"${pLocked ? ' disabled' : ''} onclick="Sims.baccarat.quizPair('player-pair')">${pairInner('P')}</button>`);
    }

    // Once the Pair judgment is fully answered, keep all three buttons
    // visible (not cleared) so the trainee can see what they picked while
    // the hand plays out — the button(s) actually picked stay at full
    // brightness (.bac-pair-selected overrides the shared :disabled dim),
    // the rest dim based on which side(s) actually had a real pair: NO
    // PAIR dims whenever either real pair was confirmed (p.banker ||
    // p.player); B PAIR dims unless banker's pair was the (or a) real
    // one, P PAIR dims unless player's was — independent of each other,
    // since a hand can have either, neither, or both. p.banker/p.player
    // only ever get set true on an actually-correct pick (quizPair()'s
    // `done` gate guarantees that by the time this final render runs,
    // p.banker === bPair and p.player === pPair), so they're already a
    // reliable stand-in for ground truth here — using `!p.none` for both
    // instead (as this used to) wrongly kept BOTH bright whenever either
    // one was real. Once the hand ends, showNextBtn() replaces this row
    // with the NEXT HAND button; deal() clears it for the new hand.
    function renderPairBtnsFinal() {
      const p = S.pairPicked;
      const bankerBright = p.banker, playerBright = p.player, noPairBright = p.none;
      const btn = (label, bright, extraCls) =>
        `<button class="btn-bac-pair${bright ? ' bac-pair-selected' : ''}${extraCls ? ' ' + extraCls : ''}" disabled>${label}</button>`;
      setBtn('bac-pair-b', btn(pairInner('B'), bankerBright, 'bac-felt-circle bac-pair-circle'));
      setBtn('bac-pair-mid', btn('NO PAIR', noPairBright, 'bac-felt-circle bac-pair-circle'));
      setBtn('bac-pair-p', btn(pairInner('P'), playerBright, 'bac-felt-circle bac-pair-circle'));
    }

    function showPairQuiz() {
      setPairPhaseFocus(true);
      renderPairBtns();
    }

    // A genuinely wrong PAIR guess (the trainee DID attempt the judgment,
    // just picked the wrong side) — distinct from showPairRequiredToast(),
    // which is for tapping WIN/TIE/BIG/SMALL/SUPER7/DRAW/CONFIRM before
    // PAIR has been judged at all; reusing that toast's "먼저 PAIR 판정을
    // 진행하세요" text here read as broken/confusing for an actual wrong
    // answer. Mirrors showMistake()'s overlay/counter but only clears the
    // pair row (clearPairBtns()), never the win-quiz slots, then re-renders
    // the pending PAIR row via retryFn so the trainee can try again.
    function showPairMistake(retryFn) {
      S.mistakes++;
      const mEl = $('bac-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      clearPairBtns();
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = `<div class="mistake-text">MISTAKE!</div>`;
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
    }

    function showInitialQuiz() {
      paintResultGrid('initial');
      setBtn('bac-result', checkBtnHtml('initial'));
      setBtn('bac-bh3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizInitial('draw-banker')">BANKER<br>DRAW</button>`);
      setBtn('bac-ph3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizInitial('draw-player')">PLAYER<br>DRAW</button>`);
      msg('Choose action:');
    }

    function showSpecialQuiz() {
      // Draw's done — bring the Pair row back the same way the win/draw
      // buttons below are being restored, showing the trainee's earlier
      // pick again (renderPairBtnsFinal(), not a fresh pending judgment).
      renderPairBtnsFinal();
      paintResultGrid('special');
      setBtn('bac-result', checkBtnHtml('special'));
      // Banker drew a 3rd card because Player stood (Player still has only 2 cards):
      // keep the PLAYER DRAW option visible so an over-draw attempt can still be caught.
      if (S.ph.length === 2) {
        setBtn('bac-ph3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizSpecial('draw-player')">PLAYER<br>DRAW</button>`);
      }
      msg('Which outcome?');
    }

    function showBankerDrawQuiz() {
      // Draw's done — bring the Pair row back the same way the win/draw
      // buttons below are being restored, showing the trainee's earlier
      // pick again (renderPairBtnsFinal(), not a fresh pending judgment).
      renderPairBtnsFinal();
      paintResultGrid('banker');
      setBtn('bac-result', checkBtnHtml('banker'));
      setBtn('bac-bh3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizBanker('draw-banker')">BANKER<br>DRAW</button>`);
      msg(`Player drew ${S.pThird.rank}${S.pThird.suit}. Banker action?`);
    }

    function getSpecialLabel(side) {
      const colors = { player: '#e01818', banker: '#c9a84c', tie: '#6ec864' };
      const color  = colors[side];
      if (side === 'tie') return { lines: ['TIE'], color };
      const pp = pts(S.ph), bp = pts(S.bh);
      if (side === 'banker') {
        const lines = ['BANKER WIN'];
        if (bp === 6 && S.bh.length === 2) lines.push('SMALL 6');
        if (bp === 6 && S.bh.length === 3) lines.push('BIG 6');
        return { lines, color };
      }
      // player win
      const lines = ['PLAYER WIN'];
      if (pp === 7 && bp === 6) {
        lines.push('SUPER 7' + (S.resultPicks.superPayout ? ` (${S.resultPicks.superPayout})` : ''));
      }
      else if (pp === 7 && S.ph.length === 2)             lines.push('SMALL 7');
      else if (pp === 7 && S.ph.length === 3)             lines.push('BIG 7');
      return { lines, color };
    }

    function doPlayerDraw(onDone) {
      addCard(S.ph, 'bac-ph3', () => {
        S.pThird = S.ph[S.ph.length - 1];
        onDone();
      }, 'bac-p3', true);
    }

    function doBankerDraw(onDone) {
      addCard(S.bh, 'bac-bh3', onDone, 'bac-b3', true);
    }

    function announceWinner(side) {
      S.winner = side;
      S.score++;
      S.rounds++;
      $('bac-score').textContent = S.score;
      $('bac-rounds').textContent = S.rounds;
      enableDraw();
      msg('');
      const cls = side === 'banker' ? 'banker-win' : side === 'player' ? 'player-win' : 'tie-win';
      const { lines } = getSpecialLabel(side);
      const [main, sub] = lines;
      const html = `<div class="bac-result-banner bac-win-over-divider ${cls}"><span class="bac-result-banner-main">${main}</span>${sub ? `<span class="bac-result-banner-sub">${sub}</span>` : ''}</div>`;
      setBtn('bac-b-btn-top', '');
      setBtn('bac-p-btn-top', '');
      setBtn('bac-tie-btn', html);
      // enableDraw() above already swapped the Pair row for the NEXT HAND
      // button (see showNextBtn()) now that the hand is over.
    }

    function buildPayPanel() {
      const w = S.winner;
      const winLabel = w === 'player' ? 'PLAYER WIN' : w === 'banker' ? 'BANKER WIN' : 'TIE';
      const seatRows = S.bets.map((b, i) => {
        if (!b.active) return '';
        const isWin = w === 'tie' || b.side === w;
        const action = w === 'tie' ? 'Pay 8:1' : isWin ? 'Pay 1:1' : 'Take';
        return `<div class="pay-seat-row ${isWin ? 'win-row' : 'take-row'}">
          <span class="psr-num">P${i+1}</span>
          <span class="psr-side ${b.side}">${b.side === 'player' ? 'PLAYER' : 'BANKER'}</span>
          <span class="psr-bet">${b.amount.toLocaleString()}</span>
          <span class="psr-action">${action}</span>
        </div>`;
      }).join('');

      const calcRows = DENOMS.map(d => `
        <div class="pay-calc-row">
          <div class="pay-chip-btn" style="background:${d.color}">${d.label}</div>
          <div class="pay-calc-mid">
            <span class="pay-denom-label">${d.value.toLocaleString()}원</span>
            <input type="number" min="0" value="0" inputmode="numeric"
                   class="pay-qty-input" data-val="${d.value}"
                   oninput="Sims.baccarat.calcTotal()">
          </div>
          <div class="pay-calc-sub" id="pay-sub-${d.value}">= 0</div>
        </div>`).join('');

      return `<div class="pay-panel-inner">
        <div class="pay-panel-header">
          <span class="pay-panel-title">💰 Pay Time</span>
          <span class="pay-winner-badge ${w}-win">${winLabel}</span>
        </div>
        <div class="pay-seats-section">${seatRows}</div>
        <div class="pay-divider"></div>
        <div class="pay-calc-section">
          <div class="pay-calc-heading">Chip Calculator</div>
          ${calcRows}
          <div class="pay-grand-total">
            Total: <span id="pay-grand" class="pay-grand-num">0원</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" style="margin-top:.8rem" onclick="Sims.baccarat.deal()">Next Hand</button>
      </div>`;
    }

    // ---- STEP 1: COUNTING TRAINING ----
    // Beginner drill for the point system itself (0-9, units digit only)
    // — NOT the win/draw judging Step 3 (below) teaches. Shows 2 or 3
    // cards on one side only (Player XOR Banker — the existing always-
    // visible BANKER/PLAYER zone labels are what tell the trainee which
    // one, no extra prompt needed) and asks for the resulting total via
    // a 3-choice multiple choice. Reuses bval()/pts() above verbatim so
    // the "correct" answer can never drift from Step 3's own scoring.
    function bjVal(c) {
      // Blackjack-style values (A=11, 10/J/Q/K=10) — one of the standard
      // beginner mix-ups this drill's wrong answers are built from,
      // since baccarat's are A=1, 10/J/Q/K=0 (bval() above).
      if (['10','J','Q','K'].includes(c.rank)) return 10;
      if (c.rank === 'A') return 11;
      return +c.rank;
    }
    function genCountQuiz() {
      if (S.deck.length < 5) S.deck = createBacDeck();
      // Real Baccarat draw rule (not just "not a natural"): PLAYER draws a
      // 3rd card only on a 2-card total of 0-5, standing on 6/7 (and, per
      // the earlier natural-8/9 fix, on a natural too — but 8/9 already
      // fall outside 0-5, so one <=5 check now covers both). BANKER's own
      // rule is conditional on Player's 3rd card in the full game, but
      // collapses to that EXACT same "draws 0-5, stands 6/7" table
      // whenever Player stood — which is always true of any Banker hand
      // this drill can show, since it only ever displays ONE side's 2/3
      // cards in isolation and never claims anything about the other
      // side's hand. So a hand this drill generates is never a real-rule
      // violation regardless of side: totals 6/7 (previously wrongly
      // allowed a 3rd card here — e.g. 6+A=7 already stands, no draw
      // possible) now correctly force a 2-card hand for BOTH sides, not
      // just naturals.
      const firstTwo = [S.deck.pop(), S.deck.pop()];
      const canDrawThird = pts(firstTwo) <= 5;
      const handSize = (canDrawThird && Math.random() < 0.5) ? 3 : 2;
      const cards = handSize === 3 ? [...firstTwo, S.deck.pop()] : firstTwo;
      // Which zone the hand is dealt into (Player XOR Banker) also
      // decides its 3rd-card layout for free, since that's exactly what
      // Views.baccaratSim()'s markup already encodes: PLAYER's third
      // slot (#bac-ph3) sits AFTER its 2-card wrap — pattern A,
      // [Card1][Card2][Third] — while BANKER's (#bac-bh3) sits BEFORE
      // it — pattern B, [Third][Card1][Card2]. Randomizing `side` here
      // is therefore also what randomizes which pattern the trainee
      // sees, hand to hand — no separate pattern flag needed.
      const side = Math.random() < 0.5 ? 'player' : 'banker';
      const correct = pts(cards);
      const vals = cards.map(bval);
      const rawSum = vals.reduce((a, b) => a + b, 0);
      const bjSum = cards.reduce((s, c) => s + bjVal(c), 0);
      // Wrong-answer candidates, each a real beginner mistake rather than
      // a random number: the raw (un-dropped) sum, the blackjack-style
      // sum, any single card's value alone (forgetting the others
      // exist), and — 3-card hands only — the 2-card total with the
      // drawn 3rd card forgotten entirely. Falls back to a random 0-9
      // filler only if a hand doesn't produce enough distinct mistakes
      // on its own.
      const cand = new Set();
      [rawSum, bjSum, ...vals].forEach(x => { if (x !== correct) cand.add(x); });
      if (handSize === 3) {
        const ignoreThird = pts(cards.slice(0, 2));
        if (ignoreThird !== correct) cand.add(ignoreThird);
      }
      while (cand.size < 2) {
        const r = Math.floor(Math.random() * 10);
        if (r !== correct) cand.add(r);
      }
      const options = shuffle([correct, ...shuffle([...cand]).slice(0, 2)]);
      return { cards, side, correct, options };
    }
    function renderCountQuiz() {
      const q = genCountQuiz();
      S.countQuiz = q;
      const [c1, c2, c3] = q.cards;
      const mainHtml = cardHTML(c1) + cardHTML(c2);
      // Third card: same sideways-rotated presentation Step 3 deals into
      // this exact slot (.bac-card-sideways wrapping a .flip-card, see
      // doPlayerDraw()/doBankerDraw() above) — just rendered statically
      // instead of via the flip-reveal animation, to match how this
      // drill already shows its other cards.
      const thirdHtml = c3 ? `<div class="bac-card-sideways"><div class="flip-card">${cardHTML(c3)}</div></div>` : '';
      $('bac-ph').innerHTML = q.side === 'player' ? mainHtml : '';
      $('bac-bh').innerHTML = q.side === 'banker' ? mainHtml : '';
      const ph3e = $('bac-ph3'); if (ph3e) ph3e.innerHTML = q.side === 'player' ? thirdHtml : '';
      const bh3e = $('bac-bh3'); if (bh3e) bh3e.innerHTML = q.side === 'banker' ? thirdHtml : '';
      // This drill has no Player/Banker concept — `side` here only still
      // picks which zone's DOM slot-order (see genCountQuiz()'s own
      // comment) renders the 3rd card on which end. .bac-counting-mode
      // (set by startCounting()) hides the PLAYER/BANKER labels and the
      // center divider via CSS; .bac-zone-active is what that same CSS
      // uses to hide the OTHER (unused) zone entirely and center the
      // used one across the full width, so only one card group ever
      // shows, always in the middle of the screen.
      const playerZone = document.querySelector('.bac-player-zone');
      const bankerZone = document.querySelector('.bac-banker-zone');
      if (playerZone) playerZone.classList.toggle('bac-zone-active', q.side === 'player');
      if (bankerZone) bankerZone.classList.toggle('bac-zone-active', q.side === 'banker');
      clearInlineBtns();
      clearPairBtns();
      const fbE = $('bac-count-feedback'); if (fbE) fbE.innerHTML = '';
      renderCountOptions();
    }
    // Draws the 3 option buttons for the CURRENT S.countQuiz without
    // touching cards/S.countQuiz itself — used both for a fresh question
    // (renderCountQuiz() above) and to re-arm the same question after a
    // wrong answer (answerCount() below), so a mistake never changes the
    // hand the trainee is being asked about.
    function renderCountOptions() {
      const q = S.countQuiz;
      if (!q) return;
      // Reuses the BIG6/TIE/SMALL6 row's 3 cells as generic option
      // slots — same cells, same capsule shape/sizing Step 3 already
      // uses there, just this drill's own class/handler instead of
      // BIG6/TIE/SMALL6's.
      const cellIds = ['bac-exp-big6', 'bac-tie-btn', 'bac-exp-small6'];
      q.options.forEach((opt, i) => {
        setBtn(cellIds[i], `<button class="bac-count-opt-btn bac-felt-circle bac-circle-btn" onclick="Sims.baccarat.answerCount(${opt})">${opt}</button>`);
      });
    }
    function startCounting() {
      S.deck = createBacDeck();
      S.rounds = 0; S.score = 0; S.mistakes = 0;
      $('bac-rounds').textContent = S.rounds;
      $('bac-score').textContent = S.score;
      $('bac-mistakes').textContent = S.mistakes;
      const pp = $('bac-pay-panel'); if (pp) pp.style.display = 'none';
      // .bac-counting-mode (style.css) strips PLAYER/BANKER labels + the
      // center divider and enlarges the card size — this drill is pure
      // "read the cards, name the total", not a Player-vs-Banker layout.
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.add('bac-counting-mode');
      renderCountQuiz();
    }

    // ---- STEP 2 (DRAWING) ----
    // A dedicated "does this hand need a 3rd card, and which side draws
    // it" drill — NOT a trimmed-down Step 3. It reuses Step 3's exact
    // initial-4-card deal (dealSequence() into the same #bac-ph/#bac-bh
    // targets), the same card rendering, and the same bankerRule()/pts()
    // draw-rule math and doPlayerDraw()/doBankerDraw() 3rd-card
    // animations quizInitial()/quizBanker() (Step 3) already use — but
    // the trainee only ever judges PLAYER WIN/PLAYER DRAW/BANKER DRAW/
    // BANKER WIN — a real winner/side-bet/PAIR guess is never asked.
    // .bac-exp-grid (PAIR row + WIN/TIE/BIG6/etc + CONFIRM) is hidden
    // wholesale for this mode (see .bac-drawing-mode in style.css) —
    // this drill has none of that; PLAYER WIN/BANKER WIN below are a
    // separate, purpose-built pair (.bac-draw-win-anchor, floating above
    // each zone's own label), not the hidden grid's own buttons.
    function drawCorrectChoiceInitial() {
      const pp = pts(S.ph), bp = pts(S.bh);
      if (pp >= 8 || bp >= 8) return 'stand'; // natural — hand's already over
      if (pp <= 5) return 'draw-player';
      if (bankerRule(bp, null)) return 'draw-banker';
      return 'stand'; // both hands stand pat, no natural
    }
    function drawCorrectChoiceStage2() {
      // Reached only after a correct Player draw — Banker's decision now
      // depends on Player's actual 3rd card (bankerRule's full table).
      return bankerRule(pts(S.bh), S.pThird) ? 'draw-banker' : 'stand';
    }
    function drawActionBtnHtml(choice, label) {
      return `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.drawAction('${choice}')">${label}</button>`;
    }
    // PLAYER WIN / BANKER WIN reuse Step 3's exact WIN-button markup/
    // classes (see winBtns() above) — same oval shape/color/style, just
    // this drill's own handler and no dim()/pressed() state (there's
    // nothing to toggle here, CHECK doesn't exist in this mode).
    function drawWinBtnHtml(side) {
      const cls = side === 'banker' ? 'btn-bac-banker' : 'btn-bac-player';
      const label = side === 'banker' ? 'BANKER WIN' : 'PLAYER WIN';
      // Passes the clicked element through so drawAction() can flash
      // THIS specific button green on a correct 'stand' call — both WIN
      // buttons are live at once now (see showDrawJudgment() below), so
      // there's no longer a single fixed "the" win cell to look up.
      return `<button class="${cls} bac-inline-btn bac-win-oval" onclick="Sims.baccarat.drawAction('stand', this)">${label}</button>`;
    }
    // Initial judgment: BOTH PLAYER WIN and BANKER WIN show from the
    // start, above their own zone, alongside PLAYER DRAW/BANKER DRAW in
    // the 3rd-card slots — explicit ask ("처음부터 PLAYER WIN, BANKER WIN
    // 버튼은 나와있어야해"). Whichever is clicked, correctness is still
    // decided purely by drawCorrectChoiceInitial() — clicking the "wrong"
    // WIN when a draw was actually owed is just a plain MISTAKE (choice
    // 'stand' fails to match a 'draw-*' correct answer), no special
    // casing needed; when the correct answer genuinely is 'stand' (a
    // natural, or both hands settling), EITHER oval is a legitimate
    // correct pick since both hands truly stand simultaneously.
    function showDrawJudgment() {
      setBtn('bac-bh3', drawActionBtnHtml('draw-banker', 'BANKER<br>DRAW'));
      setBtn('bac-ph3', drawActionBtnHtml('draw-player', 'PLAYER<br>DRAW'));
      setBtn('bac-draw-player-win', drawWinBtnHtml('player'));
      setBtn('bac-draw-banker-win', drawWinBtnHtml('banker'));
    }
    // Stage 2 (only after Player actually drew): Player's 3rd-card slot
    // now holds the real revealed card, not a button, so PLAYER WIN no
    // longer applies — only BANKER WIN vs BANKER DRAW remain possible.
    function showBankerDrawJudgment() {
      setBtn('bac-bh3', drawActionBtnHtml('draw-banker', 'BANKER<br>DRAW'));
      setBtn('bac-draw-banker-win', drawWinBtnHtml('banker'));
      setBtn('bac-draw-player-win', '');
    }
    function finishDrawingHand() {
      S.score++; S.rounds++;
      $('bac-score').textContent = S.score;
      $('bac-rounds').textContent = S.rounds;
      S.drawHandTimer = setTimeout(() => dealDrawingHand(), 700);
    }
    function dealDrawingHand() {
      if (S.deck.length < 20) S.deck = createBacDeck();
      S.ph = []; S.bh = []; S.pThird = null;
      $('bac-ph').innerHTML = ''; $('bac-bh').innerHTML = '';
      const ph3e = $('bac-ph3'); if (ph3e) ph3e.innerHTML = '';
      const bh3e = $('bac-bh3'); if (bh3e) bh3e.innerHTML = '';
      setBtn('bac-draw-banker-win', ''); setBtn('bac-draw-player-win', '');
      const cards = [S.deck.pop(), S.deck.pop(), S.deck.pop(), S.deck.pop()];
      // Same deal order/target mapping as Step 3's deal(): cards[0]=P2,
      // cards[1]=B1, cards[2]=P1, cards[3]=B2, visual order 4→2→3→1.
      S.ph = [cards[2], cards[0]];
      S.bh = [cards[1], cards[3]];
      dealSequence(cards, ['bac-ph','bac-bh','bac-ph','bac-bh'], () => showDrawJudgment());
    }
    function startDrawing() {
      S.deck = createBacDeck();
      S.rounds = 0; S.score = 0; S.mistakes = 0;
      $('bac-rounds').textContent = S.rounds;
      $('bac-score').textContent = S.score;
      $('bac-mistakes').textContent = S.mistakes;
      const pp = $('bac-pay-panel'); if (pp) pp.style.display = 'none';
      // Unlike .bac-counting-mode, this mode does NOT hide the PLAYER/
      // BANKER labels or the field divider — explicit ask: keep both
      // zones and the real table layout exactly as Step 3 shows them.
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.add('bac-drawing-mode');
      dealDrawingHand();
    }

    // Shared teardown for switching INTO any step, from any other step —
    // clears every step's own leftover cards/buttons/mode classes so a
    // fresh start*()/deal() never has to guess what the previous step
    // left behind. Replaces what used to be a one-off block inlined into
    // selectStep()'s n===3 branch (back when 1↔3 were the only real
    // transitions); now that all 3 steps are real, every direction needs
    // the same cleanup.
    function resetStepDom() {
      if (S.drawHandTimer) { clearTimeout(S.drawHandTimer); S.drawHandTimer = null; }
      $('bac-ph').innerHTML = ''; $('bac-bh').innerHTML = '';
      const ph3e = $('bac-ph3'); if (ph3e) ph3e.innerHTML = '';
      const bh3e = $('bac-bh3'); if (bh3e) bh3e.innerHTML = '';
      setBtn('bac-draw-banker-win', ''); setBtn('bac-draw-player-win', '');
      const fbE = $('bac-count-feedback'); if (fbE) fbE.innerHTML = '';
      const tbl = document.querySelector('.baccarat-table');
      if (tbl) tbl.classList.remove('bac-counting-mode', 'bac-drawing-mode');
      document.querySelectorAll('.bac-banker-zone, .bac-player-zone').forEach(z => z.classList.remove('bac-zone-active'));
      clearInlineBtns(); clearPairBtns(); setPairPhaseFocus(false);
    }

    return {
      init(isRestart) {
        const wasMidHand = isRestart && S && S.ph && S.ph.length > 0 && S.winner === null;
        const keepRounds   = isRestart && S ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        const keepScore    = isRestart && S ? S.score    : 0;
        const keepMistakes = isRestart && S ? S.mistakes : 0;
        // navigate()/reload() always re-render Views.baccaratSim() from
        // scratch, landing on the "pick a STEP" empty state (no step
        // pre-selected — explicit ask) regardless of which step was
        // active before; only in-page selectStep() taps pick a step.
        // Restart (↺) is only ever reachable from within Step 3 itself,
        // so it still goes straight back into Step 3, same as before.
        S = { deck: createBacDeck(), ph: [], bh: [], pThird: null, step: isRestart ? 3 : null,
              rounds: keepRounds, score: keepScore, mistakes: keepMistakes, winner: null, bets: [] };
        $('bac-rounds').textContent = S.rounds;
        $('bac-score').textContent = S.score;
        $('bac-mistakes').textContent = S.mistakes;
        if (isRestart) {
          // In-app restart: skip the START/Next Hand button screen and deal right away.
          this.deal();
        } else {
          showNoStepState();
        }
      },

      // All 3 steps are real now (2026-09-02 — STEP 2 was a placeholder
      // toast before). Every transition shows a one-time showStepIntro()
      // overlay (title + description, fade in/hold/fade out) BEFORE the
      // step's actual setup runs — "매 문제마다 안내 문구를 표시하지 않고...
      // STEP 변경 시에만 1회 표시". Tab highlighting/S.step update
      // immediately on click, not after the overlay, so a repeat click on
      // the same tab is still correctly blocked by the guard below even
      // while the overlay is still showing; only the actual content
      // rebuild (resetStepDom() + startCounting()/startDrawing()/deal())
      // is deferred into the overlay's onDone callback.
      selectStep(n) {
        hideNoStepState();
        if (n === S.step) return;
        S.step = n;
        [1, 2, 3].forEach(i => {
          const b = $(`bac-step-btn-${i}`);
          if (b) b.classList.toggle('bac-step-active', i === n);
        });
        const intro = {
          1: ['STEP 1 • COUNTING', '현재 카드의 카운팅 값을 계산하여<br>정답을 선택하세요.'],
          2: ['STEP 2 • DRAWING', '플레이어 또는 뱅커의<br>드로우 여부를 판단하세요.'],
          3: ['STEP 3 • FULL SIMULATION', '실제 바카라 진행 절차를 따라<br>게임을 시뮬레이션하세요.'],
        }[n];
        showStepIntro(intro[0], intro[1], () => {
          resetStepDom();
          if (n === 1) { startCounting(); return; }
          if (n === 2) { startDrawing(); return; }
          // n === 3: reset Step 3's state and deal immediately (no START
          // button — see this.deal() below). Deliberately NOT
          // this.init(false) anymore — that now lands on the "pick a
          // STEP" empty state (step:null), which would immediately undo
          // the very selection this callback exists to fulfill. Same
          // reset init() itself does on a truly fresh entry, just
          // inlined here with step hardcoded to 3.
          S = { deck: createBacDeck(), ph: [], bh: [], pThird: null, step: 3,
                rounds: 0, score: 0, mistakes: 0, winner: null, bets: [] };
          $('bac-rounds').textContent = S.rounds;
          $('bac-score').textContent = S.score;
          $('bac-mistakes').textContent = S.mistakes;
          this.deal();
        });
      },

      drawAction(choice, btnEl) {
        const stage2 = S.ph.length === 3;
        const correct = stage2 ? drawCorrectChoiceStage2() : drawCorrectChoiceInitial();
        if (choice !== correct) {
          // OVER DRAW only fits when the correct call was to stand pat
          // and the trainee tried to draw anyway — same distinction
          // quizInitial() (Step 3) makes.
          const isOverDraw = choice.startsWith('draw-') && correct === 'stand';
          showMistake(() => (stage2 ? showBankerDrawJudgment() : showDrawJudgment()), isOverDraw ? 'OVER DRAW' : 'MISTAKE!');
          return;
        }
        if (correct === 'stand') {
          // Nothing to animate — disable every option (a hand can sit
          // here for the whole 700ms auto-advance window, unlike the
          // draw branches below which clear their buttons immediately)
          // and flash whichever WIN button was ACTUALLY clicked (both
          // PLAYER WIN and BANKER WIN are live simultaneously at the
          // initial stage — either is a legitimate correct pick when the
          // hand genuinely stands pat, so there's no single fixed cell
          // to look up; btnEl, passed from the oval's own onclick, is
          // the real source of truth here).
          [$('bac-bh3'), $('bac-ph3'), $('bac-draw-banker-win'), $('bac-draw-player-win')].forEach(el => {
            if (el) el.querySelectorAll('button').forEach(b => b.disabled = true);
          });
          if (btnEl) btnEl.classList.add('bac-draw-correct');
          finishDrawingHand();
          return;
        }
        $('bac-bh3').innerHTML = ''; $('bac-ph3').innerHTML = '';
        setBtn('bac-draw-banker-win', ''); setBtn('bac-draw-player-win', '');
        if (correct === 'draw-player') {
          doPlayerDraw(() => showBankerDrawJudgment());
        } else {
          doBankerDraw(() => finishDrawingHand());
        }
      },

      // Correct answers briefly highlight the chosen button green, then
      // auto-advance to a brand-new hand (Score/Rounds++) — no NEXT HAND
      // click. Wrong answers use the exact same MISTAKE overlay as Step 3
      // (showMistake(), Mistakes++) but retry the SAME hand/question —
      // S.countQuiz is deliberately left untouched (only cleared on a
      // correct answer) and the retry calls renderCountOptions() instead
      // of renderCountQuiz(), so the cards on screen never change and the
      // trainee must answer the same hand correctly before moving on.
      answerCount(value) {
        if (!S.countQuiz) return;
        const correct = S.countQuiz.correct;
        if (value === correct) {
          S.countQuiz = null;
          S.score++; S.rounds++;
          $('bac-score').textContent = S.score;
          $('bac-rounds').textContent = S.rounds;
          document.querySelectorAll('.bac-count-opt-btn').forEach(b => {
            b.disabled = true;
            if (+b.textContent === correct) b.classList.add('bac-count-opt-correct');
          });
          const fbE = $('bac-count-feedback'); if (fbE) fbE.innerHTML = '✓ CORRECT!';
          setTimeout(() => renderCountQuiz(), 700);
        } else {
          showMistake(() => renderCountOptions());
        }
      },

      deal() {
        if (S.deck.length < 20) S.deck = createBacDeck();
        S.ph = []; S.bh = []; S.pThird = null; S.winner = null;
        S.pairPicked = { banker: false, player: false, none: false };
        S.pairDone = false;
        S.initialDealRevealed = false;
        S.resultPicks = { winner: null, special: null, super7: false, superPayout: null };
        this.closeSuperPayoutPopup();
        disableDraw();

        $('bac-ph').innerHTML   = '';
        $('bac-bh').innerHTML   = '';
        const ph3e = $('bac-ph3'); if (ph3e) ph3e.innerHTML = '';
        const bh3e = $('bac-bh3'); if (bh3e) bh3e.innerHTML = '';
        $('bac-result').textContent = '';
        const pp = $('bac-pay-panel');
        if (pp) pp.style.display = 'none';
        clearInlineBtns();
        clearPairBtns();
        setPairPhaseFocus(false);

        S.bets = generateBets();
        renderBets();

        if (Math.random() < 0.4) pushForcedScenario();
        const cards = [S.deck.pop(), S.deck.pop(), S.deck.pop(), S.deck.pop()];
        // cards[0]=P2(pos4), cards[1]=B1(pos2), cards[2]=P1(pos3), cards[3]=B2(pos1)
        S.ph = [cards[2], cards[0]]; // [P1, P2]
        S.bh = [cards[1], cards[3]]; // [B1, B2]

        msg('Dealing...');

        // Deal visual order: 4→2→3→1 (P2, B1, P1, B2)
        dealSequence(cards, ['bac-ph','bac-bh','bac-ph','bac-bh'], () => {
          S.initialDealRevealed = true;
          showInitialQuiz();
          showPairQuiz();
        });
      },

      quizPair(side) {
        if (!S.initialDealRevealed) { showCardsNotRevealedToast(); return; }
        const bPair = S.bh[0].rank === S.bh[1].rank;
        const pPair = S.ph[0].rank === S.ph[1].rank;
        if (side === 'no-pair') {
          if (bPair || pPair) { showPairMistake(renderPairBtns); return; }
          S.pairDone = true;
          S.pairPicked.none = true;
          renderPairBtnsFinal();
          setPairPhaseFocus(false);
          return;
        }
        if (side === 'banker-pair') {
          if (!bPair) { showPairMistake(renderPairBtns); return; }
          S.pairPicked.banker = true;
        } else if (side === 'player-pair') {
          if (!pPair) { showPairMistake(renderPairBtns); return; }
          S.pairPicked.player = true;
        }
        const done = (!bPair || S.pairPicked.banker) && (!pPair || S.pairPicked.player);
        if (done) {
          S.pairDone = true;
          renderPairBtnsFinal();
          setPairPhaseFocus(false);
        } else {
          renderPairBtns();
        }
      },

      quizInitial(choice) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        const pp = pts(S.ph), bp = pts(S.bh);
        let correctChoice;
        if (pp >= 8 || bp >= 8) {
          correctChoice = 'win';
        } else if (pp <= 5) {
          correctChoice = 'draw-player';
        } else if (bankerRule(bp, null)) {
          correctChoice = 'draw-banker';
        } else {
          correctChoice = 'win';
        }
        if (choice !== correctChoice) {
          // OVER DRAW only fits when nobody actually needed a third card
          // (correctChoice === 'win') and the trainee tried to draw anyway.
          // Picking the wrong side's DRAW when a draw genuinely was owed
          // (just to the other hand) is a rule mistake, not an over-draw.
          const isOverDraw = choice.startsWith('draw-') && correctChoice === 'win';
          showMistake(() => showInitialQuiz(), isOverDraw ? 'OVER DRAW' : 'MISTAKE!');
          return;
        }
        // Any un-submitted winner/special picks from this stage don't
        // carry over to the next quiz screen — repaint (still 'initial'
        // source, the only one live right now) so the reset shows up
        // instead of a stale highlight, then dim everything for the
        // draw instead of clearing it away (see setDrawPhaseFocus()).
        S.resultPicks = { winner: null, special: null, super7: false, superPayout: null };
        paintResultGrid('initial');
        setDrawPhaseFocus(true);
        const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
        const ph3 = $('bac-ph3'); if (ph3) ph3.innerHTML = '';
        if (choice === 'draw-player') {
          doPlayerDraw(() => { setDrawPhaseFocus(false); showBankerDrawQuiz(); });
        } else {
          doBankerDraw(() => { setDrawPhaseFocus(false); showSpecialQuiz(); });
        }
      },

      quizBanker() {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        const needsDraw = bankerRule(pts(S.bh), S.pThird);
        if (!needsDraw) { showMistake(() => showBankerDrawQuiz(), 'OVER DRAW'); return; }
        // See quizInitial() above for why this repaints instead of
        // clearing before dimming for the draw.
        S.resultPicks = { winner: null, special: null, super7: false, superPayout: null };
        paintResultGrid('banker');
        setDrawPhaseFocus(true);
        const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
        doBankerDraw(() => { setDrawPhaseFocus(false); showSpecialQuiz(); });
      },

      quizSpecial(choice) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        if (choice === 'draw-player') {
          showMistake(() => showSpecialQuiz(), 'OVER DRAW');
        }
      },

      // Selecting a WIN/TIE/PLAYER WIN or a special (BIG6/.../SUPER SMALL7)
      // button no longer judges anything by itself — it just toggles that
      // pick on/off (radio-style within its own group) and repaints the
      // row so the current selection is visible. CHECK is the only thing
      // that submits (see checkResult() below).
      toggleWinnerPick(label, source) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        if (!handFullyDrawn()) { showCardsNotRevealedToast(); return; }
        S.resultPicks.winner = S.resultPicks.winner === label ? null : label;
        refreshResultBtns(source);
      },

      toggleSpecialPick(label, source) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        if (!handFullyDrawn()) { showCardsNotRevealedToast(); return; }
        if (S.resultPicks.winner !== 'player-win' && S.resultPicks.winner !== 'banker-win') { showMainResultRequiredToast(); return; }
        S.resultPicks.special = S.resultPicks.special === label ? null : label;
        refreshResultBtns(source);
      },

      // SUPER 7 is a single result, not a BIG/SMALL choice — clicking it
      // opens a small payout popup instead of toggling directly. Picking a
      // ratio only STAGES it (S.super7Staged) and re-renders the popup with
      // that ratio highlighted — it doesn't touch S.resultPicks or close
      // the popup; tapping the same staged ratio again un-stages it
      // (stageSuperPayout toggles). Only 선택완료 (confirmSuperPayout)
      // commits the staged ratio into S.resultPicks.super7/superPayout and
      // closes. 닫기 (dismissSuper7Popup) discards the staged draft and
      // closes — but if nothing was staged at that moment (never picked,
      // or toggled off), it ALSO clears any already-committed
      // super7/superPayout, so closing with no ratio staged always leaves
      // SUPER7 fully unpicked, never a stale committed pick. This
      // stage-then-confirm flow replaced the old immediate-commit-on-click
      // behavior.
      // S.resultPicks.super7 is independent of .special (BIG6/SMALL6/
      // BIG7/SMALL7) — real Baccarat treats Super 7 as its own side bet,
      // not mutually exclusive with Big/Small 7, so both can be required
      // at once (see checkResult()'s correctSuper7).
      pickSuper7(source) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        if (!handFullyDrawn()) { showCardsNotRevealedToast(); return; }
        if (S.resultPicks.winner !== 'player-win' && S.resultPicks.winner !== 'banker-win') { showMainResultRequiredToast(); return; }
        const tbl = document.querySelector('.baccarat-table');
        if (!tbl) return;
        this.closeSuperPayoutPopup();
        S.super7Staged = S.resultPicks.super7 ? S.resultPicks.superPayout : null;
        const ov = document.createElement('div');
        ov.className = 'super7-payout-overlay';
        ov.id = 'super7-payout-overlay';
        tbl.appendChild(ov);
        this.renderSuper7Popup(source);
      },

      renderSuper7Popup(source) {
        const ov = document.getElementById('super7-payout-overlay');
        if (!ov) return;
        const ratioBtn = (ratio) =>
          `<button class="super7-payout-btn${S.super7Staged === ratio ? ' bac-result-picked' : ''}" onclick="Sims.baccarat.stageSuperPayout('${ratio}','${source}')">${ratio}</button>`;
        ov.innerHTML = `
          <div class="super7-payout-card">
            <div class="super7-payout-title">SUPER 7 PAYOUT</div>
            <div class="super7-payout-row">
              ${ratioBtn('30:1')}
              ${ratioBtn('40:1')}
              ${ratioBtn('100:1')}
            </div>
            <div class="super7-payout-footer">
              <button class="super7-payout-confirm"${S.super7Staged ? '' : ' disabled'} onclick="Sims.baccarat.confirmSuperPayout('${source}')">선택완료</button>
              <button class="super7-payout-close" onclick="Sims.baccarat.dismissSuper7Popup('${source}')">닫기</button>
            </div>
          </div>`;
      },

      // Tapping an already-staged ratio again un-stages it (toggle off),
      // same as tapping any other unselected ratio stages it — 선택완료
      // stays disabled and no ratio shows picked until one is staged again.
      stageSuperPayout(ratio, source) {
        S.super7Staged = S.super7Staged === ratio ? null : ratio;
        this.renderSuper7Popup(source);
      },

      confirmSuperPayout(source) {
        if (!S.super7Staged) return;
        S.resultPicks.super7 = true;
        S.resultPicks.superPayout = S.super7Staged;
        this.closeSuperPayoutPopup();
        refreshResultBtns(source);
      },

      // 닫기's own handler (not the internal cleanup closeSuperPayoutPopup
      // below, which pickSuper7 also calls just to clear a leftover overlay
      // before reopening — that path must NOT touch S.resultPicks). If
      // nothing is staged at the moment 닫기 is pressed — either the ratio
      // was toggled off via stageSuperPayout, or nothing was ever picked —
      // treat SUPER7 as fully unpicked: clear any already-committed
      // super7/superPayout too, not just the in-popup draft, so the SUPER7
      // button/highlight/payout tag all revert exactly as if SUPER7 had
      // never been picked. If a ratio IS still staged, 닫기 keeps its
      // original behavior (discard the staged draft, leave whatever was
      // previously committed untouched).
      dismissSuper7Popup(source) {
        if (!S.super7Staged) {
          S.resultPicks.super7 = false;
          S.resultPicks.superPayout = null;
        }
        this.closeSuperPayoutPopup();
        refreshResultBtns(source);
      },

      closeSuperPayoutPopup() {
        const ov = document.getElementById('super7-payout-overlay');
        if (ov) ov.remove();
        S.super7Staged = null;
      },

      // CHECK is always enabled and never hints at correctness — pressing
      // it with nothing (or the wrong thing) selected is just a MISTAKE,
      // same as before. The correctness computation itself (needsDraw
      // checks, the `correct` label logic) is untouched from the old
      // quizWinFull(); only how an answer gets submitted changed.
      checkResult(source) {
        if (!S.pairDone) { showPairRequiredToast(); return; }
        if (!handFullyDrawn()) { showCardsNotRevealedToast(); return; }
        const pp = pts(S.ph), bp = pts(S.bh);
        if (source === 'initial') {
          const needsDrawP = !(pp >= 8 || bp >= 8) && pp <= 5;
          const needsDrawB = !(pp >= 8 || bp >= 8) && pp > 5 && bankerRule(bp, null);
          if (needsDrawP || needsDrawB) { showMistake(() => showInitialQuiz()); return; }
        } else if (source === 'banker') {
          if (bankerRule(bp, S.pThird)) { showMistake(() => showBankerDrawQuiz()); return; }
        }
        // `correct`: the winner + card-count-based special (banker-small6/
        // banker-big6/player-small7/player-big7), exactly as before.
        // `correctSuper7`: a SEPARATE, independent boolean — real Baccarat
        // treats Super 7 (banker wins... no, player wins 7 vs banker's 6)
        // as its own side bet, not mutually exclusive with Small/Big 7
        // (those are about card COUNT; Super 7 is about the point/rank
        // matchup) — so a hand can require BOTH player-small7 (or -big7)
        // AND super7 at once. This used to short-circuit to a single
        // 'super7' label that silently dropped the small7/big7 requirement
        // whenever bp===6 — fixed per explicit request.
        let correct;
        if (pp === bp) correct = 'tie';
        else if (bp > pp) {
          if (bp === 6 && S.bh.length === 2)      correct = 'banker-small6';
          else if (bp === 6 && S.bh.length === 3) correct = 'banker-big6';
          else                                     correct = 'banker-win';
        } else {
          if (pp === 7 && S.ph.length === 2)      correct = 'player-small7';
          else if (pp === 7 && S.ph.length === 3) correct = 'player-big7';
          else                                     correct = 'player-win';
        }
        const correctSuper7 = pp === 7 && bp === 6;
        const showQuiz = source === 'initial' ? showInitialQuiz
                       : source === 'banker'  ? showBankerDrawQuiz
                       : showSpecialQuiz;
        // The correct combination the trainee must have selected:
        // - plain tie/banker-win/player-win: just that winner, no special.
        // - banker-small6/banker-big6/player-small7/player-big7: BOTH the
        //   base winner AND the specific special (dealers need to catch
        //   the bonus condition, not just the winner).
        // - super7 (S.resultPicks.super7, independent of .special): must
        //   be selected with the payout ratio matching total card count
        //   (4→30:1, 5→40:1, 6→100:1) whenever correctSuper7 is true, and
        //   must NOT be selected when it's false — additive on top of
        //   whatever the base winner/special check above already requires.
        const { winner: uw, special: us, super7: usSuper7 } = S.resultPicks;
        let isCorrect;
        if (correct === 'tie' || correct === 'banker-win' || correct === 'player-win') {
          isCorrect = uw === correct && us === null;
        } else {
          const baseWinner = correct.startsWith('banker') ? 'banker-win' : 'player-win';
          isCorrect = uw === baseWinner && us === correct;
        }
        if (correctSuper7) {
          const totalCards = S.bh.length + S.ph.length;
          const correctPayout = totalCards === 4 ? '30:1' : totalCards === 5 ? '40:1' : '100:1';
          isCorrect = isCorrect && usSuper7 === true && S.resultPicks.superPayout === correctPayout;
        } else {
          isCorrect = isCorrect && !usSuper7;
        }
        if (!isCorrect) {
          // A wrong CONFIRM clears the WIN/TIE/BIG/SMALL/SUPER7 picks
          // (not just the DOM via showMistake()'s clearInlineBtns() —
          // that alone left S.resultPicks stale, so the retry repaint
          // showed the same wrong picks still pressed/selected). PAIR
          // state (S.pairPicked/S.pairDone) is untouched — the trainee
          // keeps their already-confirmed PAIR judgment and only re-picks
          // the main/option result.
          S.resultPicks = { winner: null, special: null, super7: false, superPayout: null };
          showMistake(showQuiz);
          return;
        }
        clearInlineBtns();
        if (source === 'initial') {
          const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
          const ph3 = $('bac-ph3'); if (ph3) ph3.innerHTML = '';
        } else if (source === 'banker') {
          const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
        } else if (source === 'special' && S.ph.length === 2) {
          const ph3 = $('bac-ph3'); if (ph3) ph3.innerHTML = '';
        }
        const side = correct === 'tie' ? 'tie' : correct.startsWith('banker') ? 'banker' : 'player';
        announceWinner(side);
      },

      openPay() {
        const panel = $('bac-pay-panel');
        if (panel) { panel.style.display = 'block'; panel.innerHTML = buildPayPanel(); }
        actions('');
      },

      calcTotal() {
        let grand = 0;
        document.querySelectorAll('.pay-qty-input').forEach(el => {
          const qty = parseInt(el.value) || 0;
          const val = parseInt(el.dataset.val);
          const sub = document.getElementById(`pay-sub-${val}`);
          const amount = qty * val;
          grand += amount;
          if (sub) sub.textContent = amount > 0 ? `= ${amount.toLocaleString()}` : '= 0';
        });
        const g = document.getElementById('pay-grand');
        if (g) g.textContent = grand.toLocaleString() + '원';
      },
    };
  })(),

  // ---- BACCARAT COMMISSION SIM ----
  baccaratPay: (() => {
    const COMM_CHIPS = [
      { key: '100M', val: 100_000_000, bg: '#c62828', fg: '#fff'    },
      { key: '10M',  val:  10_000_000, bg: '#1565c0', fg: '#fff'    },
      { key: '1M',   val:   1_000_000, bg: '#fdd835', fg: '#1a1a1a' },
      { key: '100K', val:     100_000, bg: '#212121', fg: '#fff'    },
      { key: '10K',  val:      10_000, bg: '#2e7d32', fg: '#fff'    },
      { key: '5K',   val:       5_000, bg: '#b5176b', fg: '#fff'    },
    ];
    const BET_CHIPS_MAIN  = [COMM_CHIPS[3], COMM_CHIPS[2]];        // 100K, 1M
    const BET_CHIPS_EXTRA = [COMM_CHIPS[3], COMM_CHIPS[2], COMM_CHIPS[1]]; // 100K, 1M, 10M
    // Display-only: formats a chip button's resulting amount (val*5 or
    // val*1) the same way COMM_CHIPS's own `key` strings already read
    // (e.g. 500_000_000 -> "500M"), so the +5/+1 buttons can show what
    // they actually add instead of a bare multiplier. Pure formatting —
    // does not feed into addChip()/S.bets/any real amount calculation.
    const fmtAmt = v => v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1_000 ? `${v / 1_000}K` : String(v);

    let S = {};
    const $ = id => document.getElementById(id);

    function generateBetChips() {
      const round = S.rounds;
      let chips, total, attempts = 0;
      do {
        let numDenoms, allow10kStack;
        if (S.mode === 'halfpay') {
          if (round <= 2) {
            numDenoms = 1; allow10kStack = false;
          } else if (round <= 4) {
            numDenoms = Math.random() < 0.65 ? 1 : 2; allow10kStack = false;
          } else if (round <= 7) {
            const r = Math.random();
            numDenoms = r < 0.35 ? 1 : r < 0.80 ? 2 : 3; allow10kStack = true;
          } else {
            const r = Math.random();
            numDenoms = r < 0.20 ? 1 : r < 0.55 ? 2 : 3; allow10kStack = true;
          }
        } else if (round <= 2) {
          numDenoms = 1;
          allow10kStack = false;
        } else if (round <= 4) {
          numDenoms = Math.random() < 0.6 ? 1 : 2;
          allow10kStack = false;
        } else {
          const r = Math.random();
          numDenoms = r < 0.4 ? 1 : r < 0.7 ? 2 : 3;
          allow10kStack = true;
        }
        const pool = numDenoms === 3 ? BET_CHIPS_EXTRA : BET_CHIPS_MAIN;
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, numDenoms);
        chips = {};
        picked.forEach(d => { chips[d.key] = 1 + Math.floor(Math.random() * 4); });
        if (allow10kStack && Math.random() < (S.mode === 'halfpay' ? 0.40 : 0.25)) {
          chips['10K'] = Math.random() < 0.5 ? 10 : 20;
        }
        total = Object.entries(chips).reduce((s, [k, c]) => s + (COMM_CHIPS.find(x => x.key === k)?.val ?? 0) * c, 0);
        attempts++;
      } while (total === S.lastTotal && attempts < 10);
      S.lastTotal = total;
      return chips;
    }

    function chipTotal(chips) {
      return Object.entries(chips).reduce((sum, [key, cnt]) => {
        return sum + (COMM_CHIPS.find(c => c.key === key)?.val ?? 0) * cnt;
      }, 0);
    }

    function neededKeysForTarget(target) {
      const needed = new Set();
      let rem = target;
      for (const c of COMM_CHIPS) {
        if (rem >= c.val) { needed.add(c.key); rem -= Math.floor(rem / c.val) * c.val; }
      }
      return needed;
    }

    let warnTimer = null;
    function showOrderWarning() {
      const w = $('bpay-order-warn');
      if (!w) return;
      const span = w.querySelector('span');
      if (span) { span.style.animation = 'none'; void span.offsetWidth; span.style.animation = ''; }
      w.style.display = 'flex';
      clearTimeout(warnTimer);
      warnTimer = setTimeout(() => {
        w.style.display = 'none';
        COMM_CHIPS.forEach(c => { const inp = $(`bpay-ci-${c.key}`); if (inp) inp.value = '0'; });
        updateSpread();
      }, 2800);
    }

    function renderPositions() {
      S.bets.forEach((bet, i) => {
        const idx = i + 1;
        const bOval = $(`bpay-b-${idx}`);
        const bAmt  = $(`bpay-b-amt-${idx}`);
        if (!bOval || !bAmt) return;
        bOval.classList.add('has-bet');
        const sorted = Object.entries(bet.chips).sort((a, b) => {
          const va = COMM_CHIPS.find(c => c.key === a[0])?.val ?? 0;
          const vb = COMM_CHIPS.find(c => c.key === b[0])?.val ?? 0;
          return vb - va;
        });
        let discs = '';
        sorted.forEach(([key, cnt], groupIdx) => {
          const chip = COMM_CHIPS.find(c => c.key === key);
          const newGroup = groupIdx > 0;
          if (key === '10K' && cnt === 10) {
            discs += `<div class="bpay-chip-stack bpay-chip-stack-half${newGroup ? ' new-denom' : ''}" style="--stk-bg:${chip.bg};--stk-fg:${chip.fg}">` +
              `<div class="bpay-chip-stack-face"></div>` +
              `<div class="bpay-chip-stack-body"></div>` +
              `<div class="bpay-chip-stack-label"><span class="bpay-stack-key">${key}</span><span class="bpay-stack-cnt">×5</span></div>` +
              `</div>`;
            for (let j = 0; j < 5; j++) {
              discs += `<div class="bpay-chip-disc bpay-stack-spread-disc" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
            }
          } else if (key === '10K' && cnt > 10) {
            discs += `<div class="bpay-chip-stack bpay-chip-stack-full${newGroup ? ' new-denom' : ''}" style="--stk-bg:${chip.bg};--stk-fg:${chip.fg}">` +
              `<div class="bpay-chip-stack-face"></div>` +
              `<div class="bpay-chip-stack-body"></div>` +
              `<div class="bpay-chip-stack-label"><span class="bpay-stack-key">${key}</span><span class="bpay-stack-cnt">×${cnt}</span></div>` +
              `</div>`;
          } else {
            for (let j = 0; j < cnt; j++) {
              const sep = j === 0 && newGroup;
              discs += `<div class="bpay-chip-disc${sep ? ' new-denom' : ''}" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
            }
          }
        });
        bAmt.innerHTML = `<div class="bpay-chip-spread">${discs}</div>`;
        const _sp = bAmt.querySelector('.bpay-chip-spread');
        if (_sp) { const ow = _sp.offsetWidth, cw = bAmt.clientWidth; if (ow > cw && cw > 0) _sp.style.transform = `scale(${(cw / ow).toFixed(4)})`; }
      });
    }

    // Empty-tray hint (2026-08-27) — explicit ask, mirroring Option Bet's
    // own `.rpay-hint-text` (same class/position, in `#bpay-spread-section`
    // just like that page uses `#bside-spread-section`): shown only while
    // no chips are placed yet, per-mode message (Commission vs Half Pay —
    // this closure serves both, `S.mode` tells them apart). Chip-state
    // driven, not round-counter driven, so "reappears on a new round" and
    // "stays up across a round change" both just fall out of the same
    // check — see showCommTray()'s own comment for how a fresh round gets
    // back here with all chip inputs at 0.
    function updateSpread() {
      const section = $('bpay-spread-section');
      if (!section) return;
      let html = '';
      let anyPrev = false;
      COMM_CHIPS.forEach(c => {
        const cnt = parseInt($(`bpay-ci-${c.key}`)?.value) || 0;
        if (!cnt) return;
        for (let j = 0; j < cnt; j++) {
          let cls = 'spread-disc';
          if (j === 0 && anyPrev)        cls += ' spread-gap';
          else if (j > 0 && j % 5 === 0) cls += ' spread-gap5';
          html += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
          anyPrev = true;
        }
      });
      if (!html) {
        const hint = S.mode === 'halfpay'
          ? '하프페이를 적용한 페이아웃 칩을 세팅하세요'
          : '5% 커미션을 제외한 페이아웃 칩을 세팅하세요';
        section.innerHTML = `<div class="rpay-hint-text">${hint}</div>`;
        return;
      }
      section.innerHTML = `<div class="spread-row">${html}</div>`;
      const _row = section.querySelector('.spread-row');
      if (_row) { const ow = _row.offsetWidth, cw = section.clientWidth; if (ow > cw && cw > 0) _row.style.transform = `scale(${(cw / ow).toFixed(4)})`; }
    }

    // UNDO (2026-08-27), brought over from the roulette payout page's own
    // UNDO/S.history mechanism (Sims.roulettePay). That page keeps one flat
    // in-memory object (S.payChips) to snapshot; this tray has no such
    // object — the committed amounts live only as each denom's hidden
    // <input>'s value — so snapshotChips()/restoreChips() read/write those
    // inputs directly instead. Pushed right before every real mutation
    // (addChip only pushes past its "저액 칩스부터" order-enforcement
    // guard, i.e. only when a chip actually gets added; resetChip/resetAll
    // always mutate, so they always push). Mistake-triggered resets
    // (submitComm()'s wrong-amount branch) do NOT push, matching roulette's
    // own submitPay() mistake branch — a wrong PAY isn't an undoable step.
    function snapshotChips() {
      const snap = {};
      COMM_CHIPS.forEach(c => { snap[c.key] = $(`bpay-ci-${c.key}`)?.value || '0'; });
      return snap;
    }
    function pushHistory() {
      if (!S.history) S.history = [];
      S.history.push(snapshotChips());
    }
    function restoreChips(snap) {
      COMM_CHIPS.forEach(c => {
        const inp = $(`bpay-ci-${c.key}`);
        if (inp) inp.value = snap[c.key] ?? '0';
      });
    }

    // Answer reveal (💡, 2026-08-27). Greedy largest-denom-first breakdown
    // of the target amount — valid here specifically because COMM_CHIPS'
    // values (100M/10M/1M/100K/10K/5K) and S.commTarget (always a multiple
    // of 5000 — see startCommAt()) mean the greedy pick never leaves a
    // remainder greedy couldn't cover: every step's remainder stays a
    // multiple of the NEXT denom's own value, all the way down to 5K.
    function computeAnswerChips(target) {
      let rem = target;
      const chips = {};
      COMM_CHIPS.forEach(c => {
        const cnt = Math.floor(rem / c.val);
        if (cnt > 0) { chips[c.key] = cnt; rem -= cnt * c.val; }
      });
      return chips;
    }
    // Renders the answer using the EXACT same disc markup/CSS updateSpread()
    // uses for the trainee's own live spread (explicit ask: "실제 정답
    // 배치와 동일한 형태로") — only the data source differs (a computed
    // chips object here, DOM `<input>` values there).
    function renderAnswerSpread(chips) {
      const section = $('bpay-spread-section');
      if (!section) return;
      let html = '';
      let anyPrev = false;
      COMM_CHIPS.forEach(c => {
        const cnt = chips[c.key] || 0;
        if (!cnt) return;
        for (let j = 0; j < cnt; j++) {
          let cls = 'spread-disc';
          if (j === 0 && anyPrev)        cls += ' spread-gap';
          else if (j > 0 && j % 5 === 0) cls += ' spread-gap5';
          html += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
          anyPrev = true;
        }
      });
      section.innerHTML = `<div class="spread-row">${html}</div>`;
      const _row = section.querySelector('.spread-row');
      if (_row) { const ow = _row.offsetWidth, cw = section.clientWidth; if (ow > cw && cw > 0) _row.style.transform = `scale(${(cw / ow).toFixed(4)})`; }
    }

    function showCommTray() {
      const panel = $('bpay-comm-panel');
      const actionsSlot = $('bpay-actions-slot');
      if (!panel) return;
      // Undo nextRound()'s instant fade-out (see that function's own
      // comment) — innerHTML gets replaced below, but the panel NODE
      // itself is the same element, so a class added to it earlier
      // survives unless explicitly removed here.
      panel.classList.remove('bpay-tray-fading');
      // Fresh hand, fresh undo stack — same as roulette's showTray(),
      // which also zeroes S.history each time it (re)builds the tray.
      S.history = [];
      // Fresh hand, fresh answer-reveal state — showAnswer() hides this
      // row and S.answerRevealed gates it against a 2nd reveal.
      S.answerRevealed = false;
      const hintRow = $('bpay-hint-row');
      if (hintRow) hintRow.style.display = '';
      // UNDO + ALL RESET live in their own slot (.pay-actions-row), not the
      // PAY rack — same relocation as Option Bet's showPayTray() and the
      // roulette payout page's own UNDO/ALL RESET row; PAY stays the
      // tray's one primary action.
      if (actionsSlot) actionsSlot.innerHTML = `
        <button class="comm-undo-btn" onclick="Sims.baccaratPay.undo()">↩ UNDO</button>
        <button class="comm-all-reset-btn" onclick="Sims.baccaratPay.resetAll()">↺ RESET</button>`;
      panel.innerHTML = `<div class="comm-tray">
        <div id="bpay-order-warn" class="bpay-order-warn"><span>저액 칩스부터 세팅하세요</span></div>
        <div class="comm-tray-slots">
          ${COMM_CHIPS.map(c => `
            <div class="comm-slot${c.key === '5K' ? ' comm-slot-5k' : ''}">
              <input type="hidden" id="bpay-ci-${c.key}" value="0">
              <div class="bpay-chip-btns">
                ${c.key === '5K' ? '' : `
                <button class="bpay-chip-btn" onclick="Sims.baccaratPay.addChip('${c.key}',5)" aria-label="+${fmtAmt(c.val * 5)}">
                  <div class="bpay-chip-btn-stackwrap">
                    <div class="comm-slot-chip bpay-chip-stack-ghost" style="background:${c.bg};color:${c.fg}"></div>
                    <div class="comm-slot-chip bpay-chip-stack-ghost" style="background:${c.bg};color:${c.fg}"></div>
                    <div class="comm-slot-chip bpay-chip-btn-disc" style="background:${c.bg};color:${c.fg}">${fmtAmt(c.val * 5)}</div>
                  </div>
                </button>`}
                <button class="bpay-chip-btn" onclick="Sims.baccaratPay.addChip('${c.key}',1)" aria-label="+${fmtAmt(c.val)}">
                  <div class="comm-slot-chip bpay-chip-btn-disc" style="background:${c.bg};color:${c.fg}">${fmtAmt(c.val)}</div>
                </button>
              </div>
            </div>`).join('')}
          <div class="comm-pay-slot">
            <button class="comm-pay-btn" onclick="Sims.baccaratPay.submitComm()">PAY</button>
          </div>
        </div>
      </div>`;
      // Fresh round, all chip inputs just rebuilt at 0 — this is what
      // brings the empty-tray hint back for the new round (see
      // updateSpread()'s own comment).
      updateSpread();
    }

    function showMistake(retryFn) {
      S.mistakes++;
      if ($('bpay-mistakes')) $('bpay-mistakes').textContent = S.mistakes;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
    }

    const positions = () => document.querySelector('.bpay-positions');

    function showNextHand() {
      const pos = positions(); if (pos) pos.classList.remove('paying');
      for (let j = 1; j <= 1; j++) { const p = $(`bpay-pos-${j}`); if (p) p.classList.remove('active'); }
      S.awaitingPay = false;
      S.score++;
      S.rounds++;
      $('bpay-score').textContent = S.score;
      $('bpay-rounds').textContent = S.rounds;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) { Sims.baccaratPay.deal(); return; }
      const ov = document.createElement('div');
      ov.className = 'next-hand-overlay';
      ov.innerHTML = '<div class="next-hand-text">NEXT HAND</div>';
      tbl.appendChild(ov);
      S.nextTimer = setTimeout(() => { ov.remove(); Sims.baccaratPay.deal(); }, 1600);
    }

    function startCommAt(idx) {
      if (idx < 0) { showNextHand(); return; }
      S.commIdx = idx;
      const posNum = idx + 1;
      const pos = positions(); if (pos) pos.classList.add('paying');
      for (let j = 1; j <= 1; j++) {
        const p = $(`bpay-pos-${j}`); if (p) p.classList.toggle('active', j === posNum);
      }
      const total = S.bets[idx].total;
      if (S.mode === 'halfpay') {
        S.commTarget = Math.floor(total / 2 / 10000) * 10000;
      } else {
        const comm = Math.floor(total * 0.05 / 5000) * 5000;
        S.commTarget = total - comm;
      }
      showCommTray();
    }

    return {
      init() {
        S = { bets: [], commIdx: 0, rounds: 0, score: 0, mistakes: 0, commTarget: 0, mode: 'commission', lastTotal: 0, awaitingPay: false, nextTimer: null, history: [], answerRevealed: false };
        this.deal();
      },

      restart() {
        if (S.nextTimer) { clearTimeout(S.nextTimer); }
        const cur = S.mode || 'commission';
        S = { bets: [], commIdx: 0, rounds: S.rounds, score: S.score, mistakes: S.mistakes, commTarget: 0, mode: cur, lastTotal: 0, awaitingPay: S.awaitingPay, nextTimer: null, history: [], answerRevealed: false };
        this.setMode(cur);
      },

      setMode(mode) {
        if (S.nextTimer) { clearTimeout(S.nextTimer); S.nextTimer = null; }
        const prevMode = S.mode;
        S.mode = mode;
        const btnComm = document.getElementById('bpay-btn-commission');
        const btnHalf = document.getElementById('bpay-btn-halfpay');
        const btnSide = document.getElementById('bpay-btn-side');
        if (btnComm) btnComm.classList.toggle('active', mode === 'commission');
        if (btnHalf) btnHalf.classList.toggle('active', mode === 'halfpay');
        if (btnSide) btnSide.classList.toggle('active', mode === 'side');
        const bpayContent = document.getElementById('bpay-content');
        const bsideContent = document.getElementById('bside-content');
        const statsComm = document.getElementById('bpay-stats-comm');
        const statsSide = document.getElementById('bpay-stats-side');
        if (mode === 'side') {
          if (bpayContent) bpayContent.style.display = 'none';
          if (bsideContent) bsideContent.style.display = '';
          if (statsComm) statsComm.style.display = 'none';
          if (statsSide) statsSide.style.display = '';
          // Re-entering the same Option Bet tab (re-click or ↺ restart) keeps
          // accumulating its Rounds/Score; switching in from another tab resets it.
          if (Sims.baccaratSide) { Sims.baccaratSide.init(prevMode === 'side'); Sims.baccaratSide.deal(); }
        } else {
          if (bpayContent) bpayContent.style.display = '';
          if (bsideContent) bsideContent.style.display = 'none';
          if (statsComm) statsComm.style.display = '';
          if (statsSide) statsSide.style.display = 'none';
          if (prevMode !== mode) {
            S.rounds = 0; S.score = 0; S.mistakes = 0;
            if ($('bpay-score')) $('bpay-score').textContent = 0;
            if ($('bpay-mistakes')) $('bpay-mistakes').textContent = 0;
          } else if (S.awaitingPay) {
            // Re-entering the same tab (restart or mode-button re-click) while a
            // hand was still in progress counts as abandoning it — one round.
            S.rounds++;
            if ($('bpay-rounds')) $('bpay-rounds').textContent = S.rounds;
          }
          this.deal();
        }
      },

      deal() {
        const pos = positions(); if (pos) pos.classList.remove('paying');
        S.awaitingPay = true; S.commIdx = 0; S.commTarget = 0;
        $('bpay-rounds').textContent = S.rounds;
        // Hidden until this round's tray is actually built (showCommTray()
        // reveals it again) — keeps it off-screen during the brief pre-deal
        // gap instead of appearing before there's a problem to solve.
        const hintRow = $('bpay-hint-row'); if (hintRow) hintRow.style.display = 'none';
        for (let j = 1; j <= 1; j++) {
          const p = $(`bpay-pos-${j}`); if (p) p.classList.remove('active');
          const bOval = $(`bpay-b-${j}`); if (bOval) bOval.classList.remove('has-bet');
          const bAmt  = $(`bpay-b-amt-${j}`); if (bAmt) bAmt.innerHTML = '';
          const pAmt  = $(`bpay-p-amt-${j}`); if (pAmt) pAmt.innerHTML = '';
        }
        const spread = $('bpay-spread-section'); if (spread) spread.innerHTML = '';
        S.bets = Array.from({length: 1}, () => {
          const chips = generateBetChips();
          return { chips, total: chipTotal(chips) };
        });
        renderPositions();
        setTimeout(() => startCommAt(0), 400);
      },

      addChip(key, n) {
        const chip = COMM_CHIPS.find(c => c.key === key);
        if (!chip) return;
        const needed = neededKeysForTarget(S.commTarget);
        const lowerUnset = COMM_CHIPS.some(c =>
          c.val < chip.val &&
          needed.has(c.key) &&
          (parseInt($(`bpay-ci-${c.key}`)?.value) || 0) === 0
        );
        if (lowerUnset) { showOrderWarning(); return; }
        const inp = $(`bpay-ci-${key}`);
        if (!inp) return;
        pushHistory();
        inp.value = (parseInt(inp.value) || 0) + n;
        // 10 of any denom → 1 of next higher (where 10x relationship exists), cascades up
        for (let i = COMM_CHIPS.length - 1; i > 0; i--) {
          const lower = COMM_CHIPS[i], upper = COMM_CHIPS[i - 1];
          if (upper.val !== lower.val * 10) continue;
          const li = $(`bpay-ci-${lower.key}`);
          if (!li) continue;
          const v = parseInt(li.value) || 0;
          if (v < 10) continue;
          li.value = v % 10;
          const ui = $(`bpay-ci-${upper.key}`);
          if (ui) ui.value = (parseInt(ui.value) || 0) + Math.floor(v / 10);
        }
        // 100M has no higher denom — cap at 9
        const top = $('bpay-ci-100M');
        if (top && (parseInt(top.value) || 0) > 9) top.value = 9;
        updateSpread();
      },

      resetChip(key) {
        pushHistory();
        const inp = $(`bpay-ci-${key}`);
        if (inp) inp.value = '0';
        updateSpread();
      },

      resetAll() {
        pushHistory();
        COMM_CHIPS.forEach(c => {
          const inp = $(`bpay-ci-${c.key}`);
          if (inp) inp.value = '0';
        });
        updateSpread();
      },

      undo() {
        if (!S.history || !S.history.length) return;
        restoreChips(S.history.pop());
        updateSpread();
      },

      submitComm() {
        const entered = COMM_CHIPS.reduce((sum, c) => {
          return sum + c.val * (parseInt($(`bpay-ci-${c.key}`)?.value) || 0);
        }, 0);
        if (entered !== S.commTarget) {
          showMistake(() => {
            COMM_CHIPS.forEach(c => {
              const inp = $(`bpay-ci-${c.key}`);
              if (inp) inp.value = '0';
            });
            updateSpread();
          });
          return;
        }
        startCommAt(S.commIdx - 1);
      },

      // 💡 (2026-08-27, rev 11 2026-08-27). Explicit requirements: shows the
      // correct chip layout for THIS target, but the round must NOT count
      // toward Rounds/Score/Mistakes — so this skips submitComm() and
      // startCommAt() entirely (the only places that touch those counters)
      // rather than reusing them with a bypass flag.
      // Rev 2: the chip tray underneath is left exactly as showCommTray()
      // built it (no innerHTML replacement) — only disabled.
      // Rev 3/4/5: the button (then labeled NEXT ROUND) is a separate row
      // prepended above `.comm-tray` (a sibling, not a child — `.comm-tray`
      // has `overflow:hidden`, so anything meant to sit above it has to
      // live outside that box); PAY stays put underneath, just `disabled`.
      // Rev 11: label changed to "NEXT HAND" and the button now reuses
      // `.bac-cta-btn` VERBATIM (the same class the baccarat drawing/
      // practice page's own START/NEXT HAND button uses, main.js's
      // showCtaBtn()) — explicit ask for identical design AND size, not
      // just a matching label. `.bpay-next-round-row` still centers it
      // (unchanged), but `.bac-cta-btn` itself carries `width:100%` from
      // its home page, so it now spans that row's full width rather than
      // sizing to its own text — that's carried over on purpose, not an
      // oversight, since "크기 그대로" was explicit. The old bespoke
      // `.bpay-next-round-row .bpay-next-round-btn` gold-pill styling
      // (rev 3-5's own work) is dead CSS now — see style.css's own note.
      showAnswer() {
        if (!S.awaitingPay || S.answerRevealed) return;
        S.answerRevealed = true;
        const hintRow = $('bpay-hint-row'); if (hintRow) hintRow.style.display = 'none';
        const actionsSlot = $('bpay-actions-slot'); if (actionsSlot) actionsSlot.innerHTML = '';
        renderAnswerSpread(computeAnswerChips(S.commTarget));
        const panel = $('bpay-comm-panel');
        if (panel) {
          panel.querySelectorAll('.bpay-chip-btn, .comm-pay-btn').forEach(b => b.disabled = true);
          panel.insertAdjacentHTML('afterbegin', `<div class="bpay-next-round-row">
            <button class="bac-cta-btn" onclick="Sims.baccaratPay.nextRound()">NEXT HAND</button>
          </div>`);
        }
      },

      // Advances the hand WITHOUT going through showNextHand() (the only
      // place Rounds/Score increment) — this is what actually keeps an
      // answer-revealed round out of the stats, not just the UI change
      // above.
      //
      // Perf/perceived-speed fix (2026-08-27, explicit ask: "정답 보기 후
      // NEXT ROUND... 느립니다"). Root cause was NOT an extra timer or
      // duplicate work — deal() (below) always has the same ~400ms pause
      // before rebuilding the tray, on EVERY path, including the normal
      // PAY → NEXT HAND flow. That flow just doesn't feel slow because
      // showNextHand()'s full-table `.next-hand-overlay` covers the whole
      // gap; this path calls deal() directly with nothing covering
      // anything, so the disabled tray (dimmed chip buttons + this very
      // NEXT ROUND button, now stale) just sits there unchanged for
      // ~400ms, reading as frozen/unresponsive even though it's actually
      // the FASTER of the two paths in raw elapsed time. Fix: fade the
      // stale panel out instantly on click, so there's immediate visual
      // feedback instead of a dead pause — showCommTray()/showPayTray()
      // clear this class the moment the real new-round tray is rebuilt.
      nextRound() {
        if (S.nextTimer) { clearTimeout(S.nextTimer); S.nextTimer = null; }
        const panel = $('bpay-comm-panel');
        if (panel) panel.classList.add('bpay-tray-fading');
        this.deal();
      },
    };
  })(),

  // ---- BACCARAT SIDE BET SIM ----
  baccaratSide: (() => {
    const COMM_CHIPS = [
      { key: '100M', val: 100_000_000, bg: '#c62828', fg: '#fff'    },
      { key: '10M',  val:  10_000_000, bg: '#1565c0', fg: '#fff'    },
      { key: '1M',   val:   1_000_000, bg: '#fdd835', fg: '#1a1a1a' },
      { key: '100K', val:     100_000, bg: '#212121', fg: '#fff'    },
      { key: '10K',  val:      10_000, bg: '#2e7d32', fg: '#fff'    },
      { key: '5K',   val:       5_000, bg: '#b5176b', fg: '#fff'    },
    ];
    const SIDE_CHIPS = [COMM_CHIPS[3], COMM_CHIPS[4]];
    // Display-only, mirrors Sims.baccaratPay's own fmtAmt (see that
    // copy's comment) — formats a chip button's resulting amount, does
    // not feed into addChip()/S.bets/any real amount calculation.
    const fmtAmt = v => v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1_000 ? `${v / 1_000}K` : String(v);
    const SIDE_KEYS  = ['st','tt','bt','sd','s7','bd','pp','bp'];
    const SIDE_BET_MIN = 10_000;
    const SIDE_BET_MAX = {
      s7: 2_000_000,
      bt: 500_000, bd: 500_000,
      tt: 50_000_000, pp: 50_000_000, bp: 50_000_000, st: 50_000_000, sd: 50_000_000,
    };

    let S = {};
    const $ = id => document.getElementById(id);

    function generateSideChips(key) {
      const maxAmt = SIDE_BET_MAX[key] ?? 1_000_000;
      // Roughly out of every 10 questions: 5 one-color, 4 two-color, 1 three-color
      const r = Math.random();
      const target = r < 0.50 ? 1 : r < 0.90 ? 2 : 3;
      const numColors = (target === 3 && maxAmt >= 1_100_000) ? 3 : Math.min(target, 2);

      if (numColors === 1) {
        return Math.random() < 0.5
          ? { '100K': 1 + Math.floor(Math.random() * Math.min(Math.floor(maxAmt / 100_000), 9)) }
          : { '10K':  1 + Math.floor(Math.random() * 9) };
      }
      if (numColors === 2) {
        return {
          '100K': 1 + Math.floor(Math.random() * Math.min(Math.floor(maxAmt / 100_000) - 1, 9)),
          '10K':  1 + Math.floor(Math.random() * 9),
        };
      }
      // 3-color: 1M + 100K + 10K
      return {
        '1M':   1 + Math.floor(Math.random() * 5),
        '100K': 1 + Math.floor(Math.random() * 9),
        '10K':  1 + Math.floor(Math.random() * 9),
      };
    }

    function chipTotal(chips) {
      return Object.entries(chips).reduce((sum, [key, cnt]) => {
        return sum + (COMM_CHIPS.find(c => c.key === key)?.val ?? 0) * cnt;
      }, 0);
    }

    function renderChipDiscs(chips) {
      const sorted = Object.entries(chips).sort((a, b) => {
        const va = COMM_CHIPS.find(c => c.key === a[0])?.val ?? 0;
        const vb = COMM_CHIPS.find(c => c.key === b[0])?.val ?? 0;
        return vb - va;
      });
      const groups = sorted.map(([key, cnt]) => {
        const chip = COMM_CHIPS.find(c => c.key === key);
        if (!chip) return '';
        let discs = '';
        for (let j = 0; j < cnt; j++) {
          const cls = (j > 0 && j % 5 === 0) ? 'bside-bet-disc group5gap' : 'bside-bet-disc';
          discs += `<div class="${cls}" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
        }
        return `<div class="bside-bet-group">${discs}</div>`;
      }).join('');
      return `<div class="bside-bet-spread">${groups}</div>`;
    }



    const SIDE_MULT = { st:22, tt:8, bt:50, sd:15, bd:30, pp:11, bp:11 };
    const S7_MULTS  = [30, 40, 100];

    function clearHighlights() {
      document.querySelector('.bside-layout')?.classList.remove('bside-quiz-mode');
      document.querySelectorAll('.bside-circ-mult-above').forEach(el => el.remove());
      for (let i = 1; i <= 1; i++) {
        SIDE_KEYS.forEach(k => {
          const c = $(`bside-${k}-${i}`);
          if (c) c.classList.remove('bside-win-circ', 'bside-lose-circ', 'bside-paying-circ');
        });
      }
    }

    function updateSpread() {
      const section = $('bside-spread-section');
      if (!section) return;
      const groups = [];
      COMM_CHIPS.forEach(c => {
        const cnt = parseInt($(`bside-ci-${c.key}`)?.value) || 0;
        if (!cnt) return;
        let discs = '';
        for (let j = 0; j < cnt; j++) {
          const cls = (j > 0 && j % 5 === 0) ? 'spread-disc spread-gap5' : 'spread-disc';
          discs += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
        }
        groups.push(`<div class="spread-group">${discs}</div>`);
      });
      if (!groups.length) {
        section.innerHTML = '<div class="rpay-hint-text">왼쪽 베팅 구역을 확인하고 칩스를 세팅하세요</div>';
      } else {
        section.innerHTML = `<div class="spread-row">${groups.join('')}</div>`;
      }
    }

    // UNDO (2026-08-27) — same mechanism as Sims.baccaratPay's own copy
    // (brought over from roulette's S.history/undo()); see that copy's
    // comment for why this snapshots hidden-<input> values instead of a
    // flat state object.
    function snapshotChips() {
      const snap = {};
      COMM_CHIPS.forEach(c => { snap[c.key] = $(`bside-ci-${c.key}`)?.value || '0'; });
      return snap;
    }
    function pushHistory() {
      if (!S.history) S.history = [];
      S.history.push(snapshotChips());
    }
    function restoreChips(snap) {
      COMM_CHIPS.forEach(c => {
        const inp = $(`bside-ci-${c.key}`);
        if (inp) inp.value = snap[c.key] ?? '0';
      });
    }

    // Answer reveal (💡, 2026-08-27) — same mechanism as Sims.baccaratPay's
    // own copy; see that copy's comment for why greedy largest-denom-first
    // is valid here (S.payTarget = betTotal * mult, and betTotal is itself
    // built from COMM_CHIPS-denominated chip counts via generateSideChips(),
    // so it's always an exact multiple of the smallest denom in play).
    function computeAnswerChips(target) {
      let rem = target;
      const chips = {};
      COMM_CHIPS.forEach(c => {
        const cnt = Math.floor(rem / c.val);
        if (cnt > 0) { chips[c.key] = cnt; rem -= cnt * c.val; }
      });
      return chips;
    }
    function renderAnswerSpread(chips) {
      const section = $('bside-spread-section');
      if (!section) return;
      const groups = [];
      COMM_CHIPS.forEach(c => {
        const cnt = chips[c.key] || 0;
        if (!cnt) return;
        let discs = '';
        for (let j = 0; j < cnt; j++) {
          const cls = (j > 0 && j % 5 === 0) ? 'spread-disc spread-gap5' : 'spread-disc';
          discs += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
        }
        groups.push(`<div class="spread-group">${discs}</div>`);
      });
      section.innerHTML = `<div class="spread-row">${groups.join('')}</div>`;
    }

    function showPayTray() {
      const panel = $('bside-comm-panel');
      const spread = $('bside-spread-section');
      const actionsSlot = $('bside-actions-slot');
      if (!panel) return;
      panel.style.display = 'block';
      // Undo nextRound()'s instant fade-out — same as Sims.baccaratPay's
      // own showCommTray() copy, see that one's comment.
      panel.classList.remove('bpay-tray-fading');
      // showAnswer() (rev 13) inserts NEXT HAND right after #bside-
      // spread-section, OUTSIDE `panel` — so unlike Sims.baccaratPay's
      // copy (where a plain `panel.innerHTML = ...` rebuild wipes out
      // its own prepended row for free), this one needs its own explicit
      // cleanup each fresh round, or it'd linger indefinitely.
      document.querySelector('.bside-next-round-row')?.remove();
      if (spread) { spread.style.display = 'flex'; spread.innerHTML = '<div class="rpay-hint-text">왼쪽 베팅 구역을 확인하고 칩스를 세팅하세요</div>'; }
      // Fresh hand, fresh undo stack.
      S.history = [];
      // Fresh hand, fresh answer-reveal state.
      S.answerRevealed = false;
      const hintRow = $('bside-hint-row');
      if (hintRow) hintRow.style.display = '';
      // UNDO + ALL RESET live in their own slot (.pay-actions-row, in the
      // baccaratPaySim() template), not the PAY rack — same relocation the
      // roulette payout page already uses for its own UNDO/ALL RESET row,
      // so PAY reads as the tray's one primary action and these read as
      // secondary, out-of-the-way ones.
      if (actionsSlot) actionsSlot.innerHTML = `
        <button class="comm-undo-btn" onclick="Sims.baccaratSide.undo()">↩ UNDO</button>
        <button class="comm-all-reset-btn" onclick="Sims.baccaratSide.resetAll()">↺ RESET</button>`;
      panel.innerHTML = `<div class="comm-tray">
        <div class="comm-tray-slots">
          ${COMM_CHIPS.map(c => `
            <div class="comm-slot${c.key === '5K' ? ' comm-slot-5k' : ''}">
              <input type="hidden" id="bside-ci-${c.key}" value="0">
              <div class="bpay-chip-btns">
                ${c.key === '5K' ? '' : `
                <button class="bpay-chip-btn" onclick="Sims.baccaratSide.addChip('${c.key}',5)" aria-label="+${fmtAmt(c.val)}×5">
                  <div class="bpay-chip-btn-stackwrap">
                    <div class="comm-slot-chip bpay-chip-stack-ghost" style="background:${c.bg};color:${c.fg}"></div>
                    <div class="comm-slot-chip bpay-chip-stack-ghost" style="background:${c.bg};color:${c.fg}"></div>
                    <div class="comm-slot-chip bpay-chip-btn-disc bpay-chip-btn-disc-x5" style="background:${c.bg};color:${c.fg}"><span class="bpay-x5-amt">${fmtAmt(c.val)}</span><span class="bpay-x5-mult">×5</span></div>
                  </div>
                </button>`}
                <button class="bpay-chip-btn" onclick="Sims.baccaratSide.addChip('${c.key}',1)" aria-label="+${fmtAmt(c.val)}">
                  <div class="comm-slot-chip bpay-chip-btn-disc" style="background:${c.bg};color:${c.fg}">${fmtAmt(c.val)}</div>
                </button>
              </div>
            </div>`).join('')}
          <div class="comm-pay-slot">
            <button class="comm-pay-btn" onclick="Sims.baccaratSide.submitPay()">PAY</button>
          </div>
        </div>
      </div>`;
    }

    function showMistake(retryFn) {
      S.mistakes++;
      if ($('bside-mistakes')) $('bside-mistakes').textContent = S.mistakes;
      const tbl = document.querySelector('#bside-content .baccarat-table') || document.querySelector('.bside-sim .baccarat-table');
      if (!tbl) { retryFn(); return; }
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
    }

    function showNextHand() {
      const tbl = document.querySelector('#bside-content .baccarat-table');
      if (!tbl) { Sims.baccaratSide.deal(); return; }
      const ov = document.createElement('div');
      ov.className = 'next-hand-overlay';
      ov.innerHTML = '<div class="next-hand-text">NEXT HAND</div>';
      tbl.appendChild(ov);
      S.nextTimer = setTimeout(() => { ov.remove(); Sims.baccaratSide.deal(); }, 1600);
    }

    const ZOOM_OUT_CHIP_SCALE = 0.55;
    const ZOOM_IN_SCALE = 1.8;
    let zoomTimer = null;

    // Mini-map (2026-08-26). A small always-unzoomed reference thumbnail of
    // the full Option Bet layout, so a trainee can tell which part of the
    // whole layout the zoomed-in view is showing. Visual reference only —
    // no click handling, no real navigation (per explicit "실제 네비게이션
    // 기능은 없음").
    // Rebuilt from a cloneNode(true) of the real (unzoomed) layout each time
    // zoomToKey() runs, rather than hand-built once — this is the simplest
    // way to keep it a genuine "scaled-down version of the full layout"
    // (explicit requirement) without hand-duplicating every bet-cell shape
    // in a second markup block that could drift out of sync with the real
    // one. All `id` attributes are stripped from the clone (the original
    // elements' ids like `bside-bt-1` must stay unique in the document) and
    // it's marked `pointer-events:none` (CSS), so the clone is inert — it
    // can't be clicked and doesn't collide with the real layout's ids.
    //
    // REV 3 bug fix: REV 1/2 left the clone as a normal (position:static)
    // flow child with only a CSS `transform: scale()` shrinking it visually.
    // `transform` never changes the box an element reserves for LAYOUT
    // purposes — only how it's painted — so #bside-minimap-inner's auto
    // height was silently sized to the clone's FULL, un-scaled height (its
    // real on-page height, often 300px+), not the tiny painted result. That
    // oversized box then got clipped by something further up the page,
    // which is what showed up as "미니맵이 세로로 잘리면서 일부 영역만
    // 보임". Fix: make the clone `position:absolute` inside `#bside-minimap-
    // inner` (so it's taken OUT of normal flow and can't inflate the
    // container's auto-size at all), then set the container's width/height
    // EXPLICITLY to the scaled result. The mini-map box is now sized to
    // exactly fit its content — no `overflow:hidden` is doing any hiding,
    // nothing needs to be cropped.
    //
    // REV 4-5 (2026-08-26, same day, superseded — history only): tried
    // living inside .bside-chipset-pane (the right betting pane) instead,
    // top-left and then enlarged further. Explicit follow-up rejected this
    // outright: a growing multi-row chip spread in that SAME pane
    // (#bside-spread-section, vertically centered via `.bpay-spread-
    // section`'s `align-items:center`) kept competing with the mini-map for
    // space, no matter how the caps or a dynamic shrink-on-overlap fallback
    // were tuned. REV 7 below moves it out of that pane entirely, which
    // removes the competition at its root instead of continuing to manage
    // it.
    //
    // REV 7 (2026-08-26, same day, superseded — history only): moved to the
    // ZOOM pane's own bottom-right corner as a `position:absolute` overlay
    // on top of `.bside-zoom-stage`. Explicit follow-up rejected this too —
    // an absolutely-positioned overlay, however small/translucent, still
    // physically covers whatever zoomed content happens to sit underneath
    // it (SMALL/BIG/SUPER7 etc. specifically got obscured), which defeats
    // the whole point of a trainee being able to verify the exact zoomed
    // bet target. REV 8 below fixes this at the root: the mini-map is no
    // longer an overlay AT ALL.
    //
    // REV 8 (2026-08-26, same day — docked, not overlaid). The mini-map
    // now lives in `.bside-minimap-dock`, a NORMAL-FLOW sibling of
    // `#bside-zoom-stage` (both children of `.bside-layout-pane`, which is
    // `display:flex; flex-direction:column`) instead of an absolutely
    // positioned child of the stage. The dock has a fixed CSS height (see
    // style.css), so `.bside-zoom-stage`'s own `flex:1` simply gives it
    // whatever pane height remains AFTER that fixed strip is subtracted —
    // the zoomed content reflows into a slightly shorter area and stays
    // 100% visible, rather than a fixed-size area being partially painted
    // over. This is the same "reserve real layout space instead of
    // overlaying" fix as REV 7 was to REV 4-5's right-pane placement,
    // applied one level down.
    // Sizing is still a hand-rolled CONTAIN fit — the largest box that
    // fits the real layout's full aspect ratio inside BOTH a width cap and
    // a height cap at once, so neither can ever crop it (whichever cap is
    // tighter for this layout's proportions wins; the other axis comes out
    // under its own cap by construction). The height cap now comes from
    // the DOCK's own (CSS-fixed) height, not a % of `pRect.height` — using
    // `pRect.height` here would have been circular, since the dock's
    // presence is itself part of what determines the pane's total height.
    //
    // REV 9 (2026-08-26, same day, PARTIALLY superseded — see REV 10):
    // added a scoped CSS override forcing every betting-zone shape inside
    // the clone to one unified bright-gold border, on top of stripping
    // chip content (still current, below). REV 10 in style.css reverted
    // JUST the border-color override — it made the mini-map look like a
    // hand-drawn schematic instead of an actual scaled copy of the real
    // screen. The chip-stripping in this function is UNCHANGED/still
    // current; only the CSS coloring was rolled back.
    // REV 10 (2026-08-26): width ratio trimmed 0.9→0.6 alongside the dock's
    // CSS height being roughly halved (style.css), per explicit "50-60%
    // 수준으로 축소" — though in practice the DOCK HEIGHT is almost always
    // the binding constraint for this layout's (taller-than-wide) aspect
    // ratio, so this width cap mostly just stays a generous ceiling that's
    // never actually hit.
    //
    // REV 11 (2026-08-26, same day — two real bugs, not tuning):
    // 1. "미니맵 아래가 짤려보이지" (bottom looked cropped): `capH` used
    //    `dock.clientHeight`, which already INCLUDES the dock's own
    //    padding — but `.bside-minimap-dock` had `padding-top: .2rem`
    //    (style.css), so the child (sized to the FULL clientHeight) had
    //    ~3px less real vertical room than it was sized for, once that
    //    padding ate into the same box. The child overflowed the dock's
    //    bottom edge by that amount, which read as a cropped mini-map.
    //    Fixed in style.css: dropped the dock's vertical padding to 0 (kept
    //    horizontal only) so `clientHeight` exactly equals the space
    //    actually available — no discrepancy left to overflow.
    // 2. "이상한 녹색 네모" (weird green square) — removed the separate
    //    `.bside-minimap-hl` overlay box and `updateMinimapHighlight()`
    //    entirely. It turned out to be REDUNDANT: `deal()` already adds
    //    `.bside-quiz-mode` to `.bside-layout` and `.bside-paying-circ` to
    //    the target cell BEFORE calling `zoomToKey()` (and thus
    //    `buildMinimap()`) — since `cloneNode(true)` deep-clones class
    //    lists, the mini-map clone ALREADY inherits the real layout's own
    //    highlight mechanism for free: `.bside-quiz-mode .bside-oval-bet,
    //    .bpay-pair-circ, .bside-gray-oval { opacity:.28 }` dims every
    //    OTHER zone while `.bside-quiz-mode .bside-paying-circ { opacity:1
    //    !important }` keeps the target at full brightness — the exact
    //    same dim/bright treatment the real zoomed screen uses. Explicit
    //    ask was "실제 레이아웃에서 보이는것처럼...동일하게 반영" (reflect
    //    it identically to the real layout) — a hand-drawn green rectangle
    //    was never going to match that as well as just letting the
    //    already-cloned classes do it natively. If a future rev needs a
    //    stronger position cue than opacity dimming provides, look at
    //    boosting `.bside-quiz-mode .bside-paying-circ`'s OWN treatment
    //    (e.g. a brighter box-shadow scoped to `#bside-minimap-inner`)
    //    rather than reintroducing a separate overlay box.
    const MINIMAP_W_RATIO = 0.72; // mini-map width cap ≈ 72% of the dock's own width (dock's width = pane width)
    const MINIMAP_MIN_W = 24;     // px floor so it never shrinks below legible
    const MINIMAP_BORDER = 1.5;   // must match .bside-minimap's CSS border-width
    function buildMinimap(pRect) {
      const mmBox   = $('bside-minimap');
      const mmInner = $('bside-minimap-inner');
      const dock    = document.querySelector('.bside-minimap-dock');
      const layout  = document.querySelector('#bside-zoom-stage .bpay-positions.bside-layout');
      if (!mmBox || !mmInner || !dock || !layout || !pRect.width) return;
      const lw = layout.offsetWidth, lh = layout.offsetHeight;
      const dockW = dock.clientWidth, dockH = dock.clientHeight;
      if (!lw || !lh || !dockW || !dockH) return;

      // Caps are for the CONTENT area only (inside `.bside-minimap`'s own
      // border) — `mmBox` is sized further down via box-sizing:border-box
      // to exactly capW/capH, so the border itself can never push the
      // rendered box past the dock's edge (REV 11 fixed a padding-based
      // version of this same overflow; this is the border-width version
      // of the same bug, introduced when the box needed a visible frame).
      const capW = dockW * MINIMAP_W_RATIO - MINIMAP_BORDER * 2;
      const capH = dockH - MINIMAP_BORDER * 2; // fill the dock's fixed height, aspect-ratio permitting
      // Contain fit: pick the smaller of the two per-axis scales so the
      // full (uncropped) layout fits inside BOTH caps — same aspect ratio
      // as the real layout either way.
      const scale = Math.max(MINIMAP_MIN_W / lw, Math.min(capW / lw, capH / lh));
      const targetW = lw * scale;

      const clone = layout.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('[onclick]').forEach(el => el.removeAttribute('onclick'));
      // REV 9 (2026-08-26): readability pass — strip chip content out of
      // the clone so the mini-map shows ONLY the betting-zone shapes
      // (ovals/circles), not whatever chip discs/face values/×mult label
      // happen to be sitting in the real layout at clone time (the target
      // cell always has real bet chips in it by the time zoomToKey() runs,
      // since deal() renders them before calling zoomToKey()). Explicit
      // ask: "칩 정보/액면가/칩 스택 제거...베팅영역만 표시". Empties the
      // amount containers rather than removing them outright, so the
      // shapes' own box size (and thus the layout's overall proportions)
      // stays identical to the real layout's.
      clone.querySelectorAll('.bpay-oval-amt, .bpay-circ-bet').forEach(el => { el.innerHTML = ''; });
      clone.querySelectorAll('.bside-circ-mult-above').forEach(el => el.remove());
      // Fix the clone's own box to the real layout's current (unzoomed)
      // pixel size, absolutely positioned at the container's origin, THEN
      // scaled — being out of normal flow means this box can never affect
      // #bside-minimap-inner's own size, no matter how tall the real
      // layout is.
      clone.style.position = 'absolute';
      clone.style.top = '0'; clone.style.left = '0'; clone.style.margin = '0';
      clone.style.width = `${lw}px`;
      clone.style.height = `${lh}px`;
      clone.style.transformOrigin = 'top left';
      clone.style.transform = `scale(${scale.toFixed(4)})`;
      // Exposes the live scale to CSS so the border-only zoom-target
      // marker (`#bside-minimap-inner .bside-paying-circ`, style.css) can
      // divide its outline width by it — a plain px value on that outline
      // would get shrunk right along with everything else inside this
      // `transform: scale()`'d clone and disappear at small scales.
      clone.style.setProperty('--mm-scale', scale.toFixed(4));
      mmInner.innerHTML = '';
      mmInner.appendChild(clone);

      // Size both the outer box and the inner wrapper to EXACTLY the
      // scaled result — same uniform `scale` on both axes, so the aspect
      // ratio always matches the real layout's, with nothing left over to
      // crop or hide. `mmBox` (the bordered outer box) is sized via
      // box-sizing:border-box to CONTENT size + its own border, so the
      // border can never push its rendered footprint past capW/capH.
      const scaledH = lh * scale;
      mmBox.style.width    = `${(targetW + MINIMAP_BORDER * 2).toFixed(1)}px`;
      mmBox.style.height   = `${(scaledH + MINIMAP_BORDER * 2).toFixed(1)}px`;
      mmInner.style.width  = `${targetW.toFixed(1)}px`;
      mmInner.style.height = `${scaledH.toFixed(1)}px`;
    }

    function zoomToKey(key) {
      const pane  = document.querySelector('.bside-layout-pane');
      const stage = $('bside-zoom-stage');
      const target = $(`bside-${key}-1`);
      const chipWrap = $(`bside-${key}-amt-1`)?.querySelector('.bside-bet-spread');
      if (!pane || !stage || !target) return;
      // Reset to the unscaled layout before measuring raw positions
      stage.style.transition = '';
      stage.style.transform = '';
      if (chipWrap) { chipWrap.style.transition = ''; chipWrap.style.transform = ''; }

      requestAnimationFrame(() => {
        const pRect = pane.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        if (!pRect.width || !pRect.height || !tRect.width || !tRect.height) return;
        buildMinimap(pRect);
        const cx = tRect.left - pRect.left + tRect.width  / 2;
        const cy = tRect.top  - pRect.top  + tRect.height / 2;
        // Same fixed zoom ratio for every bet type — only the pan target (which
        // cell to center on) differs, not how much it magnifies.
        const scale = ZOOM_IN_SCALE;
        const dx = pRect.width  / 2 - cx * scale;
        const dy = pRect.height / 2 - cy * scale;

        // Pre-shrink the chip discs to the same fixed size for every bet type while
        // zoomed out (independent of `scale`, which varies with how small the bet
        // cell is — without this, small cells like the pair circles would pre-shrink
        // their chips much more than wide cells, looking inconsistently tiny).
        if (chipWrap) {
          chipWrap.style.transformOrigin = 'center center';
          chipWrap.style.transition = '';
          chipWrap.style.transform = `scale(${ZOOM_OUT_CHIP_SCALE})`;
        }

        // Push the ×mult label up clear of the chip stack once it wraps to 2+ rows
        // and grows taller than the circle itself (it's centered, so it grows upward
        // as much as downward).
        const multLabel = target.querySelector('.bside-circ-mult-above');
        if (multLabel && chipWrap) {
          const chipRect = chipWrap.getBoundingClientRect();
          const overflowAboveTop = tRect.top - chipRect.top;
          multLabel.style.marginBottom = `${3 + Math.max(0, overflowAboveTop)}px`;
        }

        // Show the full layout briefly before animating the zoom-in
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(() => {
          stage.style.transition = 'transform .5s ease';
          stage.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
          // Cancel the (now-constant, same-for-every-bet) zoom ratio so chips land
          // back at exactly the commission/half-pay size once zoomed in.
          if (chipWrap) {
            chipWrap.style.transition = 'transform .5s ease';
            chipWrap.style.transform = `scale(${(1 / scale).toFixed(4)})`;
          }
        }, 700);
      });
    }

    return {
      init(isRestart) {
        if (S.nextTimer) { clearTimeout(S.nextTimer); }
        const wasMidHand = isRestart && S && S.awaitingPay === true;
        const keepRounds   = isRestart && S ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        const keepScore    = isRestart && S ? S.score    : 0;
        const keepMistakes = isRestart && S ? S.mistakes : 0;
        S = { rounds: keepRounds, score: keepScore, mistakes: keepMistakes, currentKey: null, currentMult: 0, currentBet: 0, lastKey: null, payTarget: 0, awaitingPay: false, nextTimer: null, history: [], answerRevealed: false };
        if ($('bside-rounds')) $('bside-rounds').textContent = S.rounds;
        if ($('bside-score')) $('bside-score').textContent = S.score;
        if ($('bside-mistakes')) $('bside-mistakes').textContent = S.mistakes;
      },

      deal() {
        const startOverlay = $('bside-start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';
        // Hidden until this round's tray is actually built (showPayTray()
        // reveals it again) — keeps it off-screen during the brief pre-deal
        // gap instead of appearing before there's a problem to solve.
        const hintRow = $('bside-hint-row'); if (hintRow) hintRow.style.display = 'none';
        S.awaitingPay = true;
        $('bside-rounds').textContent = S.rounds;
        clearHighlights();
        SIDE_KEYS.forEach(k => { const el = $(`bside-${k}-amt-1`); if (el) el.innerHTML = ''; });
        const panel = $('bside-comm-panel'); if (panel) panel.style.display = 'none';
        const spread = $('bside-spread-section'); if (spread) { spread.style.display = 'none'; spread.innerHTML = ''; }

        // Pick a random key different from the last one
        let key;
        do { key = SIDE_KEYS[Math.floor(Math.random() * SIDE_KEYS.length)]; }
        while (key === S.lastKey);
        S.lastKey = key;
        S.currentKey = key;

        // Determine multiplier
        const mult = key === 's7'
          ? S7_MULTS[Math.floor(Math.random() * S7_MULTS.length)]
          : SIDE_MULT[key];
        S.currentMult = mult;

        // Generate bet chips and show on circle
        const chips = generateSideChips(key);
        const betTotal = chipTotal(chips);
        S.currentBet = betTotal;
        S.payTarget = betTotal * mult;

        const amtEl = $(`bside-${key}-amt-1`);
        if (amtEl) amtEl.innerHTML = renderChipDiscs(chips);

        const circ = $(`bside-${key}-1`);
        if (circ) {
          circ.classList.add('bside-paying-circ');
          const label = document.createElement('div');
          label.className = 'bside-circ-mult-above';
          label.textContent = `×${mult}`;
          circ.appendChild(label);
        }
        document.querySelector('.bside-layout')?.classList.add('bside-quiz-mode');

        showPayTray();
        zoomToKey(key);
      },

      addChip(key, n) {
        const chip = COMM_CHIPS.find(c => c.key === key);
        if (!chip) return;
        const inp = $(`bside-ci-${key}`);
        if (!inp) return;
        pushHistory();
        inp.value = (parseInt(inp.value) || 0) + n;
        for (let i = COMM_CHIPS.length - 1; i > 0; i--) {
          const lower = COMM_CHIPS[i], upper = COMM_CHIPS[i - 1];
          if (upper.val !== lower.val * 10) continue;
          const li = $(`bside-ci-${lower.key}`);
          if (!li) continue;
          const v = parseInt(li.value) || 0;
          if (v < 10) continue;
          li.value = v % 10;
          const ui = $(`bside-ci-${upper.key}`);
          if (ui) ui.value = (parseInt(ui.value) || 0) + Math.floor(v / 10);
        }
        const top = $('bside-ci-100M');
        if (top && (parseInt(top.value) || 0) > 9) top.value = 9;
        updateSpread();
      },

      resetChip(key) {
        pushHistory();
        const inp = $(`bside-ci-${key}`);
        if (inp) inp.value = '0';
        updateSpread();
      },

      resetAll() {
        pushHistory();
        COMM_CHIPS.forEach(c => {
          const inp = $(`bside-ci-${c.key}`);
          if (inp) inp.value = '0';
        });
        updateSpread();
      },

      undo() {
        if (!S.history || !S.history.length) return;
        restoreChips(S.history.pop());
        updateSpread();
      },

      submitPay() {
        const entered = COMM_CHIPS.reduce((sum, c) => {
          return sum + c.val * (parseInt($(`bside-ci-${c.key}`)?.value) || 0);
        }, 0);
        if (entered !== S.payTarget) {
          showMistake(() => {
            COMM_CHIPS.forEach(c => { const inp = $(`bside-ci-${c.key}`); if (inp) inp.value = '0'; });
            updateSpread();
          });
          return;
        }
        // Correct — flash green, then show the NEXT HAND screen like commission/half-pay
        const circ = $(`bside-${S.currentKey}-1`);
        if (circ) { circ.classList.remove('bside-paying-circ'); circ.classList.add('bside-win-circ'); }
        COMM_CHIPS.forEach(c => { const inp = $(`bside-ci-${c.key}`); if (inp) inp.value = '0'; });
        updateSpread();
        S.awaitingPay = false;
        S.score++;
        S.rounds++;
        $('bside-score').textContent = S.score;
        $('bside-rounds').textContent = S.rounds;
        showNextHand();
      },

      // 💡 (2026-08-27, rev 13 2026-08-27) — same approach as
      // Sims.baccaratPay's own copy (see that copy's comment for the rev
      // 2/3/4/11 rationale): skips submitPay() (the only place Rounds/
      // Score/Mistakes change for this sim) entirely rather than reusing
      // it with a bypass flag, so an answer-revealed round genuinely
      // can't touch those counters. Reuses `.bac-cta-btn` verbatim — same
      // design/size as the drawing page's own START/NEXT HAND button.
      // Rev 13 (explicit ask, Option Bet only — Sims.baccaratPay's own
      // copy is untouched): moved OFF `#bside-comm-panel` (the full-width
      // tray pinned at the very bottom of the page, below `.bside-mid-
      // row`) — prepending it there put it in a lone horizontal band
      // between the two-column betting/chip-setting area above and the
      // tray below, reading as "floating" rather than attached to either.
      // Now appended into `.bside-chipset-pane` (the right-hand chip-
      // setting column) right after `#bside-spread-section` — the SAME
      // element `renderAnswerSpread()` just filled with the answer chips,
      // left completely alone per explicit "정답 칩 배치 영역은 그대로
      // 유지" — so it reads as chip-setting column → answer chips → NEXT
      // HAND, all in the one column, instead of a page-wide floating row.
      showAnswer() {
        if (!S.awaitingPay || S.answerRevealed) return;
        S.answerRevealed = true;
        const hintRow = $('bside-hint-row'); if (hintRow) hintRow.style.display = 'none';
        const actionsSlot = $('bside-actions-slot'); if (actionsSlot) actionsSlot.innerHTML = '';
        renderAnswerSpread(computeAnswerChips(S.payTarget));
        const panel = $('bside-comm-panel');
        if (panel) panel.querySelectorAll('.bpay-chip-btn, .comm-pay-btn').forEach(b => b.disabled = true);
        const spread = $('bside-spread-section');
        if (spread) spread.insertAdjacentHTML('afterend', `<div class="bpay-next-round-row bside-next-round-row">
          <button class="bac-cta-btn" onclick="Sims.baccaratSide.nextRound()">NEXT HAND</button>
        </div>`);
      },

      // Perf/perceived-speed fix (2026-08-27) — same as Sims.baccaratPay's
      // own copy, see that one's comment for the root-cause writeup.
      nextRound() {
        if (S.nextTimer) { clearTimeout(S.nextTimer); S.nextTimer = null; }
        const panel = $('bside-comm-panel');
        if (panel) panel.classList.add('bpay-tray-fading');
        this.deal();
      },
    };
  })(),

  // ---- ROULETTE PAYOUT PRACTICE (Option A: single-bet drill) ----
  roulettePay: (() => {
    // Color chips — one is picked at random each round (all same 5,000-won unit value)
    const COLOR_CHIPS = [
      { key: 'white',  val: 5_000, bg: '#f0ece4', fg: '#2a2a2a' },
      { key: 'red',    val: 5_000, bg: '#e53935', fg: '#fff'    },
      { key: 'blue',   val: 5_000, bg: '#1e88e5', fg: '#fff'    },
      { key: 'green',  val: 5_000, bg: '#43a047', fg: '#fff'    },
      { key: 'teal',   val: 5_000, bg: '#00bfa5', fg: '#0a2622' },
      { key: 'orange', val: 5_000, bg: '#fb8c00', fg: '#fff'    },
      { key: 'purple', val: 5_000, bg: '#8e24aa', fg: '#fff'    },
      { key: 'pink',   val: 5_000, bg: '#e91e8c', fg: '#fff'    },
    ];
    const MONEY_CHIPS = [
      { key: '1M',   val: 1_000_000, bg: '#fdd835', fg: '#1a1a1a' },
      { key: '100K', val:   100_000, bg: '#212121', fg: '#fff'    },
      { key: '10K',  val:    10_000, bg: '#2e7d32', fg: '#fff'    },
      { key: '5K',   val:     5_000, bg: '#b5176b', fg: '#fff'    },
    ];
    const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

    // Color-chip visuals used to draw their own hand-rolled SVG rim/dot/
    // highlight overlay (CC_FACE_SVG/CC_DISC_SVG), separate from the CSS
    // radial-gradient + repeating-conic-gradient "real casino chip" look
    // money chips get (.rpay-tray-disc-mc etc. in style.css) — two
    // different edge-marking techniques on what's supposed to read as one
    // chip set is exactly why they looked mismatched. Removed; every chip
    // face/disc/stack-top now shares the same CSS-only treatment instead
    // (see the shared .rpay-tray-disc-mc/-cc, .rpay-tray-stk-face/
    // .rpay-chip-stack-face rules in style.css).

    function genChips(color, maxCount = 5) {
      const count = 1 + Math.floor(Math.random() * maxCount);
      return { chips: { [color.key]: count }, total: color.val * count };
    }

    // Answer reveal (💡, 2026-08-27; color-chip/stack threshold added
    // 2026-08-31) — same mechanism as the baccarat payout pages' own
    // computeAnswerChips(): greedy largest-denom-first breakdown of the
    // target, valid here because MONEY_CHIPS' values (1M/100K/10K/5K) and
    // S.totalTarget are both always exact multiples of 5,000 — every
    // spot's `total` is `color.val (always 5000) * count`, and `pays` is
    // an integer, so `total * pays` (and the sum across all winning
    // spots) stays a multiple of 5000 all the way through. Returns a
    // chips object shaped exactly like S.payChips so showAnswer() can
    // hand it straight to updateTray()/updatePayZone() and reuse their
    // existing chip-pile rendering for free.
    //
    // Dealer-training ask: bets of 5 stacks (1 Stack = 20 Color Chips, so
    // 5 Stacks = 100 chips = 500,000) or less must be shown ENTIRELY in
    // Color Chips, never converted to Money Chips — the trainee is meant
    // to internalize the 1-stack-=-20-chips convention, which a money-
    // chip substitution would short-circuit. Above that threshold the
    // original cash-chip breakdown is unchanged (a 500,000+ payout isn't
    // the "small bet" this rule targets).
    const CC_VAL = COLOR_CHIPS[0].val; // 5,000 — every color chip shares this face value
    const CC_PER_STACK = 20;
    const CC_ONLY_MAX_STACKS = 5;
    function computeAnswerChips(target) {
      // Explicit-zero for every key, matching showTray()'s own
      // S.payChips shape exactly (not just the nonzero denoms) — cheap
      // insurance against any future code that assumes the full key set.
      const chips = { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
      if (target <= CC_ONLY_MAX_STACKS * CC_PER_STACK * CC_VAL) {
        chips.color = target / CC_VAL; // exact — target is always a multiple of 5,000
        return chips;
      }
      let rem = target;
      MONEY_CHIPS.forEach(c => {
        const cnt = Math.floor(rem / c.val);
        if (cnt > 0) { chips[c.key] = cnt; rem -= cnt * c.val; }
      });
      return chips;
    }

    const BET_LABEL = { Straight:'Straight', Split:'Split', Corner:'Corner', Street:'Street', SixNum:'Square' };

    function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

    function getValidSpots(N) {
      const byType = [];

      if (N === 0) {
        byType.push({ type:'Straight', pays:35, nums:[0] });
        byType.push({ type:'Split', pays:17, nums: pick([[0,1],[0,2],[0,3]]) });
        byType.push({ type:'Trio', pays:11, nums: pick([[0,1,2],[0,2,3]]) });
        byType.push({ type:'Basket', pays:8, nums:[0,1,2,3] });
        return byType;
      }

      const row = Math.floor((N-1)/3);
      const col = (N-1) % 3;
      const s1  = row*3+1;

      byType.push({ type:'Straight', pays:35, nums:[N] });

      const splits = [];
      if (col > 0)  splits.push([N-1,N]);
      if (col < 2)  splits.push([N,N+1]);
      if (row > 0)  splits.push([N-3,N]);
      if (row < 11) splits.push([N,N+3]);
      if (splits.length) byType.push({ type:'Split', pays:17, nums: pick(splits) });

      const corners = [];
      if (row > 0  && col > 0) corners.push([N-4,N-3,N-1,N]);
      if (row > 0  && col < 2) corners.push([N-3,N-2,N,N+1]);
      if (row < 11 && col > 0) corners.push([N-1,N,N+2,N+3]);
      if (row < 11 && col < 2) corners.push([N,N+1,N+3,N+4]);
      if (corners.length) byType.push({ type:'Corner', pays:8, nums: pick(corners) });

      byType.push({ type:'Street', pays:11, nums:[s1,s1+1,s1+2] });

      const sixNums = [];
      if (row > 0)  sixNums.push([s1-3,s1-2,s1-1,s1,s1+1,s1+2]);
      if (row < 11) sixNums.push([s1,s1+1,s1+2,s1+3,s1+4,s1+5]);
      if (sixNums.length) byType.push({ type:'SixNum', pays:5, nums: pick(sixNums) });

      return byType;
    }

    function renderFullGrid(N, activeSpots) {
      const tbl = document.getElementById('rpay-full-table');
      if (!tbl) return;
      const stageEl = tbl.querySelector('#rpay-zoom-stage') || tbl;

      // Clear any previous transform state on stage (not the flex item)
      stageEl.style.transition = '';
      stageEl.style.transform = '';
      stageEl.style.transformOrigin = '';

      // Reset win highlight and remove old chip spots/dolly
      tbl.querySelectorAll('.rpay-win-cell').forEach(el => el.classList.remove('rpay-win-cell'));
      tbl.querySelectorAll('.rpay-spot').forEach(el => el.remove());
      tbl.querySelectorAll('.rpay-dolly').forEach(el => el.remove());

      // Highlight winning number
      const winEl = tbl.querySelector(`[data-bet="${N}"]`);
      if (winEl) winEl.classList.add('rpay-win-cell');

      requestAnimationFrame(() => {
        // Measure stage (not tbl) so chip coords are stage-relative
        const sRect = stageEl.getBoundingClientRect();

        // Measure grid dimensions for fixed zoom reference (stage unscaled here)
        const gridEl = stageEl.querySelector('.roulette-grid');
        if (gridEl) {
          const gRect = gridEl.getBoundingClientRect();
          S.zoomGridH  = gRect.height;
          S.zoomGridCy = gRect.top - sRect.top + gRect.height / 2;
        }

        function cc(num) {
          const el = stageEl.querySelector(`[data-bet="${num}"]`);
          if (!el) return null;
          const cell = el.closest('td') || el;
          const r = cell.getBoundingClientRect();
          const ox = r.left - sRect.left;
          const oy = r.top  - sRect.top;
          return {
            x:      ox + r.width/2,
            y:      oy + r.height/2,
            left:   ox,
            right:  ox + r.width,
            top:    oy,
            bottom: oy + r.height,
          };
        }

        activeSpots.forEach((sp, i) => {
          let x, y;
          if (sp.type === 'Straight') {
            const c = cc(N); if (!c) return;
            x = c.x; y = c.y;
          } else if (sp.type === 'Split') {
            const cs = sp.nums.map(n => cc(n)).filter(Boolean);
            if (!cs.length) return;
            // Use actual cell boundaries for exact border placement
            x = (Math.max(...cs.map(c => c.left)) + Math.min(...cs.map(c => c.right))) / 2;
            y = (Math.max(...cs.map(c => c.top))  + Math.min(...cs.map(c => c.bottom))) / 2;
          } else if (sp.type === 'Corner' || sp.type === 'Trio' || sp.type === 'Basket') {
            const cs = sp.nums.map(n => cc(n)).filter(Boolean);
            if (!cs.length) return;
            x = (Math.max(...cs.map(c => c.left)) + Math.min(...cs.map(c => c.right))) / 2;
            y = (Math.max(...cs.map(c => c.top))  + Math.min(...cs.map(c => c.bottom))) / 2;
          } else if (sp.type === 'SixNum' || sp.type === 'Street') {
            const cs = sp.nums.map(n => cc(n)).filter(Boolean);
            if (!cs.length) return;
            x = cs.reduce((s,c) => s+c.x, 0)/cs.length;
            y = Math.min(...cs.map(c => c.top));
          }
          if (x === undefined) return;

          const [[key, cnt]] = Object.entries(sp.chips);
          const c = COLOR_CHIPS.find(b => b.key === key);
          const chipHtml = `<div class="rpay-spot-chip" style="--stk-bg:${c.bg}"><span class="rpay-spot-count" style="color:${c.fg}">${cnt}</span></div>`;

          const el = document.createElement('div');
          el.className = 'rpay-spot';
          el.id = `rpay-spot-${i}`;
          el.style.cssText = `left:${x}px;top:${y}px`;
          el.innerHTML = `<div class="rpay-spot-chips">${chipHtml}</div>`;

          // store bet nums for cell highlighting
          const betNums = sp.type === 'Straight' ? [N] : sp.nums;
          el.dataset.betNums = betNums.join(',');

          // store bbox of bet numbers for zoom
          const bboxNums = betNums;
          const bboxCC = bboxNums.map(n => cc(n)).filter(Boolean);
          if (bboxCC.length) {
            const minL = Math.min(...bboxCC.map(c => c.left));
            const maxR = Math.max(...bboxCC.map(c => c.right));
            const minT = Math.min(...bboxCC.map(c => c.top));
            const maxB = Math.max(...bboxCC.map(c => c.bottom));
            el.dataset.bboxCx = (minL + maxR) / 2;
            el.dataset.bboxCy = (minT + maxB) / 2;
            el.dataset.bboxW  = maxR - minL;
            el.dataset.bboxH  = maxB - minT;
          }

          stageEl.appendChild(el);
        });

        // Dolly marker on winning number
        const winC = cc(N);
        if (winC) {
          const dolly = document.createElement('div');
          dolly.className = 'rpay-dolly';
          dolly.style.cssText = `left:${winC.x}px;top:${winC.y}px`;
          stageEl.appendChild(dolly);
        }

        Sims.roulettePay._startTimer();
        highlightSpot(0);
      });
    }

    function zoomToSpot(idx) {
      const tbl = document.getElementById('rpay-full-table');
      if (!tbl) return;
      const stageEl = tbl.querySelector('#rpay-zoom-stage') || tbl;

      const spotEl = document.getElementById(`rpay-spot-${idx}`);
      if (!spotEl || !spotEl.dataset.bboxCx) {
        stageEl.style.transition = 'transform .35s ease';
        stageEl.style.transform = '';
        stageEl.style.transformOrigin = '';
        return;
      }

      // Viewport = tbl's layout size (unchanged by transform since we zoom the inner stage)
      const vpW = tbl.offsetWidth;
      const vpH = tbl.offsetHeight;
      const cx = parseFloat(spotEl.dataset.bboxCx);

      // Fixed scale: always fit the full 3-row grid (one street height) into the viewport
      const gridH = S.zoomGridH || vpH * 0.6;
      const scale = Math.min(vpH * 0.92 / gridH, 3.5);
      // Stretch horizontally on top of the fitted scale so cells read wider once zoomed in
      // (vertical fit/height stays the same — only column width grows)
      const scaleX = scale * 1.5;
      const scaleY = scale;

      // Always center vertically on the grid's own midpoint (not the winning cell). The grid
      // is sized to fit within the viewport around that midpoint — centering on any other row
      // pushes the opposite row off-screen, which hid a full row when the winner was top/bottom.
      const gridCy = S.zoomGridCy || vpH / 2;

      const dx = vpW / 2 - cx     * scaleX;
      const dy = vpH / 2 - gridCy * scaleY;

      stageEl.style.transition = 'transform .35s ease';
      stageEl.style.transformOrigin = '0 0';
      stageEl.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`;
    }

    function highlightSpot(idx) {
      // All bets are paid together as one total now, so spots are no longer
      // marked "paying"/"already paid" one at a time — this just drives the zoom view
      zoomToSpot(idx);
    }

    function fmtTime(sec) {
      const s = Math.floor(sec);
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
    }

    function showTray() {
      const panel = document.getElementById('rpay-comm-panel');
      if (!panel) return;
      const color = S.roundColor;

      S.payChips = { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
      S.history = [];
      // Fresh hand, fresh answer-reveal state — showAnswer() hides
      // #rpay-hint-btn and S.answerRevealed gates it against a 2nd
      // reveal; both need resetting here same as baccarat's own
      // showCommTray()/showPayTray(). The NEXT HAND row showAnswer()
      // inserts lives OUTSIDE this panel (see that method's own comment),
      // so a plain `panel.innerHTML = ...` rebuild below won't clear it
      // for free — remove it explicitly.
      S.answerRevealed = false;
      const hintBtn = $('rpay-hint-btn');
      if (hintBtn) hintBtn.style.display = '';
      // Undo showAnswer()'s own .rpay-pay-zone-answer toggle (see that
      // method + the class's own CSS comment) — a fresh round needs the
      // bottom padding reserved again since the hint button/warn banner
      // can both be visible during normal betting.
      const zoneEl = $('rpay-pay-zone');
      if (zoneEl) zoneEl.classList.remove('rpay-pay-zone-answer');
      document.querySelector('.rpay-next-round-row')?.remove();

      const ccStk = (bodyClass, lbl) =>
        `<button class="rpay-tray-chip-btn" onclick="Sims.roulettePay.addChip('color',${lbl.slice(1)})">
          <div class="rpay-tray-stk" style="--stk-bg:${color.bg};--stk-fg:${color.fg}">
            <div class="rpay-tray-stk-face"></div>
            <div class="rpay-tray-stk-body ${bodyClass}"></div>
          </div>
          <span class="rpay-tray-chip-lbl">${lbl}</span>
        </button>`;

      panel.innerHTML = `
        <div class="comm-tray rpay-btray">
          <div class="comm-tray-slots">
            <div class="rpay-tray-group">
              <div class="rpay-tray-group-lbl rpay-tray-group-lbl-color">COLOR CHIPS</div>
              <div class="rpay-tray-group-row">
                ${ccStk('rpay-tray-body-20', '+20')}
                ${ccStk('rpay-tray-body-10', '+10')}
                ${ccStk('rpay-tray-body-5',  '+5')}
                <button class="rpay-tray-chip-btn" onclick="Sims.roulettePay.addChip('color',1)">
                  <div class="rpay-tray-disc-cc" style="--stk-bg:${color.bg};--stk-fg:${color.fg}"></div>
                  <span class="rpay-tray-chip-lbl">+1</span>
                </button>
              </div>
            </div>
            <div class="rpay-tray-sep"></div>
            <div class="rpay-tray-group">
              <div class="rpay-tray-group-lbl rpay-tray-group-lbl-cash">CASH CHIPS</div>
              <div class="rpay-tray-group-row">
                ${[...MONEY_CHIPS].reverse().map(c => `
                <button class="rpay-tray-chip-btn" onclick="Sims.roulettePay.addChip('${c.key}',1)">
                  <div class="rpay-tray-disc-mc" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">${c.key}</div>
                  <span class="rpay-tray-chip-lbl">+1</span>
                </button>`).join('')}
              </div>
            </div>
            <div class="comm-pay-slot">
              <button class="comm-pay-btn" onclick="Sims.roulettePay.submitPay()">PAY</button>
            </div>
          </div>
        </div>`;
    }

    function updateTray() {
      const color = S.roundColor;
      const colorVal = color ? color.val : 0;
      let total = (S.payChips.color || 0) * colorVal;
      const cDisc = document.getElementById('rpay-disc-color');
      if (cDisc) {
        const n = S.payChips.color || 0;
        cDisc.textContent = 'CC';
      }
      for (const mc of MONEY_CHIPS) {
        const cnt = S.payChips[mc.key] || 0;
        const disc = document.getElementById(`rpay-disc-${mc.key}`);
        if (disc) disc.textContent = mc.key;
        total += cnt * mc.val;
      }
      updatePayZone();
    }

    function updatePayZone() {
      const zone = document.getElementById('rpay-pay-zone');
      if (!zone || !S.roundColor) return;
      const color = S.roundColor;
      const allChipDefs = [
        { key: 'color', bg: color.bg, fg: color.fg },
        ...[...MONEY_CHIPS].reverse(),
      ];

      // Stack 2D layout positions [col, row] per stack count (1–10)
      const STACK_LAYOUTS = [
        null,
        [[0, 0]],                                                                             // 1: single
        [[0, 1], [1, 0]],                                                                     // 2: diagonal
        [[0, 1], [2, 1], [1, 0]],                                                            // 3: triangle
        [[0, 1], [2, 1], [1, 0], [3, 0]],                                                   // 4: upper-right diamond
        [[0, 0], [2, 0], [4, 0], [1, 1], [3, 1]],                                           // 5: upper-left + 4-stack
        [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2]],                                   // 6: pyramid (1-2-3)
        [[1, 0], [3, 0], [0, 1], [2, 1], [4, 1], [1, 2], [3, 2]],                          // 7: hexagon (2-3-2)
        [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2], [1, 3], [3, 3]],                  // 8: diamond (1-2-3-2)
        [[3, 0], [2, 1], [4, 1], [1, 2], [3, 2], [5, 2], [0, 3], [2, 3], [4, 3]],                  // 9: 8-stack diamond unchanged + 1 stack nested left of bottom row
        [[3, 0], [2, 1], [4, 1], [1, 2], [3, 2], [5, 2], [0, 3], [2, 3], [4, 3], [6, 3]],          // 10: complete 1-2-3-4 triangular pyramid
      ];
      // Scale factor (2026-08-31, explicit ask: enlarge the pay-zone's
      // own chip/stack visuals, bottom baseline held, growing upward) —
      // applied here to the absolute-positioning offsets between stacks
      // within a group, and matched by the same 1.35 multiplier on the
      // CSS side (`.rpay-pay-zone`'s own scoped `--ch-lg`/`--ch-sm`
      // redefinition + stack body/face height overrides, style.css).
      // Both sides MUST move together — this only controls layout
      // spacing; `.rpay-chip-stack`'s own rendered size comes from CSS
      // `var(--ch-lg)`, so if just one side changes, stacks visually
      // overlap or gap incorrectly.
      const PZ_SCALE = 1.35;
      const STK_W = 38 * PZ_SCALE, STK_H = 33 * PZ_SCALE;

      function makeStackGroup(c, label, count) {
        const layout = STACK_LAYOUTS[Math.min(count, 10)];
        const colStep = 16 * PZ_SCALE;
        const rowStep = 14 * PZ_SCALE;
        const maxCol = Math.max(...layout.map(p => p[0]));
        const maxRow = Math.max(...layout.map(p => p[1]));
        const cw = maxCol * colStep + STK_W;
        const ch = maxRow * rowStep + STK_H;
        const isCC = label === 'CC';
        const stackHtml = layout.slice(0, count).map(([col, row]) =>
          `<div class="rpay-chip-stack${isCC ? '' : ' rpay-chip-stack-mc'}" style="--stk-bg:${c.bg};--stk-fg:${c.fg};position:absolute;left:${col*colStep}px;top:${row*rowStep}px;z-index:${(row+1)*10+(maxCol-col+1)}">` +
          (isCC
            ? `<div class="rpay-chip-stack-face"></div><div class="rpay-chip-stack-body"></div>`
            : `<div class="rpay-stack-disc-mc">${label}</div>`) +
          `</div>`
        ).join('');
        return `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">` +
          `<div style="position:relative;width:${cw}px;height:${ch}px;flex-shrink:0">${stackHtml}</div>` +
          `</div>`;
      }

      const parts = [];
      allChipDefs.forEach(c => {
        const cnt = S.payChips[c.key] || 0;
        if (!cnt) return;

        const label = c.key === 'color' ? 'CC' : c.key;
        const isCC2 = label === 'CC';
        const fullStacks = Math.floor(cnt / 20);
        const rem = cnt % 20;
        // Money chips have no smaller "mini-stack" tier in the tray — every
        // remainder chip stays at full tray-disc size, so skip that tier here.
        const miniStacks = isCC2 && rem >= 5 ? Math.max(0, Math.floor(rem / 5) - 1) : 0;
        const spreadCount = rem - miniStacks * 5;

        let fsRem = fullStacks;
        while (fsRem > 0) {
          const chunk = Math.min(fsRem, 10);
          parts.push(makeStackGroup(c, label, chunk));
          fsRem -= chunk;
        }

        if (miniStacks > 0 || spreadCount > 0) {
          let html = `<div class="rpay-cc-spread">`;
          // miniStacks is only ever >0 for color chips (CC) — money chips have
          // no smaller mini-stack tier in the tray, see above.
          for (let i = 0; i < miniStacks; i++) {
            html += `<div class="rpay-chip-stack rpay-mini-stack" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">` +
              `<div class="rpay-chip-stack-face"></div><div class="rpay-chip-stack-body"></div>` +
              `</div>`;
          }
          for (let i = 0; i < spreadCount; i++) {
            const gap = i > 0 && i % 5 === 0 ? ' rpay-disc-gap5' : '';
            html += `<div class="rpay-cc-disc${isCC2 ? '' : ' rpay-cc-disc-mc'}${gap}" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">${isCC2 ? '' : label}</div>`;
          }
          html += `</div>`;
          parts.push(html);
        }
      });

      // Nudge toward money chips when 120+ color chips are set and no money chips are in use
      const colorChipCount = S.payChips.color || 0;
      const moneyChipUsed = MONEY_CHIPS.some(mc => (S.payChips[mc.key] || 0) > 0);
      const warnBanner = document.getElementById('rpay-chip-warn-banner');
      if (warnBanner) {
        warnBanner.style.visibility = (colorChipCount >= 120 && !moneyChipUsed) ? 'visible' : 'hidden';
        // Horizontally centered on the TIMER's own axis (explicit ask),
        // not on `.rpay-pay-zone-wrap` (the banner's own positioning
        // container, which the timer isn't guaranteed to share the exact
        // width of at every viewport) — measured directly via
        // getBoundingClientRect() rather than assumed equal via CSS %,
        // so this stays correct regardless of any width difference
        // between the two. Recomputed on every updatePayZone() call
        // (cheap — this page has few elements) rather than only when the
        // banner becomes visible, so it's never stale.
        const timerEl = document.getElementById('rpay-timer');
        const wrapEl = document.querySelector('.rpay-pay-zone-wrap');
        if (timerEl && wrapEl) {
          const timerRect = timerEl.getBoundingClientRect();
          const wrapRect = wrapEl.getBoundingClientRect();
          warnBanner.style.left = `${(timerRect.left + timerRect.width / 2) - wrapRect.left}px`;
        }
      }

      zone.innerHTML = parts.length
        ? `<div id="rpay-pz-inner" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px;padding-top:.6rem">${parts.join('')}</div>`
        : '<div class="rpay-hint-text">왼쪽 베팅구역 확인하고 칩스를 세팅하세요</div>';
      if (parts.length) fitPayZone(zone);
    }

    // Shrinks #rpay-pz-inner (via transform: scale) so the chip-stack pile
    // never needs zone's own scrollbar, no matter how many stacks/chunks
    // pile up (160+, 320+ chips). The stacks' real painted height (tall,
    // absolutely-positioned pyramids) is bigger than their laid-out box —
    // that mismatch is exactly what used to overflow into a scrollbar — so
    // this measures zone.scrollHeight (which *does* include that paint
    // overflow) rather than the inner wrapper's own getBoundingClientRect.
    // Stack layout/count/labels/logic are untouched; this only ever scales
    // the whole pile down visually to fit the fixed-height pay zone.
    function fitPayZone(zone) {
      const inner = zone.querySelector('#rpay-pz-inner');
      if (!inner) return;
      inner.style.transform = '';
      // Budget only the space actually available to #rpay-pz-inner — zone's
      // own padding doesn't scale with it, so it has to come off availW/H
      // first, not be lumped into the same ratio as the scalable content
      // (that mismatch under-corrected the scale at small/tight viewports).
      const cs = getComputedStyle(zone);
      const availW = Math.max(0, zone.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
      const availH = Math.max(0, zone.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom));
      const naturalW = inner.scrollWidth, naturalH = inner.scrollHeight;
      if (naturalW <= availW && naturalH <= availH) return;
      const scale = Math.max(0, Math.min(1, availW / naturalW, availH / naturalH));
      if (scale > 0 && isFinite(scale)) {
        inner.style.transform = `scale(${scale})`;
        // 'bottom center' (was 'top center', 2026-08-31) — matches
        // .rpay-pay-zone's own justify-content:flex-end (style.css):
        // transform doesn't affect an element's LAYOUT box, so flex
        // positions the pile using its pre-scale size regardless, but the
        // VISUAL bottom edge needs to stay put as it shrinks too (explicit
        // ask: "하단 위치는 그대로 유지"). Scaling from the bottom keeps
        // that edge fixed and lets the top edge move instead, consistent
        // with "grows/shrinks upward from a fixed bottom baseline."
        inner.style.transformOrigin = 'bottom center';
      }
    }

    function showMistake(retry) {
      S.mistakes = (S.mistakes || 0) + 1;
      const mEl = document.getElementById('rpay-mistakes'); if (mEl) mEl.textContent = S.mistakes;
      const tbl = document.querySelector('.rpay-table');
      if (!tbl) { retry(); return; }
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retry(); }, 1600);
    }

    let S = {};
    let hasStarted = false;
    let pzResizeObserver = null;
    const $ = id => document.getElementById(id);

    return {
      _setControlsVisible(visible) {
        const u = $('rpay-undo-btn'); const r = $('rpay-allreset-btn');
        if (u) u.style.visibility = visible ? '' : 'hidden';
        if (r) r.style.visibility = visible ? '' : 'hidden';
      },

      init(isRestart) {
        if (S && S.timerInterval) clearInterval(S.timerInterval);
        if (S && S.nextTimer) clearTimeout(S.nextTimer);
        const wasMidHand = isRestart && hasStarted && S && S.awaitingPay === true;
        const keepRounds = (isRestart && S) ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        S = { winNum: null, spots: [], spotIdx: 0, rounds: keepRounds, score: 0, mistakes: 0, lastNum: null, roundColor: null,
              payChips: { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 },
              history: [], difficulty: 'easy', awaitingPay: false, nextTimer: null,
              timerStart: null, timerInterval: null, answerRevealed: false };
        if ($('rpay-rounds')) $('rpay-rounds').textContent = String(keepRounds);
        hasStarted = false;
        this._setControlsVisible(false);
        const hintBtn = $('rpay-hint-btn');
        if (hintBtn) hintBtn.style.display = 'none';

        // Re-fit the chip pile (no HTML rebuild, just re-measure/re-scale)
        // whenever the pay zone's own box size changes — e.g. an orientation
        // flip mid-round with chips already placed. One observer per page
        // visit; re-pointed at the freshly rendered zone each init().
        if (pzResizeObserver) pzResizeObserver.disconnect();
        const zoneEl = $('rpay-pay-zone');
        if (zoneEl && typeof ResizeObserver !== 'undefined') {
          pzResizeObserver = new ResizeObserver(() => fitPayZone(zoneEl));
          pzResizeObserver.observe(zoneEl);
        }
      },

      setDiff(level) {
        this._stopTimer();
        if (S && S.nextTimer) clearTimeout(S.nextTimer);
        // Re-clicking the same difficulty mid-game is a refresh that keeps
        // accumulating Rounds; a hand still in progress at that moment counts
        // as abandoned (+1 round); switching to a different difficulty resets it.
        const sameContext = hasStarted && S && S.difficulty === level;
        const wasMidHand = sameContext && S.awaitingPay === true;
        const prevRounds = sameContext ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        S = { winNum: null, spots: [], spotIdx: 0, rounds: prevRounds, score: 0, mistakes: 0, lastNum: null, roundColor: null,
              payChips: { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 },
              history: [], difficulty: level, awaitingPay: false, nextTimer: null,
              timerStart: null, timerInterval: null, answerRevealed: false };
        ['easy','medium','hard'].forEach(d => {
          const btn = document.getElementById(`rpay-diff-${d}`);
          if (btn) btn.classList.toggle('rpay-diff-active', d === level);
        });
        if ($('rpay-rounds')) $('rpay-rounds').textContent = String(prevRounds);
        if ($('rpay-score'))  $('rpay-score').textContent  = '0';
        if ($('rpay-mistakes')) $('rpay-mistakes').textContent = '0';
        if ($('rpay-comm-panel')) $('rpay-comm-panel').innerHTML = '';
        if ($('rpay-pay-zone'))   $('rpay-pay-zone').innerHTML   = '';
        const wb = $('rpay-chip-warn-banner'); if (wb) wb.style.visibility = 'hidden';
        const timerEl = $('rpay-timer');
        if (timerEl) { timerEl.className = 'rpay-timer'; timerEl.textContent = '—'; }

        const tbl = document.getElementById('rpay-full-table');
        if (tbl) {
          tbl.querySelectorAll('.rpay-win-cell').forEach(el => el.classList.remove('rpay-win-cell'));
          tbl.querySelectorAll('.rpay-spot').forEach(el => el.remove());
          tbl.querySelectorAll('.rpay-dolly').forEach(el => el.remove());
          const stageEl = tbl.querySelector('#rpay-zoom-stage') || tbl;
          stageEl.style.transition = '';
          stageEl.style.transform = '';
          stageEl.style.transformOrigin = '';
        }

        const ov = $('rpay-start-overlay');
        const wheelEl = $('rpay-wheel-inner');
        if (wheelEl) wheelEl.classList.remove('rpay-wheel-spin-fast');
        if (hasStarted) {
          // Game already in progress: apply the new level immediately instead of
          // showing the START overlay again.
          if (ov) { ov.style.display = 'none'; ov.classList.remove('rpay-start-overlay-zoomout'); }
          this.deal();
        } else {
          if (ov) { ov.style.display = 'flex'; ov.classList.remove('rpay-start-overlay-zoomout'); }
          this._setControlsVisible(false);
        }
      },

      _startTimer() {
        this._stopTimer();
        S.timerStart = performance.now();
        const el = $('rpay-timer');
        if (el) { el.className = 'rpay-timer rpay-timer-running'; el.textContent = '00:00'; }
        S.timerInterval = setInterval(() => {
          const el = $('rpay-timer');
          if (el) el.textContent = fmtTime((performance.now() - S.timerStart) / 1000);
        }, 100);
      },

      _stopTimer() {
        if (S.timerInterval) { clearInterval(S.timerInterval); S.timerInterval = null; }
      },

      startSpin() {
        const overlay     = $('rpay-start-overlay');
        const wheelInner  = $('rpay-wheel-inner');
        const btn         = overlay && overlay.querySelector('.bpay-start-btn');
        if (btn) btn.disabled = true;
        if (wheelInner) wheelInner.classList.add('rpay-wheel-spin-fast');
        setTimeout(() => {
          if (overlay) overlay.classList.add('rpay-start-overlay-zoomout');
          setTimeout(() => {
            if (wheelInner) wheelInner.classList.remove('rpay-wheel-spin-fast');
            if (overlay) overlay.classList.remove('rpay-start-overlay-zoomout');
            if (btn) btn.disabled = false;
            Sims.roulettePay.deal();
          }, 450);
        }, 900);
      },

      deal() {
        hasStarted = true;
        const ov = $('rpay-start-overlay');
        if (ov) ov.style.display = 'none';
        this._setControlsVisible(true);
        this._stopTimer();
        const timerEl = $('rpay-timer');
        if (timerEl) { timerEl.className = 'rpay-timer'; timerEl.textContent = '—'; }
        S.awaitingPay = true;
        if ($('rpay-comm-panel')) $('rpay-comm-panel').innerHTML = '';

        let N;
        do { N = Math.floor(Math.random()*37); } while (N === S.lastNum);
        S.lastNum = N;
        S.winNum = N;
        S.spotIdx = 0;

        const allSpots = getValidSpots(N);
        let filteredSpots;
        let maxChips;
        if (S.difficulty === 'easy' || S.difficulty === 'medium') {
          maxChips = S.difficulty === 'easy' ? 1 : 3;
          // Split into point bets (Straight/Split/Corner) and line bets (Street/SixNum)
          const LINE = new Set(['Street','SixNum']);
          const pts  = allSpots.filter(sp => !LINE.has(sp.type)).sort(() => Math.random()-.5);
          const lns  = allSpots.filter(sp =>  LINE.has(sp.type)).sort(() => Math.random()-.5);
          // 3 total: up to 1 line bet + fill rest with point bets
          const chosen = lns.length ? [lns[0], ...pts.slice(0, 2)] : pts.slice(0, 3);
          filteredSpots = chosen.sort(() => Math.random()-.5); // shuffle order
        } else {
          maxChips = 5;
          filteredSpots = allSpots;
        }
        const roundColor = COLOR_CHIPS[Math.floor(Math.random() * COLOR_CHIPS.length)];
        S.roundColor = roundColor;
        S.spots = filteredSpots.map(sp => {
          const { chips, total } = genChips(roundColor, maxChips);
          return { ...sp, chips, total };
        });
        // All bets share the same color chip, so the dealer totals every winning bet
        // and pays it out once, instead of paying each bet area separately
        S.totalTarget = S.spots.reduce((sum, sp) => sum + sp.total * sp.pays, 0);

        renderFullGrid(N, S.spots);
        showTray();
        updateTray();
      },

      addChip(key, n) {
        S.history.push({ ...S.payChips });
        S.payChips[key] = (S.payChips[key] || 0) + n;
        updateTray();
      },

      resetChip(key) {
        S.history.push({ ...S.payChips });
        S.payChips[key] = 0;
        updateTray();
      },

      resetPay() {
        S.history.push({ ...S.payChips });
        S.payChips = { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
        updateTray();
      },

      undo() {
        if (!S.history || !S.history.length) return;
        S.payChips = S.history.pop();
        updateTray();
      },

      submitPay() {
        // All winning bets share the same color chip, so they're paid as one combined total
        // rather than one bet area at a time
        const target = S.totalTarget || 0;
        const colorVal = S.roundColor ? S.roundColor.val : 0;
        let entered = (S.payChips.color || 0) * colorVal;
        for (const mc of MONEY_CHIPS) {
          entered += (S.payChips[mc.key] || 0) * mc.val;
        }
        if (entered !== target) {
          showMistake(() => {
            S.payChips = { color: 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
            updateTray();
          });
          return;
        }
        this._stopTimer();
        const elapsed = S.timerStart ? (performance.now() - S.timerStart) / 1000 : null;
        const timerEl = $('rpay-timer');
        if (timerEl && elapsed !== null) {
          timerEl.textContent = fmtTime(elapsed);
          timerEl.className = 'rpay-timer rpay-timer-done';
        }
        S.awaitingPay = false;
        S.score++;
        S.rounds++;
        $('rpay-score').textContent = S.score;
        $('rpay-rounds').textContent = S.rounds;
        highlightSpot(-1);
        const tbl = document.querySelector('.rpay-table');
        if (tbl) {
          const ov2 = document.createElement('div');
          ov2.className = 'next-hand-overlay';
          ov2.innerHTML = `<div class="next-hand-text">NEXT HAND</div>${elapsed !== null ? `<div class="next-hand-time">${elapsed.toFixed(1)}s</div>` : ''}`;
          tbl.appendChild(ov2);
          S.nextTimer = setTimeout(() => { ov2.remove(); Sims.roulettePay.deal(); }, 1400);
        }
      },

      // 💡 (2026-08-27) — same approach as the baccarat payout pages'
      // own copies: skips submitPay() entirely (the only place Rounds/
      // Score/Mistakes change here) rather than reusing it with a bypass
      // flag, so an answer-revealed round genuinely can't touch those
      // counters. Reuses updateTray()/updatePayZone()'s existing chip-
      // pile rendering by temporarily pointing S.payChips at the computed
      // answer, instead of building a second rendering path.
      showAnswer() {
        if (!S.awaitingPay || S.answerRevealed) return;
        S.answerRevealed = true;
        const hintBtn = $('rpay-hint-btn'); if (hintBtn) hintBtn.style.display = 'none';
        // UNDO/RESET aren't rebuilt each round here (unlike baccarat's
        // dynamic actionsSlot) — reuse the existing show/hide toggle
        // instead of adding new disabled-state CSS for them. deal()
        // already calls _setControlsVisible(true) for every fresh round,
        // so no explicit re-show is needed on the way back out.
        this._setControlsVisible(false);
        // The hint button and chip-warn banner (both anchored to the
        // bottom of #rpay-pay-zone's reserved padding, see .rpay-pay-
        // zone's own CSS comment) are provably never shown once the
        // answer is revealed — the button is hidden two lines up, and
        // the warning banner's own condition (120+ color chips with no
        // money chips) can't fire on a computed answer (color-only
        // answers cap at 100 chips; money-chip answers use 0 color
        // chips). That reserved space is pure waste here, and it was
        // shrinking fitPayZone()'s budget enough to visibly scale the
        // revealed pile down smaller than a real in-game bet — added
        // before calling updateTray() so the very first fit measures the
        // reclaimed room, not the stale reserved one.
        const zoneEl = $('rpay-pay-zone');
        if (zoneEl) zoneEl.classList.add('rpay-pay-zone-answer');
        S.payChips = computeAnswerChips(S.totalTarget || 0);
        updateTray();
        const panel = $('rpay-comm-panel');
        if (panel) panel.querySelectorAll('.rpay-tray-chip-btn, .comm-pay-btn').forEach(b => b.disabled = true);
        // Inserted as a sibling right after the pay-zone wrapper (not
        // inside #rpay-pay-zone itself, which has `overflow:hidden` and
        // gets its innerHTML fully rebuilt by updateTray() calls) so it
        // survives and sits directly above the tray, same slot baccarat's
        // Commission/Half Pay uses for its own NEXT HAND row.
        const zoneWrap = document.querySelector('.rpay-pay-zone-wrap');
        if (zoneWrap) zoneWrap.insertAdjacentHTML('afterend', `<div class="bpay-next-round-row rpay-next-round-row">
          <button class="bac-cta-btn" onclick="Sims.roulettePay.nextRound()">NEXT HAND</button>
        </div>`);
      },

      // Advances the hand WITHOUT going through submitPay()'s success path
      // (the only place Rounds/Score increment) — this is what actually
      // keeps an answer-revealed round out of the stats, not just the UI
      // change above.
      nextRound() {
        if (S.nextTimer) { clearTimeout(S.nextTimer); S.nextTimer = null; }
        this.deal();
      },
    };
  })(),

  // ---- POKER ----
  poker: (() => {
    function mkSim(key, holeP, holeD, commN) {
      let S = { rounds: 0, score: 0, mistakes: 0, phase: 'idle' };
      const $  = id => document.getElementById(id);
      const sh = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };

      function init(isRestart) {
        const wasMidHand   = isRestart && S.phase === 'quiz';
        const keepRounds   = isRestart ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        const keepScore    = isRestart ? S.score    : 0;
        const keepMistakes = isRestart ? S.mistakes : 0;
        S = { rounds: keepRounds, score: keepScore, mistakes: keepMistakes, phase: 'idle' };
        sh('pk-rounds', S.rounds); sh('pk-score', S.score); sh('pk-mistakes', S.mistakes);
        sh('pk-player-hand', ''); sh('pk-dealer-hand', ''); sh('pk-comm-hand', '');
        sh('pk-player-rank', ''); sh('pk-dealer-rank', '');
        sh('pk-quiz', ''); sh('pk-result', '');
      }

      function deal() {
        if (S.phase === 'quiz') return;
        const deck = createDeck(1);
        S.pH = deck.splice(0, holeP);
        S.dH = deck.splice(0, holeD);
        S.cH = deck.splice(0, commN);
        sh('pk-player-hand', S.pH.map(c => cardHTML(c)).join(''));
        sh('pk-dealer-hand', S.dH.map(c => cardHTML(c)).join(''));
        sh('pk-comm-hand',   S.cH.map(c => cardHTML(c)).join(''));
        sh('pk-player-rank', ''); sh('pk-dealer-rank', '');
        sh('pk-result', '');
        sh('pk-quiz', `<div class="pk-quiz-btns">
          <button class="btn-pk btn-pk-player" onclick="Sims.poker.${key}.answer('player')">PLAYER WINS</button>
          <button class="btn-pk btn-pk-tie"    onclick="Sims.poker.${key}.answer('tie')">TIE</button>
          <button class="btn-pk btn-pk-dealer" onclick="Sims.poker.${key}.answer('dealer')">DEALER WINS</button>
        </div>`);
        const b = $('pk-start-btn');
        if (b) { b.textContent = 'DEAL'; b.disabled = true; }
        S.phase = 'quiz';
      }

      function answer(choice) {
        if (S.phase !== 'quiz') return;
        S.phase = 'done';
        const pEv = bestPokerHand([...S.pH, ...S.cH]);
        const dEv = bestPokerHand([...S.dH, ...S.cH]);
        const cmp = cmpPokerHands(pEv, dEv);
        const winner = cmp > 0 ? 'player' : cmp < 0 ? 'dealer' : 'tie';
        const ok = choice === winner;
        if (ok) S.score++; else S.mistakes++;
        S.rounds++;
        sh('pk-rounds', S.rounds);
        sh('pk-score', S.score);
        sh('pk-mistakes', S.mistakes);
        sh('pk-player-rank', `<span class="pk-rank-lbl">${pEv.l}</span>`);
        sh('pk-dealer-rank',  `<span class="pk-rank-lbl">${dEv.l}</span>`);
        const wText = winner === 'player' ? 'PLAYER WINS' : winner === 'dealer' ? 'DEALER WINS' : 'TIE';
        sh('pk-result', `<div class="pk-result-msg ${ok ? 'pk-ok' : 'pk-wrong'}">${ok ? '✓' : '✗'} ${ok ? 'CORRECT' : 'WRONG'} — ${wText}</div>`);
        sh('pk-quiz', '');
        const b = $('pk-start-btn');
        if (b) { b.textContent = 'NEXT'; b.disabled = false; b.onclick = () => Sims.poker[key].deal(); }
      }

      return { init, deal, answer };
    }

    function mkThpRank() {
      const $ = id => document.getElementById(id);
      let S = {};
      let _cdTimer = null;
      // Pending FLOP/TURN/RIVER reveal setTimeouts — tracked so SKIP can
      // cancel whatever's still queued and jump straight to the end of the
      // reveal chain instead of racing it.
      let _revealTimers = [];
      function clearRevealTimers() {
        _revealTimers.forEach(function(t) { clearTimeout(t); });
        _revealTimers = [];
      }

      // Fixed sample hand for reveal-flow testing
      const SAMPLE = {
        comm: [
          mkCard('A','♠'),
          mkCard('K','♥'),
          mkCard('10','♦'),
          mkCard('8','♣'),
          mkCard('5','♠')
        ],
        dealer: [
          mkCard('J','♥'),
          mkCard('Q','♦')
        ],
        players: [
          [mkCard('2','♣'), mkCard('7','♥')],
          [mkCard('A','♥'), mkCard('2','♦')],
          [mkCard('K','♣'), mkCard('K','♠')],
          [mkCard('9','♠'), mkCard('9','♥')],
          [mkCard('10','♣'), mkCard('J','♣')],
        ]
      };

      function flipHTML(card, id) {
        return '<div class="flip-card thpr-flip" id="thprfc_' + id + '"><div class="flip-inner">' +
          '<div class="flip-back"><div class="card back"><div class="card-pattern"></div></div></div>' +
          '<div class="flip-front">' + cardHTML(card) + '</div>' +
          '</div></div>';
      }

      function reveal(id) {
        const e = $('thprfc_' + id);
        if (e) e.classList.add('revealed');
      }

      function clearCd() {
        if (_cdTimer) { clearInterval(_cdTimer); _cdTimer = null; }
      }

      // label falsy → show just the ticking number ("5", "4", ... ) with no
      // word in front of it, e.g. the FLOP/TURN/RIVER reveal beats.
      // stacked → the ticking number floats above (.thpr-countdown-num,
      // absolutely positioned via bottom:100%) and the label renders as its
      // own boxed pill (.thpr-countdown-prompt) below it, in its usual
      // position — a sentence-length prompt no longer reuses the huge
      // glowing digit style, which clashed with it. FLOP/TURN/RIVER keep
      // the plain inline "LABEL  n" form.
      function countdown(label, secs, done, stacked) {
        clearCd();
        const cd = $('thpr-countdown');
        if (!cd) { done(); return; }
        let n = secs;
        const promptHTML = label ? '<span class="thpr-countdown-prompt">' + label + '</span>' : '';
        const render = n => {
          if (stacked) {
            cd.innerHTML = '<div class="thpr-countdown-num">' + n + '</div>' + promptHTML;
          } else {
            cd.textContent = label ? (label + '  ' + n) : String(n);
          }
        };
        // thpr-countdown-picking pushes the stacked (discard-2 pick) prompt
        // further up, away from the community cards below — the plain
        // inline FLOP/TURN/RIVER countdown keeps its original position.
        var stackedClass = stacked ? ' thpr-countdown-picking' : '';
        cd.className = 'thpr-countdown thpr-countdown-active' + stackedClass;
        render(n);
        _cdTimer = setInterval(function() {
          n--;
          if (n <= 0) {
            clearCd();
            cd.className = 'thpr-countdown thpr-countdown-done' + stackedClass;
            if (stacked) {
              cd.innerHTML = promptHTML;
            } else {
              cd.textContent = label ? (label + '  ✓') : '';
            }
            done();
          } else {
            render(n);
          }
        }, 1000);
      }

      function showAnswerBtns() {
        var b = $('thpr-spot-btns-' + S.activePlayer);
        if (!b) return;
        b.innerHTML =
          '<button class="thpr-pay-btn" onclick="Sims.poker.thpRank.answer(\'pay\')">PAY</button>' +
          '<button class="thpr-tie-btn" onclick="Sims.poker.thpRank.answer(\'tie\')">TIE</button>' +
          '<button class="thpr-take-btn" onclick="Sims.poker.thpRank.answer(\'take\')">TAKE</button>';
      }

      // Builds the same rank-explanation markup shown live under the dealer
      // cards right after answering — reused by each finished hand's "?" button.
      // omitExplain drops the trailing "why the dealer/player won" sentence —
      // used by the "?" modal, which only needs the dealer/player rank info.
      function buildResultHTML(r, omitExplain) {
        var line1, line2;
        if (r.winner === 'TAKE') {
          line1 = 'Dealer: ' + r.dealerRankName;
          line2 = 'Player: ' + r.playerRankName;
        } else {
          line1 = 'Player: ' + r.playerRankName;
          line2 = 'Dealer: ' + r.dealerRankName;
        }
        return '<div class="thpr-result">' +
            '<span class="' + (r.correct ? 'thpr-verdict-ok' : 'thpr-verdict-wrong') + '">' +
              (r.correct ? 'Correct!' : 'Incorrect.') +
            '</span>' +
            '<span class="thpr-result-answer">' +
              (r.correct ? 'Answer: ' : 'Correct answer: ') + r.winner +
            '</span>' +
            '<span>' + line1 + '</span>' +
            '<span>' + line2 + '</span>' +
            (omitExplain ? '' : '<span class="thpr-result-explain">' + r.verboseExplanation + '</span>') +
          '</div>';
      }

      // Compact per-hand result shown directly under that player's own cards
      // the instant that hand is answered correctly (see answer()) — reuses
      // Blackjack's own .spot-status/.s-win/.s-lose/.s-push badge (same
      // markup, same pill/border/tint styling), just sized down for this
      // panel's narrower columns (see the
      // .thp-rank-sim .spot-status override in CSS). No rank breakdown or
      // explanation here — those stay behind the per-hand "?" button
      // (showHandExplain()/buildResultHTML()) instead of being shown
      // automatically while the round is still in progress.
      function buildSpotResultHTML(r) {
        var cls = r.winner === 'PAY' ? 's-win' : r.winner === 'TAKE' ? 's-lose' : 's-push';
        // r.winner is already exactly 'PAY' / 'TAKE' / 'TIE' — no ✓/✕ suffix.
        // Wrong-answer feedback is handled entirely by the separate MISTAKE
        // overlay; this badge only ever renders once a hand is correct, so
        // it doesn't need its own correctness mark.
        return '<div class="spot-status ' + cls + '">' + r.winner + '</div>';
      }

      // Player/Dealer rank lines appended under the badge (never replacing
      // it) once the whole round is over — see endRound(). Kept separate
      // from buildSpotResultHTML() so the in-progress badge-only display
      // above is untouched; this only ever runs after every hand is done.
      function appendHandRanksHTML(r) {
        // Same hand rank on both sides (e.g. both High Card) is exactly
        // when a trainee most needs to see WHAT actually decided it — the
        // (...) qualifier is built from the same tiebreak data
        // getResult()/evalPokerHand() already computed, not a re-judge.
        var playerLine = 'Player: ' + r.playerRankName + (r.playerRankDetail ? ' (' + r.playerRankDetail + ')' : '');
        var dealerLine = 'Dealer: ' + r.dealerRankName + (r.dealerRankDetail ? ' (' + r.dealerRankDetail + ')' : '');
        return '<div class="thpr-spot-result-rank">' + playerLine + '</div>' +
          '<div class="thpr-spot-result-rank">' + dealerLine + '</div>';
      }

      function showHandExplain(p) {
        var r = null;
        for (var i = 0; i < S.results.length; i++) {
          if (S.results[i].player === p) { r = S.results[i]; break; }
        }
        if (!r) return;
        var title = $('thpr-hand-modal-title');
        if (title) title.textContent = 'PLAYER ' + THPR_SEAT_NUM[p - 1];
        var content = $('thpr-hand-modal-content');
        if (content) content.innerHTML = buildResultHTML(r, true);
        var m = $('thpr-hand-modal');
        if (m) m.style.display = 'flex';
      }

      function hideHandExplain(e) {
        if (e) e.stopPropagation();
        var m = $('thpr-hand-modal');
        if (m) m.style.display = 'none';
      }

      // Only added once a finished hand's own turn has passed — not while it's
      // still the active/in-progress hand.
      function addHandHelpBtn(p) {
        var spot = $('thpr-spot-' + p);
        if (!spot || spot.querySelector('.thpr-hand-help-btn')) return;
        spot.insertAdjacentHTML('beforeend',
          '<button class="thpr-hand-help-btn" onclick="event.stopPropagation();Sims.poker.thpRank.showHandExplain(' + p + ')">?</button>');
      }

      // ---- Discard-2 card picking: identify the dealer's best 5-card hand ----
      // from comm 5 + dealer 2 — this runs once per round, for the dealer only.
      // "role" drives which way a picked card slides — community up toward the
      // board, dealer's own cards down toward the seat.
      var PICK_DIR_CLASSES = ['thpr-card-picked-up', 'thpr-card-picked-down'];
      var PICK_PROMPT = '제외할 카드 2장을 선택하세요';
      // Guards settleCard() against overlapping cleanup timers on the same
      // element — if a card gets settled twice in quick succession (e.g. a
      // fast manual deselect/reselect right around a wrong-pick reset), the
      // first call's 200ms cleanup could otherwise fire after the second
      // call re-added thpr-card-pick-settling, tearing it down early and
      // leaving whatever classes are on the card at that instant (possibly
      // a fresh thpr-card-picked-up/-down) to resolve immediately instead
      // of the card actually finishing its return to translateY(0).
      var _settleTimers = new WeakMap();

      function dealerPickSlots() {
        return {
          hole0: { id: 'd0', card: S.dealer[0], role: 'hand' },
          hole1: { id: 'd1', card: S.dealer[1], role: 'hand' },
          comm0: { id: 'comm0', card: S.comm[0], role: 'community' },
          comm1: { id: 'comm1', card: S.comm[1], role: 'community' },
          comm2: { id: 'comm2', card: S.comm[2], role: 'community' },
          comm3: { id: 'comm3', card: S.comm[3], role: 'community' },
          comm4: { id: 'comm4', card: S.comm[4], role: 'community' },
        };
      }

      // Runs once per round, right after the dealer's own 2 cards are revealed —
      // the trainee builds the dealer's best 5-card hand while the customers'
      // hole cards stay face-down. `done` reveals Player 5's cards and jumps
      // straight into the PAY/TAKE/TIE quiz — players don't get their own
      // discard-2 step.
      function beginDealerPick(done) {
        S.phase = 'pick-wait';
        S.pickContext = 'dealer';
        S.dealerPickDone = done;
        S.pickSlots = dealerPickSlots();
        S.pickSelected = [];
        S.pickLocked = false;
        enablePicking();
        countdown(PICK_PROMPT, 10, pickTimeout, true);
      }

      // Picking is enabled the instant the cards open — the countdown IS the
      // 10-second window to choose, not a delay before choosing is allowed.
      function enablePicking() {
        Object.keys(S.pickSlots).forEach(function(key) {
          var slot = S.pickSlots[key];
          var el = $('thprfc_' + slot.id);
          if (!el) return;
          // A card locked in from an earlier correct pick this round stays
          // slid up/down — don't reset its position for the next pick step.
          if (S.lockedPicks.indexOf(slot.id) === -1) {
            el.classList.remove('thpr-card-picked', PICK_DIR_CLASSES[0], PICK_DIR_CLASSES[1]);
          }
          el.classList.add('thpr-card-pick');
          el.onclick = function() { pickCard(key); };
        });
        S.phase = 'picking';
      }

      // The 10s countdown is just a pace-setter, not a deadline — picking
      // stays open past zero so the trainee can keep retrying until correct.
      // Keeps the same boxed-pill markup/classes as countdown()'s stacked
      // render so the prompt's style never changes once time runs out.
      function pickTimeout() {
        if (S.phase !== 'picking' || S.pickLocked) return;
        var cd = $('thpr-countdown');
        if (cd) {
          cd.className = 'thpr-countdown thpr-countdown-picking';
          cd.innerHTML = '<span class="thpr-countdown-prompt">' + PICK_PROMPT + '</span>';
        }
      }

      // Shared by both deselect paths (manual re-click and checkPick()'s wrong-
      // pick auto-reset): drops the picked/direction classes and forces the
      // return trip to land exactly at translateY(0). The pointer is usually
      // still resting on the card being deselected, so the moment
      // thpr-card-picked is gone, the hover-nudge rule
      // (.thpr-card-pick:hover) can match and hijack this same transform
      // mid-transition, leaving the card stuck at the 3px hover offset
      // instead of back at its true 0 position — thpr-card-pick-settling
      // overrides that until the return transition finishes.
      function settleCard(el) {
        el.classList.remove('thpr-card-picked', PICK_DIR_CLASSES[0], PICK_DIR_CLASSES[1]);
        el.classList.add('thpr-card-pick-settling');
        var prev = _settleTimers.get(el);
        if (prev) clearTimeout(prev);
        _settleTimers.set(el, setTimeout(function() {
          el.classList.remove('thpr-card-pick-settling');
          _settleTimers.delete(el);
        }, 200));
      }

      function pickCard(key) {
        if (S.phase !== 'picking' || S.pickLocked || !S.pickSlots[key]) return;
        var slot = S.pickSlots[key];
        var el = $('thprfc_' + slot.id);
        var dirClass = slot.role === 'community' ? 'thpr-card-picked-up' : 'thpr-card-picked-down';
        var idx = S.pickSelected.indexOf(key);
        if (idx >= 0) {
          S.pickSelected.splice(idx, 1);
          // Already locked in from an earlier correct pick this round — deselecting
          // it in this session doesn't slide it back (it was never really "put back").
          if (el && S.lockedPicks.indexOf(slot.id) === -1) settleCard(el);
          return;
        }
        if (S.pickSelected.length >= 2) return;
        S.pickSelected.push(key);
        if (el) el.classList.add('thpr-card-picked', dirClass);
        if (S.pickSelected.length === 2) {
          // Locks further clicks during the brief evaluation window below —
          // does NOT touch the countdown. Selecting/deselecting cards must
          // never clear or pause the timer; only a confirmed-correct pick,
          // the timer's own expiry, Next Hand/Refresh/Reset, or a phase
          // change may do that (see checkPick()'s correct branch, init(),
          // and countdown()'s own n<=0 branch).
          S.pickLocked = true;
          setTimeout(checkPick, 350);
        }
      }

      function checkPick() {
        var keys = Object.keys(S.pickSlots);
        var allCards = keys.map(function(k) { return S.pickSlots[k].card; });
        var remaining = keys
          .filter(function(k) { return S.pickSelected.indexOf(k) === -1; })
          .map(function(k) { return S.pickSlots[k].card; });
        var bestEv = bestPokerHandCards(allCards).ev;
        var userEv = evalPokerHand(remaining);
        var correct = cmpPokerHands(userEv, bestEv) === 0;

        var fb = $('thpr-feedback');

        if (correct) {
          // No "Correct!" message — a correct pick just flows straight into
          // the next hand-processing step.
          if (fb) fb.innerHTML = '';
          // Lock these 2 cards' up/down position for the rest of the round.
          S.pickSelected.forEach(function(key) {
            var id = S.pickSlots[key].id;
            if (S.lockedPicks.indexOf(id) === -1) S.lockedPicks.push(id);
          });
          keys.forEach(function(key) {
            var el = $('thprfc_' + S.pickSlots[key].id);
            if (el) { el.onclick = null; el.classList.remove('thpr-card-pick'); }
          });
          // Correct pick confirmed — this is the legitimate point to stop
          // the SELECT countdown (was previously stopped the instant a 2nd
          // card was picked, before knowing if it was even right).
          clearCd();
          var cd = $('thpr-countdown');
          if (cd) { cd.className = 'thpr-countdown'; cd.textContent = ''; }
          if (S.pickContext === 'dealer') {
            var done = S.dealerPickDone;
            S.dealerPickDone = null;
            if (done) done();
          } else {
            showAnswerBtns();
            S.phase = 'quiz';
          }
        } else {
          var commEl = document.querySelector('.thpr-community-area');
          var dealerEl = $('thpr-dealer-cards');
          var tableEl = document.querySelector('.thpr-table');
          var overlay = $('thpr-wrong-overlay');
          var flashed = S.pickContext === 'dealer' && commEl && dealerEl && tableEl && overlay;
          if (flashed) {
            var tRect = tableEl.getBoundingClientRect();
            var cRect = commEl.getBoundingClientRect();
            var dRect = dealerEl.getBoundingClientRect();
            var top = cRect.top - tRect.top;
            var bottom = dRect.bottom - tRect.top;
            overlay.style.top = top + 'px';
            overlay.style.height = (bottom - top) + 'px';
            overlay.textContent = '랭킹 다시 확인하세요.';
            overlay.style.display = 'flex';
            commEl.classList.add('thpr-dimmed');
            dealerEl.classList.add('thpr-dimmed');
          } else if (fb) {
            fb.innerHTML = '<div class="thpr-pick-result thpr-pick-wrong">랭킹 다시 확인하세요.</div>';
          }
          setTimeout(function() {
            if (flashed) {
              overlay.style.display = 'none';
              commEl.classList.remove('thpr-dimmed');
              dealerEl.classList.remove('thpr-dimmed');
            } else if (fb) {
              fb.innerHTML = '';
            }
            // Settle every unlocked slot, not just the 2 tracked in
            // S.pickSelected — guarantees every card starts the next
            // attempt from translateY(0) regardless of any stray offset
            // left over from a fast deselect/reselect during this attempt.
            Object.keys(S.pickSlots).forEach(function(key) {
              var id = S.pickSlots[key].id;
              if (S.lockedPicks.indexOf(id) !== -1) return;
              var el = $('thprfc_' + id);
              if (el) settleCard(el);
            });
            S.pickSelected = [];
            S.pickLocked = false;
          }, 1300);
        }
      }

      function showRankHelp() {
        var m = $('thpr-rank-modal');
        if (m) m.style.display = 'flex';
      }

      function hideRankHelp(e) {
        if (e) e.stopPropagation();
        var m = $('thpr-rank-modal');
        if (m) m.style.display = 'none';
      }

      function dealRandomHand() {
        var ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        var suits = ['♠','♥','♦','♣'];
        var deck = [];
        ranks.forEach(function(r) {
          suits.forEach(function(s) { deck.push(mkCard(r, s)); });
        });
        // Fisher-Yates shuffle
        for (var i = deck.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
        }
        var idx = 0;
        var players = [];
        for (var p = 0; p < 5; p++) players.push([deck[idx++], deck[idx++]]);
        var comm   = deck.slice(idx, idx + 5); idx += 5;
        var dealer = [deck[idx++], deck[idx++]];
        return { comm: comm, dealer: dealer, players: players };
      }

      function debugHand() {
        if (!S.comm) { console.log('No hand dealt yet.'); return; }
        var all = S.comm.concat(S.dealer);
        S.players.forEach(function(p) { all = all.concat(p); });
        var keys = all.map(function(c) { return c.rank + c.suit; });
        var dupes = keys.filter(function(k, i) { return keys.indexOf(k) !== i; });
        console.log('Cards (' + all.length + '):', keys.join(' '));
        console.log('Community:', S.comm.map(function(c) { return c.rank + c.suit; }).join(' '));
        console.log('Dealer:', S.dealer.map(function(c) { return c.rank + c.suit; }).join(' '));
        S.players.forEach(function(p, i) {
          console.log('Player ' + (i + 1) + ':', p.map(function(c) { return c.rank + c.suit; }).join(' '));
        });
        console.log(dupes.length === 0 ? '✓ No duplicates' : '✗ DUPLICATES: ' + dupes.join(' '));
        return { total: all.length, unique: new Set(keys).size, dupes: dupes };
      }

      function deal(mode) {
        if (S.phase !== 'idle') return;
        S.phase = 'dealing';
        var hand  = (mode === 'test') ? SAMPLE : dealRandomHand();
        S.comm    = hand.comm;
        S.dealer  = hand.dealer;
        S.players = hand.players;
        S.results = [];
        // Discard-2 picks confirmed correct this round stay slid up/down for the
        // rest of the round (a real dealer doesn't put an excluded card back) —
        // this is what resets it. See enablePicking()/pickCard()/checkPick().
        S.lockedPicks = [];

        // Clear previous round's visual state
        for (var _p = 1; _p <= 5; _p++) {
          var _sp = $('thpr-spot-' + _p);
          if (_sp) {
            _sp.classList.remove('thpr-active', 'thpr-pay', 'thpr-take', 'thpr-tie');
            var _hb = _sp.querySelector('.thpr-hand-help-btn');
            if (_hb) _hb.remove();
          }
          var _sb = $('thpr-spot-btns-' + _p);
          if (_sb) _sb.innerHTML = '';
          var _sr = $('thpr-spot-result-' + _p);
          if (_sr) _sr.innerHTML = '';
        }
        var _fb = $('thpr-feedback'); if (_fb) _fb.innerHTML = '';

        // Populate flip-card HTML using dealt cards stored in S
        $('thpr-flop').querySelector('.thpr-group-cards').innerHTML =
          S.comm.slice(0, 3).map(function(c, i) { return flipHTML(c, 'comm' + i); }).join('');
        $('thpr-turn').querySelector('.thpr-group-cards').innerHTML = flipHTML(S.comm[3], 'comm3');
        $('thpr-river').querySelector('.thpr-group-cards').innerHTML = flipHTML(S.comm[4], 'comm4');
        $('thpr-dealer-cards').innerHTML =
          S.dealer.map(function(c, i) { return flipHTML(c, 'd' + i); }).join('');
        for (var p = 1; p <= 5; p++) {
          var hc = document.querySelector('#thpr-spot-' + p + ' .thpr-hole-cards');
          if (hc) hc.innerHTML = S.players[p - 1].map(function(c, i) { return flipHTML(c, 'p' + p + 'c' + i); }).join('');
        }

        // Remove the START/NEXT HAND button outright (not just disable it) —
        // it should vanish the instant the round starts. A SKIP button
        // takes its place for the FLOP/TURN/RIVER reveal phase only —
        // openDealerCards() below removes it again once that phase ends.
        clearRevealTimers();
        var actionRow = $('thpr-action-row');
        if (actionRow) actionRow.innerHTML = '<button class="thpr-start-btn thpr-skip-btn" onclick="Sims.poker.thpRank.skipReveal()"><svg class="thpr-skip-icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M2 5v14l9-7-9-7z" fill="currentColor"/><path d="M12 5v14l9-7-9-7z" fill="currentColor"/></svg>SKIP</button>';

        // Reveal sequence: FLOP → TURN → RIVER → DEALER → PLAYER 5.
        // No countdown number/label shown between streets anymore — just a
        // fixed pause after each reveal, timed like a real dealer turning
        // cards rather than a 5-second on-screen clock. Order/animation
        // (reveal()'s .revealed flip) and everything past RIVER (dealer
        // pick, PLAYER 5 quiz) are unchanged. Each setTimeout's id is
        // stashed in _revealTimers so skipReveal() can cancel whichever of
        // these hasn't fired yet.
        _revealTimers.push(setTimeout(function() {
          reveal('comm0'); reveal('comm1'); reveal('comm2');
          _revealTimers.push(setTimeout(function() {
            reveal('comm3');
            _revealTimers.push(setTimeout(function() {
              reveal('comm4');
              _revealTimers.push(setTimeout(function() {
                openDealerCards();
                _revealTimers.push(setTimeout(function() {
                  beginDealerPick(afterDealerPick);
                }, 900));
              }, 1500)); // River -> dealer cards
            }, 1500)); // Turn -> River
          }, 1500)); // Flop -> Turn
        }, 400));
      }

      // Shared tail of the reveal chain (both the normal timed path above
      // and skipReveal() below end here) — dealer's own discard-2 pick,
      // then PLAYER 5's turn once that's resolved.
      function afterDealerPick() {
        reveal('p5c0'); reveal('p5c1');
        var spot5 = $('thpr-spot-5');
        if (spot5) spot5.classList.add('thpr-active');
        S.activePlayer = 5;
        showAnswerBtns();
        S.phase = 'quiz';
      }
      // Clears the SKIP button (its phase is over) and opens the dealer's
      // own 2 cards — customers' hole cards stay face-down through the
      // dealer's discard-2 pick and only flip once that's done, not
      // simultaneously with the dealer's own cards.
      function openDealerCards() {
        var actionRow = $('thpr-action-row');
        if (actionRow) actionRow.innerHTML = '';
        reveal('d0'); reveal('d1');
      }

      // SKIP: only visible during the FLOP/TURN/RIVER reveal phase (see
      // deal() above). Cancels whatever reveal setTimeout is still pending,
      // reveals every community + dealer card immediately, and jumps
      // straight into the discard-2 pick — skipping the normal path's
      // 900ms pre-pick pause too, since that pause is part of the reveal
      // *presentation* this button exists to skip, not part of the pick
      // step itself. This is exactly "즉시 10초 카운트 시작":
      // beginDealerPick() starts that countdown itself, immediately, once
      // called here with no pause in front of it. Hand-evaluation,
      // PAY/TIE/TAKE, and card-placement logic are all untouched — this
      // only ever short-circuits the timing of reveal().
      function skipReveal() {
        if (S.phase !== 'dealing') return;
        clearRevealTimers();
        reveal('comm0'); reveal('comm1'); reveal('comm2');
        reveal('comm3'); reveal('comm4');
        openDealerCards();
        beginDealerPick(afterDealerPick);
      }

      function answer(choice) {
        if (S.phase !== 'quiz') return;
        S.phase = 'answering';

        var playerCards = [...S.players[S.activePlayer - 1], ...S.comm];
        var dealerCards = [...S.dealer, ...S.comm];
        var result = getResult(dealerCards, playerCards);
        var correct = choice.toUpperCase() === result.winner;

        // Clear answer buttons while this attempt resolves
        var spotBtns = $('thpr-spot-btns-' + S.activePlayer);
        if (spotBtns) spotBtns.innerHTML = '';

        if (correct) S.score++; else S.mistakes++;
        var scEl = $('thpr-score'); if (scEl) scEl.textContent = S.score;
        var mEl = $('thpr-mistakes'); if (mEl) mEl.textContent = S.mistakes;

        if (correct) {
          // Only a confirmed-correct answer is recorded — this is the final
          // result for the hand, used by endRound()'s reference and this
          // hand's own re-openable "?" explanation (showHandExplain()). A
          // wrong attempt is retried (see below) and never recorded, so
          // S.results never ends up with more than one entry per player.
          S.results.push({
            player: S.activePlayer,
            winner: result.winner,
            playerRankName: result.playerRankName,
            dealerRankName: result.dealerRankName,
            playerRankDetail: result.playerRankDetail,
            dealerRankDetail: result.dealerRankDetail,
            verboseExplanation: result.verboseExplanation,
            correct: true
          });

          var spot = $('thpr-spot-' + S.activePlayer);
          if (spot) {
            spot.classList.remove('thpr-active');
            spot.classList.add('thpr-' + result.winner.toLowerCase());
          }

          // Show this hand's own CORRECT + PAY/TAKE/TIE result right under
          // its cards immediately, instead of waiting for endRound() to
          // build it once the whole round is done.
          var box = $('thpr-spot-result-' + S.activePlayer);
          if (box) box.innerHTML = buildSpotResultHTML(S.results[S.results.length - 1]);

          var a = $('thpr-action-row');
          if (a) a.innerHTML = '';

          S.phase = 'transitioning';
          setTimeout(function() {
            if (S.phase === 'transitioning') next();
          }, 600);
        } else {
          // Wrong — retry the SAME hand instead of advancing. Same
          // MISTAKE! flash used across the other games, then this player's
          // answer buttons reappear so the trainee tries again; the spot
          // stays active/un-recorded until they get it right.
          var tbl = document.querySelector('.thpr-table');
          var retry = function() {
            showAnswerBtns();
            S.phase = 'quiz';
          };
          if (tbl) {
            var ov = document.createElement('div');
            ov.className = 'mistake-overlay';
            ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
            tbl.appendChild(ov);
            setTimeout(function() { ov.remove(); retry(); }, 1600);
          } else {
            retry();
          }
        }
      }

      // Class names in this app that represent transient per-hand
      // interaction/animation state (the active-turn pulse, and the
      // dealer-pick "raised"/selected card-offset classes, in case they
      // were ever left on a hole card) — never anything that renders the
      // PAY/TIE/TAKE result itself (thpr-pay/thpr-take/thpr-tie on the
      // spot, .spot-status/.s-win/.s-lose/.s-push on the result badge,
      // .revealed on the cards). Swept off a hand's spot + hole cards the
      // instant we move on to the next one, alongside any inline
      // `transform` left on them, so nothing about how that hand looked
      // mid-turn can still be sitting on its DOM once it's done — only
      // the frozen result badge should remain.
      var TRANSIENT_HAND_STATE_CLASSES = [
        'thpr-active',
        'thpr-card-pick', 'thpr-card-picked',
        'thpr-card-picked-up', 'thpr-card-picked-down', 'thpr-card-pick-settling'
      ];
      function clearTransientHandState(p) {
        var spot = $('thpr-spot-' + p);
        if (!spot) return;
        var els = [spot].concat(Array.prototype.slice.call(spot.querySelectorAll('.flip-card, .flip-inner')));
        els.forEach(function(el) {
          TRANSIENT_HAND_STATE_CLASSES.forEach(function(cls) { el.classList.remove(cls); });
          if (el.style.transform) el.style.transform = '';
        });
      }

      function next() {
        var fb = $('thpr-feedback');
        if (fb) { fb.innerHTML = ''; }
        clearTransientHandState(S.activePlayer);
        addHandHelpBtn(S.activePlayer);
        S.activePlayer--;
        if (S.activePlayer < 1) { endRound(); return; }
        reveal('p' + S.activePlayer + 'c0');
        reveal('p' + S.activePlayer + 'c1');
        var spot = $('thpr-spot-' + S.activePlayer);
        if (spot) spot.classList.add('thpr-active');
        showAnswerBtns();
        S.phase = 'quiz';
      }

      function endRound() {
        S.rounds++;
        var rEl = $('thpr-rounds'); if (rEl) rEl.textContent = S.rounds;

        var cd = $('thpr-countdown');
        if (cd) { cd.className = 'thpr-countdown'; cd.textContent = ''; }

        // Each hand's PAY/TAKE/TIE badge (buildSpotResultHTML()) is already
        // written under that player's own cards the instant it's answered
        // correctly (answer()) and stays untouched here. Now that the whole
        // round is done and NEXT HAND is about to show, append the Player/
        // Dealer rank lines under each hand's existing badge — this is the
        // one point where that detail becomes visible; during the round
        // only the badge shows.
        S.results.forEach(function(r) {
          var box = $('thpr-spot-result-' + r.player);
          if (box) box.insertAdjacentHTML('beforeend', appendHandRanksHTML(r));
        });

        var a = $('thpr-action-row');
        if (a) a.innerHTML = '<button class="thpr-start-btn" onclick="Sims.poker.thpRank.deal()">NEXT HAND</button>';

        S.phase = 'idle';
      }

      function init(isRestart) {
        clearCd();
        clearRevealTimers();
        var wasMidHand   = isRestart && S && S.phase && S.phase !== 'idle';
        var keepRounds   = isRestart && S ? S.rounds + (wasMidHand ? 1 : 0) : 0;
        var keepScore    = isRestart && S ? S.score    : 0;
        var keepMistakes = isRestart && S ? S.mistakes : 0;
        S = { rounds: keepRounds, score: keepScore, mistakes: keepMistakes, phase: 'idle', activePlayer: null, results: [] };
        var r = $('thpr-rounds');    if (r)  r.textContent  = S.rounds;
        var sc = $('thpr-score');    if (sc) sc.textContent = S.score;
        var mi = $('thpr-mistakes'); if (mi) mi.textContent = S.mistakes;
        var f = $('thpr-feedback');  if (f)  f.innerHTML    = '';
        var cd = $('thpr-countdown');
        if (cd) { cd.textContent = ''; cd.className = 'thpr-countdown'; }
        var a = $('thpr-action-row');
        if (a) a.innerHTML = '<button class="thpr-start-btn" id="thpr-start-btn" onclick="Sims.poker.thpRank.deal()">START</button>';

        // Reset all cards to face-down placeholders
        var resetGroup = function(gid, n) {
          var g = $(gid); if (!g) return;
          g.querySelector('.thpr-group-cards').innerHTML = Array(n).fill(cardHTML(null, true)).join('');
        };
        resetGroup('thpr-flop', 3);
        resetGroup('thpr-turn', 1);
        resetGroup('thpr-river', 1);
        var dc = $('thpr-dealer-cards');
        if (dc) dc.innerHTML = Array(2).fill(cardHTML(null, true)).join('');
        for (var p = 1; p <= 5; p++) {
          var hc = document.querySelector('#thpr-spot-' + p + ' .thpr-hole-cards');
          if (hc) hc.innerHTML = Array(2).fill(cardHTML(null, true)).join('');
          var sp = $('thpr-spot-' + p);
          if (sp) {
            sp.classList.remove('thpr-active', 'thpr-pay', 'thpr-take', 'thpr-tie');
            var hb = sp.querySelector('.thpr-hand-help-btn');
            if (hb) hb.remove();
          }
          var sr = $('thpr-spot-result-' + p);
          if (sr) sr.innerHTML = '';
        }
        var hm = $('thpr-hand-modal'); if (hm) hm.style.display = 'none';
      }

      return { init, deal, answer, next, skipReveal, debugHand, showRankHelp, hideRankHelp, showHandExplain, hideHandExplain };
    }

    return {
      isp: mkSim('isp', 5, 5, 0),
      tcp: mkSim('tcp', 3, 3, 2),
      thpRank: mkThpRank(),
    };
  })(),
};

// ============================================================
//  ROULETTE LAYOUT BUILDERS
// ============================================================


function buildWheel() {
  const WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  return WHEEL.map((n, i) => {
    const cls = n === 0 ? 'g' : RED_NUMS.has(n) ? 'r' : 'b';
    const deg = (i * (360 / 37)).toFixed(2);
    return `<div class="rpay-wheel-pocket rpay-wheel-pocket-${cls}" style="--rot:${deg}deg"><span class="rpay-wheel-pocket-num">${n}</span></div>`;
  }).join('');
}

function buildBettingTable() {
  const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  // Dealer-side layout: outside bets on top, grid below
  // 2TO1 on left, numbers right-to-left, 0 on right
  // Row 0 (top): 34,31,...,4,1
  // Row 1 (mid): 35,32,...,5,2
  // Row 2 (bot): 36,33,...,6,3
  const rows = [
    Array.from({length:12}, (_,i) => 34 - i*3),  // 34,31,...,1
    Array.from({length:12}, (_,i) => 35 - i*3),  // 35,32,...,2
    Array.from({length:12}, (_,i) => 36 - i*3),  // 36,33,...,3
  ];
  const colBets = ['col1','col2','col3'];

  let inner = `<div class="evens-row">
    <div class="bet-spot outside" data-bet="high">19-36</div>
    <div class="bet-spot outside" data-bet="odd">Odd</div>
    <div class="bet-spot outside black-bet" data-bet="black">●</div>
    <div class="bet-spot outside red-bet" data-bet="red">●</div>
    <div class="bet-spot outside" data-bet="even">Even</div>
    <div class="bet-spot outside" data-bet="low">1-18</div>
  </div>
  <div class="dozens-row">
    <div class="bet-spot outside" data-bet="dozen3">3rd 12</div>
    <div class="bet-spot outside" data-bet="dozen2">2nd 12</div>
    <div class="bet-spot outside" data-bet="dozen1">1st 12</div>
  </div>`;

  inner += `<table class="roulette-grid">`;
  inner += `<colgroup><col class="rg-col-bet">${'<col class="rg-col-num">'.repeat(12)}<col class="rg-col-zero"></colgroup>`;
  inner += `<tbody>`;
  rows.forEach((row, ri) => {
    inner += `<tr>`;
    inner += `<td><div class="bet-spot col-bet" data-bet="${colBets[ri]}"><span>2TO1</span></div></td>`;
    row.forEach(n => {
      const cls = RED_NUMS.has(n) ? 'red-num' : 'black-num';
      inner += `<td><div class="bet-spot ${cls}" data-bet="${n}">${n}</div></td>`;
    });
    if (ri === 0) inner += `<td rowspan="3" class="zero-cell"><div class="bet-spot green-num" data-bet="0">0</div></td>`;
    inner += `</tr>`;
  });
  inner += `</tbody></table>`;

  return `<div id="rpay-zoom-stage" class="rpay-zoom-stage">${inner}</div>`;
}

// The top-bar title's card icon (index.html's #top-bar-hero-cards) used
// to be static markup — its own hand-rolled .hcard/.hcard-corner/
// .hcard-center divs, a duplicate of the look Views.home()'s hero used
// to have before THAT was migrated to real cardHTML() (see
// [[project_home_hero_cards]] in memory). This one got missed at the
// time, so it kept rendering plain suit-symbol mini-cards instead of the
// real J/Q/K illustration system. Same fix, same fan arrangement/
// rotation values as Views.home()'s hero — .top-bar-hero-cards
// (style.css) already carries its own --card-w-lg/-h-lg + corner-font
// vars scoped to match, so nothing about position/size/layout changes,
// only what's rendered inside each slot.
function renderTopBarHeroCards() {
  const el = document.getElementById('top-bar-hero-cards');
  if (!el) return;
  el.innerHTML = `
    <div class="hcard-slot" style="transform:rotate(-18deg) translate(-6px,8px)">${cardHTML({ rank: 'A', suit: '♥', red: true })}</div>
    <div class="hcard-slot" style="transform:rotate(5deg) translate(6px,-10px)">${cardHTML({ rank: 'K', suit: '♠', red: false })}</div>
    <div class="hcard-slot" style="transform:rotate(22deg) translate(20px,6px)">${cardHTML({ rank: 'Q', suit: '♦', red: true })}</div>`;
}

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => { renderTopBarHeroCards(); App.init(); });
