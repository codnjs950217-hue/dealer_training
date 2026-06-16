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

function cardHTML(c, faceDown = false) {
  if (faceDown) return `<div class="card back"><div class="card-pattern"></div></div>`;
  return `
    <div class="card ${c.red ? 'red' : ''}">
      <div class="card-corner top"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span></div>
      <div class="card-suit-center">${c.suit}</div>
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
  reload() { this.navigate(this._game, this._mode); },
  navigate(game, mode) {
    this._game = game; this._mode = mode || null;
    this.closeSidebar();
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
      Sims[game] && Sims[game].init();
    }
    if (mode === 'paysim' && game === 'baccarat') {
      el.innerHTML = Views.baccaratPaySim();
      Sims.baccaratPay && Sims.baccaratPay.init();
    }
    if (mode === 'paysim' && game === 'roulette') {
      el.innerHTML = Views.roulettePaySim();
      Sims.roulettePay && Sims.roulettePay.init();
    }
    if (game === 'poker') {
      if (mode === 'isp') { el.innerHTML = Views.ispSim(); Sims.poker.isp.init(); }
      if (mode === 'tcp') { el.innerHTML = Views.tcpSim(); Sims.poker.tcp.init(); }
      if (mode === 'thp') { el.innerHTML = Views.thpRankSim(); Sims.poker.thpRank.init(); }
    }
    window.scrollTo(0, 0);
  },
  init() { this.navigate('home'); }
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
          <div class="hcard red" style="transform:rotate(-18deg) translate(-6px,8px)">
            <div class="hcard-corner">A<br>♥</div>
            <div class="hcard-center">♥</div>
          </div>
          <div class="hcard" style="transform:rotate(5deg) translate(6px,-10px)">
            <div class="hcard-corner">K<br>♠</div>
            <div class="hcard-center">♠</div>
          </div>
          <div class="hcard red" style="transform:rotate(22deg) translate(20px,6px)">
            <div class="hcard-corner">Q<br>♦</div>
            <div class="hcard-center">♦</div>
          </div>
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
            <button class="home-game-btn" onclick="App.navigate('poker','thp')">THP Ranking</button>
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
      <div class="sim-page">
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
    <div class="sim-page blackjack-sim">
      <div class="blackjack-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bj-rounds">0</strong></span>
          <span>Score: <strong id="bj-score">0</strong></span>
        </div>
        <div class="bj-start-bar">
          <button class="bj-start-btn" id="bj-start-btn" onclick="Sims.blackjack.newGame()">Start</button>
        </div>
        <div class="bj-play-area">
          <div class="players-row">
            ${[0,1,2,3,4].map(i => `
              <div class="player-spot" id="bj-spot-${i}">
                <div class="hand-display" id="bj-hand-${i}"><div class="hand-cards"></div></div>
                <div class="spot-status-wrap" id="bj-status-${i}"></div>
                <div class="spot-inline-act" id="bj-spot-act-${i}"></div>
                <div class="area-label">P${i < 3 ? i+1 : i+2}</div>
              </div>`).join('')}
          </div>
          <div class="dealer-area-bj" id="bj-dealer-wrap">
            <div class="area-label">DEALER</div>
            <div class="hand-display" id="bj-dealer-hand"></div>
            <div class="dealer-ctrl-area" id="bj-dealer-controls"></div>
          </div>
        </div>
      </div>
    </div>`,

  baccaratSim: () => `
    <div class="sim-page baccarat-sim">
      <div class="baccarat-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bac-rounds">0</strong></span>
          <span>Score: <strong id="bac-score">0</strong></span>
        </div>
        <div class="bac-btn-cluster bac-btn-cluster-quiz">
          <div class="bac-bclust-side" id="bac-b-btn-top"></div>
          <div class="bac-bclust-mid" id="bac-tie-btn"></div>
          <div class="bac-bclust-side" id="bac-p-btn-top"></div>
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
            <div class="bac-third-slot" id="bac-bh3"></div>
            <div class="bac-hand-wrap bac-bh-wrap" id="bac-bh"></div>
          </div>
          <div class="bac-field-divider"></div>
          <div class="bac-player-zone">
            <div class="bac-zone-lbl bac-lbl-player">PLAYER</div>
            <div class="bac-hand-wrap bac-ph-wrap" id="bac-ph"></div>
            <div class="bac-third-slot" id="bac-ph3"></div>
          </div>
        </div>
        <div class="bac-btn-cluster">
          <div class="bac-bclust-side" id="bac-b-btn-bot"></div>
          <div class="bac-bclust-mid"><div class="result-badge" id="bac-result"></div></div>
          <div class="bac-bclust-side" id="bac-p-btn-bot"></div>
        </div>
        <div class="bac-winner-flash" id="bac-winner-flash"></div>
        <button class="bac-next-hand-btn" id="bac-next-btn" style="display:none" onclick="Sims.baccarat.deal()">Next Hand ›</button>
        <div class="bac-start-bar" id="bac-start-bar">
          <button class="bac-start-top-btn" id="bac-draw-btn" onclick="Sims.baccarat.deal()">START</button>
        </div>
      </div>
      <div class="bac-pay-panel" id="bac-pay-panel" style="display:none"></div>
    </div>`,

  roulettePaySim: () => `
    <div class="sim-page rpay-sim">
      <div class="rpay-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="rpay-rounds">0</strong></span>
          <span>Score: <strong id="rpay-score">0</strong></span>
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
            <button class="bpay-start-btn" onclick="Sims.roulettePay.deal()">START</button>
          </div>
        </div>
        <div class="rpay-right-col">
          <div class="rpay-timer" id="rpay-timer">—</div>
          <div class="rpay-undo-row">
            <button class="comm-undo-btn" onclick="Sims.roulettePay.undo()">↩ UNDO</button>
            <button class="comm-all-reset-btn" onclick="Sims.roulettePay.resetPay()">ALL RESET</button>
          </div>
          <div class="rpay-pay-zone" id="rpay-pay-zone"></div>
          <div class="rpay-tray-row" id="rpay-comm-panel"></div>
        </div>
      </div>
    </div>`,

  baccaratPaySim: () => `
    <div class="sim-page baccarat-sim">
      <div class="bpay-mode-row">
        <button class="table-refresh-btn bpay-hdr-btn" onclick="Sims.baccaratPay.restart()" title="Restart">↺</button>
        <div class="bpay-mode-btns">
          <button id="bpay-btn-commission" class="bpay-mode-btn active" onclick="Sims.baccaratPay.setMode('commission')">💰 Commission (5%)</button>
          <button id="bpay-btn-halfpay"    class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('halfpay')">½ Half Pay</button>
          <button id="bpay-btn-side"       class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('side')">🎯 Option Bet</button>
        </div>
        <div class="bpay-hdr-stats">
          <div id="bpay-stats-comm" style="display:flex;gap:.4rem">
            <span>Rounds: <strong id="bpay-rounds">0</strong></span>
            <span>Score: <strong id="bpay-score">0</strong></span>
          </div>
          <div id="bpay-stats-side" style="display:none;gap:.4rem">
            <span>Rounds: <strong id="bside-rounds">0</strong></span>
            <span>Score: <strong id="bside-score">0</strong></span>
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
          <div class="bpay-spread-section" id="bpay-spread-section" style="display:flex"></div>
          <div class="bpay-comm-panel" id="bpay-comm-panel"></div>
        </div>
      </div>
      <div id="bside-content" class="bside-sim" style="display:none">
        <div class="baccarat-table">
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
          <div class="bpay-comm-panel" id="bside-comm-panel" style="display:none"></div>
        </div>
      </div>
    </div>`,

  baccaratSideSim: () => `
    <div class="sim-page baccarat-sim bside-sim">
      <div class="baccarat-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="bside-rounds">0</strong></span>
          <span>Score: <strong id="bside-score">0</strong></span>
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
    <div class="sim-page poker-sim">
      <div class="poker-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
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
    <div class="sim-page poker-sim">
      <div class="poker-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
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
    <div class="sim-page thp-rank-sim">
      <div class="thpr-table">
        <button class="table-refresh-btn" onclick="App.reload()" title="Restart">↺</button>
        <div class="table-stats-overlay">
          <span>Rounds: <strong id="thpr-rounds">0</strong></span>
          <span>Score: <strong id="thpr-score">0</strong></span>
        </div>

        <div class="thpr-players-row">
          ${[1,2,3,4,5].map(i => `
            <div class="thpr-player-spot" id="thpr-spot-${i}">
              <div class="thpr-spot-label">Player ${i}</div>
              <div class="thpr-hole-wrap">
                <div class="thpr-hole-cards">
                  ${cardHTML(null, true)}${cardHTML(null, true)}
                </div>
              </div>
              <div class="thpr-spot-btns" id="thpr-spot-btns-${i}"></div>
            </div>`).join('')}
        </div>

        <div class="thpr-community-area">
          <div class="thpr-community-row">
            <div class="thpr-comm-group" id="thpr-flop">
              <div class="thpr-group-cards">
                ${cardHTML(null, true)}${cardHTML(null, true)}${cardHTML(null, true)}
              </div>
              <div class="thpr-group-label">FLOP</div>
            </div>
            <div class="thpr-comm-sep"></div>
            <div class="thpr-comm-group" id="thpr-turn">
              <div class="thpr-group-cards">${cardHTML(null, true)}</div>
              <div class="thpr-group-label">TURN</div>
            </div>
            <div class="thpr-comm-sep"></div>
            <div class="thpr-comm-group" id="thpr-river">
              <div class="thpr-group-cards">${cardHTML(null, true)}</div>
              <div class="thpr-group-label">RIVER</div>
            </div>
          </div>
          <div class="thpr-countdown" id="thpr-countdown"></div>
        </div>

        <div class="thpr-dealer-area">
          <div class="thpr-area-label">DEALER</div>
          <div class="thpr-dealer-cards" id="thpr-dealer-cards">
            ${cardHTML(null, true)}${cardHTML(null, true)}
          </div>
        </div>

        <div class="thpr-controls">
          <div class="thpr-feedback" id="thpr-feedback"></div>
          <div class="thpr-action-row" id="thpr-action-row">
            <button class="thpr-start-btn" id="thpr-start-btn" onclick="Sims.poker.thpRank.deal()">START</button>
          </div>
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

function valToRank(v) {
  return v === 14 ? 'A' : v === 13 ? 'K' : v === 12 ? 'Q' : v === 11 ? 'J' : String(v);
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
    const stats   = ()    => { $('bj-rounds').textContent = S.rounds; $('bj-score').textContent = S.score; };
    const dealerCtrl      = h => { const e = $('bj-dealer-controls'); if (e) e.innerHTML = h; };
    const clearDealerCtrl = () => { const e = $('bj-dealer-controls'); if (e) e.innerHTML = ''; };
    const setSpotAct  = (i, h) => { const e = $(`bj-spot-act-${i}`); if (e) e.innerHTML = h; };
    const clearSpotAct = i     => { const e = $(`bj-spot-act-${i}`); if (e) e.innerHTML = ''; };
    const enableStart  = ()    => { const e = $('bj-start-btn'); if (e) { e.disabled = false; e.style.opacity = ''; e.textContent = 'Start'; } };
    const disableStart = ()    => { const e = $('bj-start-btn'); if (e) { e.disabled = true;  e.style.opacity = '0.4'; } };

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
    function adjustDealerLayout() {
      const wrapEl = $('bj-dealer-wrap');
      const handEl = $('bj-dealer-hand');
      const ctrlEl = $('bj-dealer-controls');
      if (!wrapEl || !handEl) return;
      const cards = handEl.querySelectorAll('.bj-flip-card');
      if (cards.length <= 1) { cards.forEach(c => c.style.marginLeft = ''); return; }
      const ctrlW = ctrlEl ? ctrlEl.offsetWidth : 0;
      const gapPx = parseFloat(getComputedStyle(wrapEl).gap) || 8;
      const availW = wrapEl.offsetWidth - ctrlW - gapPx;
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
      win:  '<div class="spot-status s-win">PAY ✓</div>',
      lose: '<div class="spot-status s-lose">TAKE ✕</div>',
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
      wrap.appendChild(inner);
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

    function advancePlayer() {
      if (S.current >= 0) clearSpotAct(S.current);
      S.current++;
      while (S.current < N) {
        if (S.players[S.current].status === 'active') break;
        S.current++;
      }
      if (S.current >= N) {
        S.dealerPhase = true;
        S.phase = 'dealer';
        renderPlayers();
        actions('');
        showDealerControls();
        return;
      }
      renderPlayers();
      autoDecide();
    }

    function startPayTest() {
      for (let i = 0; i < N; i++) clearSpotAct(i);
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
      renderPlayers();
      msg(`Player ${i + 1}: Pay, Push, or Take?`);
      actions('');
    }

    function showFinalResult() {
      S.phase = 'done';
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
        setTimeout(() => { ov.remove(); Sims.blackjack.newGame(); }, 1600);
      } else {
        setTimeout(() => Sims.blackjack.newGame(), 1600);
      }
    }

    return {
      init() {
        S = { deck: createDeck(6), players: [], dh: [], current: 0, dealerPhase: false,
              rounds: 0, score: 0, pendingAction: null, payTestIdx: 4, phase: 'idle' };
        bjFlipId = 0;
      },

      newGame() {
        if (S.deck.length < 30) S.deck = createDeck(6);
        S.players = Array.from({length: N}, () => ({ hand: [], status: 'active', hideCards: false }));
        S.dh = [];
        S.current = 0;
        S.dealerPhase = false;
        S.pendingAction = null;
        S.payTestIdx = 4;
        S.phase = 'player';
        S.rounds++;
        for (let i = 0; i < N; i++) {
          clearSpotAct(i);
          const st = $(`bj-status-${i}`); if (st) st.innerHTML = '';
          const sp = $(`bj-spot-${i}`);   if (sp) sp.className = 'player-spot';
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
        // Dealer upcard: 8% chance of ace
        S.dh.push(Math.random() < .08 ? pullRank('A') : S.deck.pop());

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
      { init: [['7','♦'],['K','♠'],['6','♣'],['Q','♥']], extra: null },       // pp=7, bp=6 both stand → super-small7
      { init: [['7','♣'],['J','♥'],['6','♦'],['10','♠']], extra: null },      // pp=7, bp=6 both stand → super-small7
    ];
    const BSCEN_B6 = [
      { init: [['A','♠'],['2','♥'],['3','♣'],['3','♦']], extra: ['J','♠'] },  // pp=3→J(0)=3, bp=6 stand
      { init: [['2','♠'],['A','♥'],['4','♣'],['2','♦']], extra: ['K','♠'] },  // pp=3→K(0)=3, bp=6 stand
      { init: [['3','♠'],['A','♥'],['2','♣'],['4','♦']], extra: ['Q','♦'] },  // pp=4→Q(0)=4, bp=6 stand
      { init: [['2','♣'],['2','♦'],['3','♥'],['3','♠']], extra: ['10','♣'] }, // pp=4→10(0)=4, bp=6 stand
      { init: [['A','♣'],['4','♦'],['2','♥'],['4','♠']], extra: ['J','♦'] },  // pp=5→J(0)=5, bp=6 stand
      { init: [['3','♣'],['A','♥'],['6','♦'],['Q','♠']], extra: ['3','♠'] },  // pp=4→3=7(BIG), bp=6 stand → super-big7
      { init: [['A','♣'],['2','♥'],['6','♠'],['J','♣']], extra: ['4','♦'] },  // pp=3→4=7(BIG), bp=6 stand → super-big7
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
    const showStartBar = () => {
      const bar = $('bac-start-bar'); if (bar) bar.style.display = '';
      const nxt = $('bac-next-btn');  if (nxt) nxt.style.display = 'none';
    };
    const showNextBtn = () => {
      const bar = $('bac-start-bar'); if (bar) bar.style.display = 'none';
      const nxt = $('bac-next-btn');  if (nxt) nxt.style.display = '';
    };
    const hideAllCtrl = () => {
      const bar = $('bac-start-bar'); if (bar) bar.style.display = 'none';
      const nxt = $('bac-next-btn');  if (nxt) nxt.style.display = 'none';
    };
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
      ['bac-b-btn-top','bac-b-btn-bot','bac-p-btn-top','bac-p-btn-bot','bac-tie-btn'].forEach(id => {
        const e = $(id); if (e) e.innerHTML = '';
      });
      actions('');
    }

    function showMistake(retryFn, msg = 'MISTAKE!') {
      clearInlineBtns();
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = `<div class="mistake-text${msg === 'OVER DRAW' ? ' overdraw-text' : ''}">${msg}</div>`;
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
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

    function winBtns(source) {
      return {
        banker: `
          <div class="bac-special-col">
            <button class="btn-bac-banker bac-inline-btn" onclick="Sims.baccarat.quizWinFull('banker-win','${source}')">BANKER WIN</button>
            <div class="bac-sub-btn-row">
              <button class="btn-bac-banker bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('banker-big6','${source}')">BIG 6</button>
              <button class="btn-bac-banker bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('banker-small6','${source}')">SMALL 6</button>
            </div>
          </div>`,
        tie: `
          <div class="bac-special-col bac-special-col-mid">
            <button class="btn-bac-tie bac-inline-btn" onclick="Sims.baccarat.quizWinFull('tie','${source}')">TIE</button>
          </div>`,
        player: `
          <div class="bac-special-col">
            <button class="btn-bac-player bac-inline-btn" onclick="Sims.baccarat.quizWinFull('player-win','${source}')">PLAYER WIN</button>
            <div class="bac-sub-btn-row">
              <button class="btn-bac-player bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('player-big7','${source}')">BIG 7</button>
              <button class="btn-bac-player bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('player-small7','${source}')">SMALL 7</button>
            </div>
            <div class="bac-sub-btn-row">
              <button class="btn-bac-super7 bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('super-big7','${source}')">SUPER BIG 7</button>
              <button class="btn-bac-super7 bac-inline-btn btn-bac-special" onclick="Sims.baccarat.quizWinFull('super-small7','${source}')">SUPER SMALL 7</button>
            </div>
          </div>`,
      };
    }

    function showPairNotif() {
      const pp = pts(S.ph), bp = pts(S.bh);
      if (pp >= 8 || bp >= 8 || (pp >= 6 && bp >= 6)) return;
      const pPair = S.ph[0].rank === S.ph[1].rank;
      const bPair = S.bh[0].rank === S.bh[1].rank;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;

      if (!pPair && !bPair) {
        const el = document.createElement('div');
        el.className = 'bac-no-pair-notif';
        el.textContent = 'NO PAIR';
        tbl.appendChild(el);
        setTimeout(() => el.remove(), 1800);
        return;
      }
      function spawnSideNoPair(side) {
        const anchorId = side === 'player' ? 'bac-ph' : 'bac-bh';
        const anchor = document.getElementById(anchorId);
        const label = side === 'player' ? 'Player No Pair' : 'Banker No Pair';
        const textColor = side === 'player' ? '#ff6060' : '#ffd700';
        const el = document.createElement('div');
        el.className = 'bac-side-no-pair-notif';
        el.innerHTML = `
          <div class="bac-pnp-text" style="color:${textColor}">${label}</div>
          <svg class="bac-pnp-svg${side === 'banker' ? ' bac-pnp-svg-flip' : ''}" viewBox="0 0 115 56" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="32" r="13" fill="#c9a84c" stroke="#fff" stroke-width="1.5"/>
            <circle cx="18" cy="32" r="9" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1"/>
            <text x="18" y="36" text-anchor="middle" fill="#111" font-size="6.5" font-weight="bold">PP</text>
            <line x1="35" y1="32" x2="50" y2="32" stroke="#ff6060" stroke-width="2.2" stroke-linecap="round"/>
            <polygon points="50,27.5 59,32 50,36.5" fill="#ff6060"/>
            <rect x="61" y="26" width="35" height="17" rx="5.5" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8"/>
            <rect x="58" y="28" width="5" height="11" rx="2.5" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8" transform="rotate(-30, 60.5, 34)"/>
            <rect x="64" y="14" width="5.5" height="15" rx="2.8" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8"/>
            <rect x="71.5" y="12" width="5.5" height="17" rx="2.8" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8"/>
            <rect x="79" y="14" width="5.5" height="15" rx="2.8" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8"/>
            <rect x="86.5" y="16" width="4.5" height="13" rx="2.2" fill="#f5c5a0" stroke="#d4956a" stroke-width=".8"/>
            <line x1="60" y1="29" x2="51" y2="29" stroke="rgba(255,255,255,.45)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <line x1="60" y1="35" x2="50" y2="35" stroke="rgba(255,255,255,.45)" stroke-width="1.5" stroke-dasharray="3,2"/>
          </svg>
          <div class="bac-pnp-take-text">Losing Pair bet Take</div>
          `;
        if (anchor) {
          const tr = tbl.getBoundingClientRect();
          const ar = anchor.getBoundingClientRect();
          el.style.top  = (ar.bottom - tr.top + 10) + 'px';
          el.style.left = (ar.left - tr.left + ar.width / 2) + 'px';
        }
        tbl.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }
      if (bPair && !pPair) spawnSideNoPair('player');
      if (pPair && !bPair) spawnSideNoPair('banker');
    }

    function showInitialQuiz() {
      showPairNotif();
      const b = winBtns('initial');
      setBtn('bac-b-btn-top', b.banker);
      setBtn('bac-b-btn-bot', '');
      setBtn('bac-tie-btn', b.tie);
      setBtn('bac-p-btn-top', b.player);
      setBtn('bac-p-btn-bot', '');
      setBtn('bac-bh3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizInitial('draw-banker')">BANKER<br>DRAW</button>`);
      setBtn('bac-ph3', `<button class="btn-bac-draw bac-draw-slot-btn" onclick="Sims.baccarat.quizInitial('draw-player')">PLAYER<br>DRAW</button>`);
      msg('Choose action:');
    }

    function showSpecialQuiz() {
      const b = winBtns('special');
      setBtn('bac-b-btn-top', b.banker);
      setBtn('bac-b-btn-bot', '');
      setBtn('bac-tie-btn', b.tie);
      setBtn('bac-p-btn-top', b.player);
      setBtn('bac-p-btn-bot', '');
      msg('Which outcome?');
    }

    function showBankerDrawQuiz() {
      const b = winBtns('banker');
      setBtn('bac-b-btn-top', b.banker);
      setBtn('bac-b-btn-bot', '');
      setBtn('bac-tie-btn', b.tie);
      setBtn('bac-p-btn-top', b.player);
      setBtn('bac-p-btn-bot', '');
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
      if (pp === 7 && bp === 6 && S.ph.length === 3)      lines.push('SUPER BIG 7');
      else if (pp === 7 && bp === 6 && S.ph.length === 2) lines.push('SUPER SMALL 7');
      else if (pp === 7 && S.ph.length === 2)             lines.push('SMALL 7');
      else if (pp === 7 && S.ph.length === 3)             lines.push('BIG 7');
      return { lines, color };
    }

    function showWinnerFlash(side) {
      const el = $('bac-winner-flash');
      if (!el) return;
      const { lines } = getSpecialLabel(side);
      const cls = side === 'banker' ? 'banker-win' : side === 'player' ? 'player-win' : 'tie-win';
      el.innerHTML = `<div class="bac-winner-flash-text ${cls}">${lines.join('<br>')}</div>`;
      el.className = 'bac-winner-flash bac-wf-in';
      const dur = lines.length > 1 ? 3200 : 2000;
      setTimeout(() => {
        el.classList.replace('bac-wf-in', 'bac-wf-out');
        setTimeout(() => { el.className = 'bac-winner-flash'; }, 700);
      }, dur);
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
      $('bac-score').textContent = S.score;
      $('bac-rounds').textContent = S.rounds;
      showWinnerFlash(side);
      enableDraw();
      msg('');
      const cls = side === 'banker' ? 'banker-win' : side === 'player' ? 'player-win' : 'tie-win';
      const { lines } = getSpecialLabel(side);
      const [main, sub] = lines;
      const html = `<div class="bac-win-announce bac-win-over-divider ${cls}">${main}${sub ? `<br><span class="bac-win-sub ${cls}">${sub}</span>` : ''}</div>`;
      setBtn('bac-b-btn-top', '');
      setBtn('bac-p-btn-top', '');
      setBtn('bac-tie-btn', html);
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

    return {
      init() {
        S = { deck: createBacDeck(), ph: [], bh: [], pThird: null,
              rounds: 0, score: 0, winner: null, bets: [] };
        enableDraw();
      },

      deal() {
        if (S.deck.length < 20) S.deck = createBacDeck();
        S.ph = []; S.bh = []; S.pThird = null; S.winner = null;
        S.rounds++;
        disableDraw();

        $('bac-ph').innerHTML   = '';
        $('bac-bh').innerHTML   = '';
        const ph3e = $('bac-ph3'); if (ph3e) ph3e.innerHTML = '';
        const bh3e = $('bac-bh3'); if (bh3e) bh3e.innerHTML = '';
        $('bac-result').textContent = '';
        $('bac-result').className   = 'result-badge';
        const pp = $('bac-pay-panel');
        if (pp) pp.style.display = 'none';
        clearInlineBtns();

        const wf = $('bac-winner-flash'); if (wf) { wf.className = 'bac-winner-flash'; wf.innerHTML = ''; }

        S.bets = generateBets();
        renderBets();

        if (Math.random() < 0.4) pushForcedScenario();
        const cards = [S.deck.pop(), S.deck.pop(), S.deck.pop(), S.deck.pop()];
        // cards[0]=P2(pos4), cards[1]=B1(pos2), cards[2]=P1(pos3), cards[3]=B2(pos1)
        S.ph = [cards[2], cards[0]]; // [P1, P2]
        S.bh = [cards[1], cards[3]]; // [B1, B2]

        msg('Dealing...');

        // Deal visual order: 4→2→3→1 (P2, B1, P1, B2)
        dealSequence(cards, ['bac-ph','bac-bh','bac-ph','bac-bh'], () => showInitialQuiz());
      },

      quizInitial(choice) {
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
          const isOverDraw = choice.startsWith('draw-');
          showMistake(() => showInitialQuiz(), isOverDraw ? 'OVER DRAW' : 'MISTAKE!');
          return;
        }
        clearInlineBtns();
        const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
        const ph3 = $('bac-ph3'); if (ph3) ph3.innerHTML = '';
        if (choice === 'draw-player') {
          doPlayerDraw(() => showBankerDrawQuiz());
        } else {
          doBankerDraw(() => showSpecialQuiz());
        }
      },

      quizBanker() {
        const needsDraw = bankerRule(pts(S.bh), S.pThird);
        if (!needsDraw) { showMistake(() => showBankerDrawQuiz(), 'OVER DRAW'); return; }
        clearInlineBtns();
        const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
        doBankerDraw(() => showSpecialQuiz());
      },

      quizWinFull(label, source) {
        const pp = pts(S.ph), bp = pts(S.bh);
        if (source === 'initial') {
          const needsDrawP = !(pp >= 8 || bp >= 8) && pp <= 5;
          const needsDrawB = !(pp >= 8 || bp >= 8) && pp > 5 && bankerRule(bp, null);
          if (needsDrawP || needsDrawB) { showMistake(() => showInitialQuiz()); return; }
        } else if (source === 'banker') {
          if (bankerRule(bp, S.pThird)) { showMistake(() => showBankerDrawQuiz()); return; }
        }
        let correct;
        if (pp === bp) correct = 'tie';
        else if (bp > pp) {
          if (bp === 6 && S.bh.length === 2)      correct = 'banker-small6';
          else if (bp === 6 && S.bh.length === 3) correct = 'banker-big6';
          else                                     correct = 'banker-win';
        } else {
          if (pp === 7 && bp === 6 && S.ph.length === 3)      correct = 'super-big7';
          else if (pp === 7 && bp === 6 && S.ph.length === 2) correct = 'super-small7';
          else if (pp === 7 && S.ph.length === 2)             correct = 'player-small7';
          else if (pp === 7 && S.ph.length === 3)             correct = 'player-big7';
          else                                    correct = 'player-win';
        }
        const showQuiz = source === 'initial' ? showInitialQuiz
                       : source === 'banker'  ? showBankerDrawQuiz
                       : showSpecialQuiz;
        const isCorrect = label === correct;
        if (!isCorrect) { showMistake(showQuiz); return; }
        clearInlineBtns();
        if (source === 'initial') {
          const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
          const ph3 = $('bac-ph3'); if (ph3) ph3.innerHTML = '';
        } else if (source === 'banker') {
          const bh3 = $('bac-bh3'); if (bh3) bh3.innerHTML = '';
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
      if (!html) { section.innerHTML = ''; return; }
      section.innerHTML = `<div class="spread-row">${html}</div>`;
      const _row = section.querySelector('.spread-row');
      if (_row) { const ow = _row.offsetWidth, cw = section.clientWidth; if (ow > cw && cw > 0) _row.style.transform = `scale(${(cw / ow).toFixed(4)})`; }
    }

    function showCommTray() {
      const panel = $('bpay-comm-panel');
      if (!panel) return;
      panel.innerHTML = `<div class="comm-tray">
        <div id="bpay-order-warn" class="bpay-order-warn"><span>저액 칩스부터 세팅하세요</span></div>
        <div class="comm-tray-slots">
          ${COMM_CHIPS.map(c => `
            <div class="comm-slot">
              <div class="comm-slot-chip" style="background:${c.bg};color:${c.fg}">${c.key}</div>
              <input type="hidden" id="bpay-ci-${c.key}" value="0">
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.addChip('${c.key}',5)">+5</button>
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.addChip('${c.key}',1)">+1</button>
              </div>
              <button class="comm-5k-reset" onclick="Sims.baccaratPay.resetChip('${c.key}')">RESET</button>
            </div>`).join('')}
          <div class="comm-pay-slot">
            <button class="comm-pay-btn" onclick="Sims.baccaratPay.submitComm()">PAY</button>
            <button class="comm-all-reset-btn" onclick="Sims.baccaratPay.resetAll()">ALL RESET</button>
          </div>
        </div>
      </div>`;
    }

    function showMistake(retryFn) {
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
      S.score++;
      $('bpay-score').textContent = S.score;
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) { Sims.baccaratPay.deal(); return; }
      const ov = document.createElement('div');
      ov.className = 'next-hand-overlay';
      ov.innerHTML = '<div class="next-hand-text">NEXT HAND</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); Sims.baccaratPay.deal(); }, 1600);
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
        S = { bets: [], commIdx: 0, rounds: 0, score: 0, commTarget: 0, mode: 'commission', lastTotal: 0 };
        this.deal();
      },

      restart() {
        const cur = S.mode || 'commission';
        S = { bets: [], commIdx: 0, rounds: 0, score: 0, commTarget: 0, mode: cur, lastTotal: 0 };
        this.setMode(cur);
      },

      setMode(mode) {
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
          if (Sims.baccaratSide) { Sims.baccaratSide.init(); Sims.baccaratSide.deal(); }
        } else {
          if (bpayContent) bpayContent.style.display = '';
          if (bsideContent) bsideContent.style.display = 'none';
          if (statsComm) statsComm.style.display = '';
          if (statsSide) statsSide.style.display = 'none';
          this.deal();
        }
      },

      deal() {
        const pos = positions(); if (pos) pos.classList.remove('paying');
        S.rounds++; S.commIdx = 0; S.commTarget = 0;
        $('bpay-rounds').textContent = S.rounds;
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
        const inp = $(`bpay-ci-${key}`);
        if (inp) inp.value = '0';
        updateSpread();
      },

      resetAll() {
        COMM_CHIPS.forEach(c => {
          const inp = $(`bpay-ci-${c.key}`);
          if (inp) inp.value = '0';
        });
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
    const SIDE_KEYS  = ['st','tt','bt','sd','s7','bd','pp','bp'];
    const SIDE_BET_MIN = 10_000;
    const SIDE_BET_MAX = { bt: 1_000_000, bd: 1_000_000, s7: 500_000 };

    let S = {};
    const $ = id => document.getElementById(id);

    function generateSideChips(key) {
      const maxAmt = SIDE_BET_MAX[key] ?? 1_000_000;
      const round = S.rounds;
      // Progressive difficulty: 1-color only early, 3-color unlocked after round 5
      let target;
      if (round <= 2) {
        target = 1;
      } else if (round <= 4) {
        target = Math.random() < 0.60 ? 1 : 2;
      } else if (round <= 7) {
        const r = Math.random();
        target = r < 0.30 ? 1 : r < 0.85 ? 2 : 3;
      } else {
        const r = Math.random();
        target = r < 0.20 ? 1 : r < 0.70 ? 2 : 3;
      }
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
      let discs = '';
      sorted.forEach(([key, cnt], groupIdx) => {
        const chip = COMM_CHIPS.find(c => c.key === key);
        if (!chip) return;
        for (let j = 0; j < cnt; j++) {
          const newGroup  = j === 0 && groupIdx > 0;
          const group5gap = !newGroup && j > 0 && j % 5 === 0;
          let cls = 'bside-bet-disc';
          if (newGroup)       cls += ' new-denom';
          else if (group5gap) cls += ' group5gap';
          discs += `<div class="${cls}" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
        }
      });
      return `<div class="bside-bet-spread">${discs}</div>`;
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
      let html = '';
      let anyPrev = false;
      COMM_CHIPS.forEach(c => {
        const cnt = parseInt($(`bside-ci-${c.key}`)?.value) || 0;
        if (!cnt) return;
        for (let j = 0; j < cnt; j++) {
          let cls = 'spread-disc';
          if (j === 0 && anyPrev)        cls += ' spread-gap';
          else if (j > 0 && j % 5 === 0) cls += ' spread-gap5';
          html += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
          anyPrev = true;
        }
      });
      if (!html) { section.innerHTML = ''; return; }
      section.innerHTML = `<div class="spread-row">${html}</div>`;
      const _row = section.querySelector('.spread-row');
      if (_row) { const ow = _row.offsetWidth, cw = section.clientWidth; if (ow > cw && cw > 0) _row.style.transform = `scale(${(cw / ow).toFixed(4)})`; }
    }

    function showPayTray() {
      const panel = $('bside-comm-panel');
      const spread = $('bside-spread-section');
      if (!panel) return;
      panel.style.display = 'block';
      if (spread) { spread.style.display = 'flex'; spread.innerHTML = ''; }
      panel.innerHTML = `<div class="comm-tray">
        <div class="comm-tray-slots">
          ${COMM_CHIPS.filter(c => c.val >= 10000).map(c => `
            <div class="comm-slot">
              <div class="comm-slot-chip" style="background:${c.bg};color:${c.fg}">${c.key}</div>
              <input type="hidden" id="bside-ci-${c.key}" value="0">
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.baccaratSide.addChip('${c.key}',5)">+5</button>
                <button class="comm-5k-btn" onclick="Sims.baccaratSide.addChip('${c.key}',1)">+1</button>
              </div>
              <button class="comm-5k-reset" onclick="Sims.baccaratSide.resetChip('${c.key}')">RESET</button>
            </div>`).join('')}
          <div class="comm-pay-slot">
            <button class="comm-pay-btn" onclick="Sims.baccaratSide.submitPay()">PAY</button>
            <button class="comm-all-reset-btn" onclick="Sims.baccaratSide.resetAll()">ALL RESET</button>
          </div>
        </div>
      </div>`;
    }

    function showMistake(retryFn) {
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retryFn(); }, 1600);
    }

    return {
      init() {
        S = { rounds: 0, score: 0, currentKey: null, currentMult: 0, currentBet: 0, lastKey: null, payTarget: 0 };
      },

      deal() {
        const startOverlay = $('bside-start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';
        S.rounds++;
        $('bside-rounds').textContent = S.rounds;
        clearHighlights();
        const s7lbl = $('bside-s7-pay-1');
        if (s7lbl) s7lbl.innerHTML = '×30/40/100';
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
      },

      addChip(key, n) {
        const chip = COMM_CHIPS.find(c => c.key === key);
        if (!chip) return;
        const inp = $(`bside-ci-${key}`);
        if (!inp) return;
        inp.value = (parseInt(inp.value) || 0) + n;
        updateSpread();
      },

      resetChip(key) {
        const inp = $(`bside-ci-${key}`);
        if (inp) inp.value = '0';
        updateSpread();
      },

      resetAll() {
        COMM_CHIPS.forEach(c => {
          const inp = $(`bside-ci-${c.key}`);
          if (inp) inp.value = '0';
        });
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
        // Correct — flash green then deal next
        const circ = $(`bside-${S.currentKey}-1`);
        if (circ) { circ.classList.remove('bside-paying-circ'); circ.classList.add('bside-win-circ'); }
        COMM_CHIPS.forEach(c => { const inp = $(`bside-ci-${c.key}`); if (inp) inp.value = '0'; });
        // Show CORRECT in the spread (chip placement) area with animation
        const spread = $('bside-spread-section');
        if (spread) {
          spread.style.display = 'flex';
          spread.innerHTML = '<div class="bside-correct-inline">✓ CORRECT!</div>';
        }
        S.score++;
        $('bside-score').textContent = S.score;
        // Reset Super 7 label back to all options
        const s7lbl = $('bside-s7-pay-1');
        if (s7lbl) s7lbl.textContent = '×30/40/100';
        setTimeout(() => { Sims.baccaratSide.deal(); }, 900);
      },
    };
  })(),

  // ---- ROULETTE PAYOUT PRACTICE (Option A: single-bet drill) ----
  roulettePay: (() => {
    const COLOR_CHIPS = [
      { key: 'white',  val:   5_000, bg: '#f0ece4', fg: '#2a2a2a' },
      { key: 'teal',   val:  10_000, bg: '#00838f', fg: '#fff'    },
      { key: 'lime',   val:  25_000, bg: '#9ccc65', fg: '#1a1a1a' },
      { key: 'brown',  val:  50_000, bg: '#6d4c41', fg: '#fff'    },
      { key: 'purple', val: 100_000, bg: '#7b1fa2', fg: '#fff'    },
      { key: 'orange', val: 200_000, bg: '#e65100', fg: '#fff'    },
    ];
    const MONEY_CHIPS = [
      { key: '100M', val: 100_000_000, bg: '#c62828', fg: '#fff'    },
      { key: '10M',  val:  10_000_000, bg: '#1565c0', fg: '#fff'    },
      { key: '1M',   val:   1_000_000, bg: '#fdd835', fg: '#1a1a1a' },
      { key: '100K', val:     100_000, bg: '#212121', fg: '#fff'    },
      { key: '10K',  val:      10_000, bg: '#2e7d32', fg: '#fff'    },
      { key: '5K',   val:       5_000, bg: '#b5176b', fg: '#fff'    },
    ];
    const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

    function genChips(color, maxCount = 5) {
      const count = 1 + Math.floor(Math.random() * maxCount);
      return { chips: { [color.key]: count }, total: color.val * count };
    }

    const BET_LABEL = { Straight:'Straight', Split:'Split', Corner:'Corner', Street:'Street', SixNum:'Square' };

    function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

    function getValidSpots(N) {
      const row = Math.floor((N-1)/3);
      const col = (N-1) % 3;
      const s1  = row*3+1;
      const byType = [];

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
          } else if (sp.type === 'Corner') {
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
          const chipHtml = `<div class="rpay-spot-chip" style="background:${c.bg};border-color:${c.fg==='#fff'?'rgba(255,255,255,.5)':'rgba(0,0,0,.25)'}"><span class="rpay-spot-count" style="color:${c.fg}">${cnt}</span></div>`;

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
      const gridH  = S.zoomGridH  || vpH * 0.6;
      const gridCy = S.zoomGridCy || vpH / 2;
      const scale  = Math.min(vpH * 0.92 / gridH, 3.5);

      const dx = vpW / 2 - cx     * scale;
      const dy = vpH / 2 - gridCy * scale;

      stageEl.style.transition = 'transform .35s ease';
      stageEl.style.transformOrigin = '0 0';
      stageEl.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }

    function highlightSpot(idx) {
      const tbl = document.getElementById('rpay-full-table');

      document.querySelectorAll('.rpay-spot').forEach((el,i) => {
        el.classList.toggle('rpay-spot-paying', i === idx);
        el.classList.toggle('rpay-spot-paid', i < idx);
      });

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
      const sp = S.spots[S.spotIdx];
      const color = S.roundColor;

      S.payChips = { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
      S.history = [];

      panel.innerHTML = `
        <div class="comm-tray rpay-btray">
          <div id="rpay-order-warn" class="bpay-order-warn" style="display:none"><span>저액 칩스부터 세팅하세요</span></div>
          <div class="comm-tray-slots">
            ${MONEY_CHIPS.map(c => `
              <div class="comm-slot">
                <div class="comm-slot-chip" id="rpay-disc-${c.key}" style="background:${c.bg};color:${c.fg}">${c.key}</div>
                <div class="comm-5k-btns">
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',20)">+20</button>
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',5)">+5</button>
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',1)">+1</button>
                </div>
              </div>`).join('')}
            <div class="comm-slot">
              <div class="comm-slot-chip" id="rpay-disc-color" style="background:${color.bg};color:${color.fg}">CC</div>
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',20)">+20</button>
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',5)">+5</button>
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',1)">+1</button>
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
        ...MONEY_CHIPS
      ];

      // Stack 2D layout positions [col, row] per stack count (1–6)
      const STACK_LAYOUTS = [
        null,
        [[0, 0]],                                                    // 1: single
        [[0, 1], [1, 0]],                                            // 2: diagonal
        [[0, 1], [2, 1], [1, 0]],                                   // 3: triangle
        [[0, 1], [2, 1], [1, 0], [3, 0]],                           // 4: upper-right diamond
        [[0, 0], [2, 0], [4, 0], [1, 1], [3, 1]],                  // 5: upper-left + 4-stack
        [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2]],          // 6: pyramid triangle (1-2-3)
        [[1, 0], [3, 0], [0, 1], [2, 1], [4, 1], [1, 2], [3, 2]], // 7: hexagon (2-3-2)
        [[2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [4, 2], [1, 3], [3, 3]], // 8: diamond (1-2-3-2)
      ];
      const STK_W = 38, STK_H = 33;

      function makeStackGroup(c, label, count) {
        const layout = STACK_LAYOUTS[Math.min(count, 8)];
        const colStep = 16;
        const rowStep = 14;
        const maxCol = Math.max(...layout.map(p => p[0]));
        const maxRow = Math.max(...layout.map(p => p[1]));
        const cw = maxCol * colStep + STK_W;
        const ch = maxRow * rowStep + STK_H;
        const stackHtml = layout.slice(0, count).map(([col, row]) =>
          `<div class="rpay-chip-stack" style="--stk-bg:${c.bg};--stk-fg:${c.fg};position:absolute;left:${col*colStep}px;top:${row*rowStep}px;z-index:${(row+1)*10+(maxCol-col+1)}">` +
          `<div class="rpay-chip-stack-face"></div>` +
          `<div class="rpay-chip-stack-body"></div>` +
          `<span class="rpay-stack-label" style="color:${c.fg}">${label}</span>` +
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
        const fullStacks = Math.floor(cnt / 20);
        const rem = cnt % 20;
        const miniStacks = rem >= 5 ? Math.max(0, Math.floor(rem / 5) - 1) : 0;
        const spreadCount = rem - miniStacks * 5;

        let fsRem = fullStacks;
        while (fsRem > 0) { const chunk = Math.min(fsRem, 8); parts.push(makeStackGroup(c, label, chunk)); fsRem -= chunk; }

        if (miniStacks > 0 || spreadCount > 0) {
          let html = `<div class="rpay-cc-spread">`;
          for (let i = 0; i < miniStacks; i++) {
            html += `<div class="rpay-chip-stack rpay-mini-stack" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">` +
              `<div class="rpay-chip-stack-face"></div>` +
              `<div class="rpay-chip-stack-body"></div>` +
              `<span class="rpay-stack-label" style="color:${c.fg}">${label}</span>` +
              `</div>`;
          }
          for (let i = 0; i < spreadCount; i++) {
            const gap = i > 0 && i % 5 === 0 ? ' rpay-disc-gap5' : '';
            html += `<div class="rpay-cc-disc${gap}" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">${label}</div>`;
          }
          html += `</div>`;
          parts.push(html);
        }
      });

      const totalChipCount = Object.values(S.payChips).reduce((a, b) => a + b, 0);
      const warnHtml = totalChipCount >= 100
        ? `<div class="rpay-chip-warn">⚠ 머니 칩스와 함께 세팅해주세요</div>`
        : '';

      zone.innerHTML = (parts.length
        ? `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px">${parts.join('')}</div>`
        : '<div class="rpay-hint-text">베팅 구역 확인하고 칩스를 세팅하세요.</div>') + warnHtml;
    }

    function showMistake(retry) {
      const tbl = document.querySelector('.rpay-table');
      if (!tbl) { retry(); return; }
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
      tbl.appendChild(ov);
      setTimeout(() => { ov.remove(); retry(); }, 1600);
    }

    let S = {};
    const $ = id => document.getElementById(id);

    return {
      init() {
        if (S && S.timerInterval) clearInterval(S.timerInterval);
        S = { winNum: null, spots: [], spotIdx: 0, rounds: 0, score: 0, lastNum: null, roundColor: null,
              payChips: { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 },
              history: [], difficulty: 'easy',
              timerStart: null, timerInterval: null };
      },

      setDiff(level) {
        S.difficulty = level;
        ['easy','medium','hard'].forEach(d => {
          const btn = document.getElementById(`rpay-diff-${d}`);
          if (btn) btn.classList.toggle('rpay-diff-active', d === level);
        });
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

      deal() {
        const ov = $('rpay-start-overlay');
        if (ov) ov.style.display = 'none';
        this._stopTimer();
        const timerEl = $('rpay-timer');
        if (timerEl) { timerEl.className = 'rpay-timer'; timerEl.textContent = '—'; }
        S.rounds++;
        $('rpay-rounds').textContent = S.rounds;
        if ($('rpay-comm-panel')) $('rpay-comm-panel').innerHTML = '';

        let N;
        do { N = 1+Math.floor(Math.random()*36); } while (N === S.lastNum);
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

        renderFullGrid(N, S.spots);
        showTray();
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
        S.payChips = { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
        updateTray();
      },

      undo() {
        if (!S.history || !S.history.length) return;
        S.payChips = S.history.pop();
        updateTray();
      },

      submitPay() {
        const sp = S.spots[S.spotIdx];
        const target = sp.total * sp.pays;
        const colorVal = S.roundColor ? S.roundColor.val : 0;
        let entered = (S.payChips.color || 0) * colorVal;
        for (const mc of MONEY_CHIPS) {
          entered += (S.payChips[mc.key] || 0) * mc.val;
        }
        if (entered !== target) {
          showMistake(() => {
            S.payChips = { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
            updateTray();
          });
          return;
        }
        S.spotIdx++;
        if (S.spotIdx >= S.spots.length) {
          this._stopTimer();
          const elapsed = S.timerStart ? (performance.now() - S.timerStart) / 1000 : null;
          const timerEl = $('rpay-timer');
          if (timerEl && elapsed !== null) {
            timerEl.textContent = fmtTime(elapsed);
            timerEl.className = 'rpay-timer rpay-timer-done';
          }
          S.score++;
          $('rpay-score').textContent = S.score;
          highlightSpot(-1);
          const tbl = document.querySelector('.rpay-table');
          if (tbl) {
            const ov2 = document.createElement('div');
            ov2.className = 'next-hand-overlay';
            ov2.innerHTML = `<div class="next-hand-text">NEXT HAND</div>${elapsed !== null ? `<div class="next-hand-time">${elapsed.toFixed(1)}s</div>` : ''}`;
            tbl.appendChild(ov2);
            setTimeout(() => { ov2.remove(); Sims.roulettePay.deal(); }, 1400);
          }
        } else {
          highlightSpot(S.spotIdx);
          showTray();
        }
      },
    };
  })(),

  // ---- POKER ----
  poker: (() => {
    function mkSim(key, holeP, holeD, commN) {
      let S = { rounds: 0, score: 0, phase: 'idle' };
      const $  = id => document.getElementById(id);
      const sh = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };

      function init() {
        S = { rounds: 0, score: 0, phase: 'idle' };
        sh('pk-rounds', '0'); sh('pk-score', '0');
        sh('pk-player-hand', ''); sh('pk-dealer-hand', ''); sh('pk-comm-hand', '');
        sh('pk-player-rank', ''); sh('pk-dealer-rank', '');
        sh('pk-quiz', ''); sh('pk-result', '');
      }

      function deal() {
        if (S.phase === 'quiz') return;
        S.rounds++;
        sh('pk-rounds', S.rounds);
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
        if (ok) S.score++;
        sh('pk-score', S.score);
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

      function countdown(label, secs, done) {
        clearCd();
        const cd = $('thpr-countdown');
        if (!cd) { done(); return; }
        let n = secs;
        cd.className = 'thpr-countdown thpr-countdown-active';
        cd.textContent = label + '  ' + n;
        _cdTimer = setInterval(function() {
          n--;
          if (n <= 0) {
            clearCd();
            cd.className = 'thpr-countdown thpr-countdown-done';
            cd.textContent = label + '  ✓';
            done();
          } else {
            cd.textContent = label + '  ' + n;
          }
        }, 1000);
      }

      function setLabel(text) {
        const cd = $('thpr-countdown');
        if (cd) { cd.className = 'thpr-countdown thpr-countdown-active'; cd.textContent = text; }
      }

      function showAnswerBtns() {
        var b = $('thpr-spot-btns-' + S.activePlayer);
        if (!b) return;
        b.innerHTML =
          '<button class="thpr-pay-btn" onclick="Sims.poker.thpRank.answer(\'pay\')">PAY</button>' +
          '<button class="thpr-take-btn" onclick="Sims.poker.thpRank.answer(\'take\')">TAKE</button>' +
          '<button class="thpr-tie-btn" onclick="Sims.poker.thpRank.answer(\'tie\')">TIE</button>';
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

        // Clear previous round's visual state
        for (var _p = 1; _p <= 5; _p++) {
          var _sp = $('thpr-spot-' + _p);
          if (_sp) _sp.classList.remove('thpr-active', 'thpr-pay', 'thpr-take', 'thpr-tie');
          var _sb = $('thpr-spot-btns-' + _p);
          if (_sb) _sb.innerHTML = '';
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

        var startBtn = $('thpr-start-btn');
        if (startBtn) startBtn.disabled = true;

        // Reveal sequence: FLOP → TURN → RIVER → DEALER → PLAYER 5
        setTimeout(function() {
          reveal('comm0'); reveal('comm1'); reveal('comm2');
          countdown('FLOP', 5, function() {
            reveal('comm3');
            countdown('TURN', 5, function() {
              reveal('comm4');
              countdown('RIVER', 5, function() {
                var cd = $('thpr-countdown');
                if (cd) { cd.className = 'thpr-countdown'; cd.textContent = ''; }
                reveal('d0'); reveal('d1');
                setLabel('DEALER');
                setTimeout(function() {
                  reveal('p5c0'); reveal('p5c1');
                  var spot5 = $('thpr-spot-5');
                  if (spot5) spot5.classList.add('thpr-active');
                  setLabel('PLAYER 5');
                  S.activePlayer = 5;
                  showAnswerBtns();
                  S.phase = 'quiz';
                }, 900);
              });
            });
          });
        }, 400);
      }

      function answer(choice) {
        if (S.phase !== 'quiz') return;
        S.phase = 'answering';

        var playerCards = [...S.players[S.activePlayer - 1], ...S.comm];
        var dealerCards = [...S.dealer, ...S.comm];
        var result = getResult(dealerCards, playerCards);
        var correct = choice.toUpperCase() === result.winner;

        // Record result for end-of-round summary
        S.results.push({
          player: S.activePlayer,
          winner: result.winner,
          playerRankName: result.playerRankName,
          dealerRankName: result.dealerRankName,
          correct: correct
        });

        // Clear answer buttons from this spot
        var spotBtns = $('thpr-spot-btns-' + S.activePlayer);
        if (spotBtns) spotBtns.innerHTML = '';

        // Color player spot with correct result
        var spot = $('thpr-spot-' + S.activePlayer);
        if (spot) {
          spot.classList.remove('thpr-active');
          spot.classList.add('thpr-' + result.winner.toLowerCase());
        }

        if (correct) S.score++;
        var scEl = $('thpr-score'); if (scEl) scEl.textContent = S.score;

        // Build winner-first hand lines
        var line1, line2;
        if (result.winner === 'TAKE') {
          line1 = 'Dealer: ' + result.dealerRankName;
          line2 = 'Player: ' + result.playerRankName;
        } else {
          line1 = 'Player: ' + result.playerRankName;
          line2 = 'Dealer: ' + result.dealerRankName;
        }

        // Show structured feedback
        var fb = $('thpr-feedback');
        if (fb) {
          fb.innerHTML =
            '<div class="thpr-result">' +
              '<span class="' + (correct ? 'thpr-verdict-ok' : 'thpr-verdict-wrong') + '">' +
                (correct ? 'Correct!' : 'Incorrect.') +
              '</span>' +
              '<span class="thpr-result-answer">' +
                (correct ? 'Answer: ' : 'Correct answer: ') + result.winner +
              '</span>' +
              '<span>' + line1 + '</span>' +
              '<span>' + line2 + '</span>' +
              '<span class="thpr-result-explain">' + result.verboseExplanation + '</span>' +
            '</div>';
        }

        // Replace PAY/TAKE/TIE with Next Player button
        var isLast = (S.activePlayer === 1);
        var a = $('thpr-action-row');
        if (a) {
          a.innerHTML = '<button class="thpr-next-btn" onclick="Sims.poker.thpRank.next()">' +
            (isLast ? 'Next Hand →' : 'Next Player →') + '</button>';
        }
      }

      function next() {
        var fb = $('thpr-feedback');
        if (fb) { fb.innerHTML = ''; }
        S.activePlayer--;
        if (S.activePlayer < 1) { endRound(); return; }
        reveal('p' + S.activePlayer + 'c0');
        reveal('p' + S.activePlayer + 'c1');
        var spot = $('thpr-spot-' + S.activePlayer);
        if (spot) spot.classList.add('thpr-active');
        setLabel('PLAYER ' + S.activePlayer);
        showAnswerBtns();
        S.phase = 'quiz';
      }

      function endRound() {
        S.rounds++;
        var rEl = $('thpr-rounds'); if (rEl) rEl.textContent = S.rounds;

        var cd = $('thpr-countdown');
        if (cd) { cd.className = 'thpr-countdown'; cd.textContent = ''; }

        // Build per-round summary (results are stored P5 first, so reverse to show P5 at top)
        var ordered = S.results.slice().sort(function(a, b) { return b.player - a.player; });
        var correctCount = 0;
        var rows = ordered.map(function(r) {
          if (r.correct) correctCount++;
          var wClass = r.winner === 'PAY' ? 'thpr-sum-pay' : r.winner === 'TAKE' ? 'thpr-sum-take' : 'thpr-sum-tie';
          var chk = r.correct
            ? '<span class="thpr-sum-chk thpr-sum-chk-ok">✓</span>'
            : '<span class="thpr-sum-chk thpr-sum-chk-wrong">✗</span>';
          var hands = r.winner === 'TAKE'
            ? r.dealerRankName + ' &gt; ' + r.playerRankName
            : r.winner === 'PAY'
              ? r.playerRankName + ' &gt; ' + r.dealerRankName
              : r.playerRankName + ' = ' + r.dealerRankName;
          return '<div class="thpr-sum-row">' +
            chk +
            '<span class="thpr-sum-label">P' + r.player + '</span>' +
            '<span class="thpr-sum-winner ' + wClass + '">' + r.winner + '</span>' +
            '<span class="thpr-sum-hands">' + hands + '</span>' +
            '</div>';
        }).join('');

        var fb = $('thpr-feedback');
        if (fb) {
          fb.innerHTML =
            '<div class="thpr-summary">' +
              rows +
              '<div class="thpr-sum-score">' + correctCount + ' / 5 correct</div>' +
            '</div>';
        }

        var a = $('thpr-action-row');
        if (a) a.innerHTML = '<button class="thpr-start-btn" onclick="Sims.poker.thpRank.deal()">NEW HAND</button>';

        S.phase = 'idle';
      }

      function init() {
        clearCd();
        S = { rounds: 0, score: 0, phase: 'idle', activePlayer: null, results: [] };
        var r = $('thpr-rounds');    if (r)  r.textContent  = '0';
        var sc = $('thpr-score');    if (sc) sc.textContent = '0';
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
          if (sp) sp.classList.remove('thpr-active', 'thpr-pay', 'thpr-take', 'thpr-tie');
        }
      }

      return { init, deal, answer, next, debugHand };
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

  inner += `<table class="roulette-grid"><tbody>`;
  rows.forEach((row, ri) => {
    inner += `<tr>`;
    inner += `<td><div class="bet-spot col-bet" data-bet="${colBets[ri]}">2TO1</div></td>`;
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

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => App.init());
