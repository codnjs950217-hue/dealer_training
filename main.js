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
  navigate(game, mode) {
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
      if (mode === 'thp') { el.innerHTML = Views.thpSim(); Sims.poker.thp.init(); }
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
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Casino Dealer<br><span class="gold">Training System</span></h1>
      </div>
      <div class="hero-cards">
        <div class="floating-card card red" style="transform:rotate(-14deg) translate(-30px,8px)">
          <div class="card-corner top"><span class="rank">A</span><span class="suit">♥</span></div>
          <div class="card-suit-center">♥</div>
          <div class="card-corner bottom"><span class="rank">A</span><span class="suit">♥</span></div>
        </div>
        <div class="floating-card card" style="transform:rotate(4deg) translate(10px,-18px)">
          <div class="card-corner top"><span class="rank">K</span><span class="suit">♠</span></div>
          <div class="card-suit-center">♠</div>
          <div class="card-corner bottom"><span class="rank">K</span><span class="suit">♠</span></div>
        </div>
        <div class="floating-card card red" style="transform:rotate(20deg) translate(50px,4px)">
          <div class="card-corner top"><span class="rank">Q</span><span class="suit">♦</span></div>
          <div class="card-suit-center">♦</div>
          <div class="card-corner bottom"><span class="rank">Q</span><span class="suit">♦</span></div>
        </div>
      </div>
    </section>`,

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
        <div class="sim-header">
          <button class="back-btn" onclick="App.navigate('home')">← Home</button>
          <h2>${g.icon} ${g.name}</h2>
        </div>
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
          <button class="back-btn" onclick="App.navigate('${game}')">← Back</button>
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
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('blackjack')">← Back</button>
        <h2>♠ Card Counting Practice</h2>
        <div class="sim-stats"><span>Rounds: <strong id="bj-rounds">0</strong></span><span>Score: <strong id="bj-score">0</strong></span></div>
      </div>
      <div class="blackjack-table">
        <div class="bj-start-bar">
          <button class="bj-start-btn" id="bj-start-btn" onclick="Sims.blackjack.newGame()">Start</button>
        </div>
        <div class="bj-play-area">
          <div class="players-row">
            ${[0,1,2,3,4].map(i => `
              <div class="player-spot" id="bj-spot-${i}">
                <div class="hand-display" id="bj-hand-${i}"></div>
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
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Drawing Practice</h2>
        <div class="sim-stats"><span>Rounds: <strong id="bac-rounds">0</strong></span><span>Score: <strong id="bac-score">0</strong></span></div>
      </div>
      <div class="baccarat-table">
        <div class="bac-btn-cluster bac-btn-cluster-quiz">
          <div class="bac-shoe-spacer"></div>
          <div class="bac-bclust-side" id="bac-b-btn-top"></div>
          <div class="bac-bclust-mid" id="bac-tie-btn"></div>
          <div class="bac-bclust-side" id="bac-p-btn-top"></div>
        </div>
        <div class="bac-field-labels">
          <div class="bac-shoe-spacer"></div>
          <div class="bac-fll bac-fll-banker">BANKER</div>
          <div style="width:80px;flex-shrink:0"></div>
          <div class="bac-fll bac-fll-player">PLAYER</div>
        </div>
        <div class="bac-field">
          <div class="bac-shoe-col">
            <div class="shoe-visual">
              <div class="shoe-label-text">SHOE</div>
              <div class="shoe-card-slot"></div>
            </div>
          </div>
          <div class="bac-banker-zone">
            <div class="bac-third-slot" id="bac-bh3"></div>
            <div class="bac-hand-wrap bac-bh-wrap" id="bac-bh"></div>
          </div>
          <div class="bac-field-divider"></div>
          <div class="bac-player-zone">
            <div class="bac-hand-wrap bac-ph-wrap" id="bac-ph"></div>
            <div class="bac-third-slot" id="bac-ph3"></div>
          </div>
        </div>
        <div class="bac-btn-cluster">
          <div class="bac-shoe-spacer"></div>
          <div class="bac-bclust-side" id="bac-b-btn-bot"></div>
          <div class="bac-bclust-mid"><div class="result-badge" id="bac-result"></div></div>
          <div class="bac-bclust-side" id="bac-p-btn-bot"></div>
        </div>
        <div class="bac-winner-flash" id="bac-winner-flash"></div>
        <div class="bac-start-bar">
          <button class="bac-start-top-btn" id="bac-draw-btn" onclick="Sims.baccarat.deal()">START</button>
        </div>
      </div>
      <div class="bac-pay-panel" id="bac-pay-panel" style="display:none"></div>
    </div>`,

  roulettePaySim: () => `
    <div class="sim-page rpay-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('roulette')">← Back</button>
        <h2>🎡 Payout Practice</h2>
        <div class="sim-stats">
          <span>Rounds: <strong id="rpay-rounds">0</strong></span>
          <span>Score: <strong id="rpay-score">0</strong></span>
        </div>
      </div>
      <div class="rpay-table">
        <div class="rpay-bet-side">
          <div class="rpay-full-table betting-table" id="rpay-full-table">${buildBettingTable()}</div>
          <div class="bpay-start-overlay" id="rpay-start-overlay">
            <button class="bpay-start-btn" onclick="Sims.roulettePay.deal()">START</button>
          </div>
        </div>
        <div class="rpay-right-col">
          <div class="rpay-timer" id="rpay-timer">—</div>
          <div class="rpay-pay-zone" id="rpay-pay-zone"></div>
        </div>
      </div>
      <div class="rpay-tray-row" id="rpay-comm-panel"></div>
    </div>`,

  baccaratPaySim: () => `
    <div class="sim-page baccarat-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Payout Practice</h2>
        <div class="sim-stats" id="bpay-stats-comm">
          <span>Rounds: <strong id="bpay-rounds">0</strong></span>
          <span>Score: <strong id="bpay-score">0</strong></span>
        </div>
        <div class="sim-stats" id="bpay-stats-side" style="display:none">
          <span>Rounds: <strong id="bside-rounds">0</strong></span>
          <span>Score: <strong id="bside-score">0</strong></span>
        </div>
      </div>
      <div class="bpay-mode-row">
        <button id="bpay-btn-commission" class="bpay-mode-btn active" onclick="Sims.baccaratPay.setMode('commission')">💰 Commission (5%)</button>
        <button id="bpay-btn-halfpay"    class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('halfpay')">½ Half Pay</button>
        <button id="bpay-btn-side"       class="bpay-mode-btn"        onclick="Sims.baccaratPay.setMode('side')">🎯 Option Bet</button>
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
        </div>
        <div class="bpay-comm-panel" id="bpay-comm-panel"></div>
      </div>
      <div id="bside-content" class="bside-sim" style="display:none">
        <div class="baccarat-table">
          <div class="bpay-positions bside-layout">
            ${[1].map(i => `
              <div class="bpay-pos bside-pos-wrap" id="bside-pos-${i}">
                <div class="bside-pos-main">
                  <div class="bpay-oval bpay-p-oval bside-gray-oval" id="bside-p-${i}">
                    <div class="bpay-oval-lbl">PLAYER</div>
                    <div class="bpay-oval-amt" id="bside-p-amt-${i}"></div>
                  </div>
                  <div class="bpay-oval bpay-b-oval bside-gray-oval" id="bside-b-${i}">
                    <div class="bpay-oval-lbl">BANKER</div>
                    <div class="bpay-oval-amt" id="bside-b-amt-${i}"></div>
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
                <div class="bside-pos-pairs">
                  <div class="bpay-pair-circ bpay-ppair" id="bside-pp-${i}">P<br>PAIR<span class="bside-pair-pay">×11</span><div class="bpay-circ-bet" id="bside-pp-amt-${i}"></div></div>
                  <div class="bpay-pair-circ bpay-bpair" id="bside-bp-${i}">B<br>PAIR<span class="bside-pair-pay">×11</span><div class="bpay-circ-bet" id="bside-bp-amt-${i}"></div></div>
                </div>
              </div>`).join('')}
          </div>
          <div class="bpay-spread-section" id="bside-spread-section" style="display:none"></div>
          <div class="bpay-start-overlay" id="bside-start-overlay">
            <button class="bpay-start-btn" onclick="Sims.baccaratSide.deal()">START</button>
          </div>
        </div>
        <div class="bpay-comm-panel" id="bside-comm-panel" style="display:none"></div>
      </div>
    </div>`,

  baccaratSideSim: () => `
    <div class="sim-page baccarat-sim bside-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Side Bet Practice</h2>
        <div class="sim-stats">
          <span>Rounds: <strong id="bside-rounds">0</strong></span>
          <span>Score: <strong id="bside-score">0</strong></span>
        </div>
      </div>
      <div class="baccarat-table">
        <div class="bpay-positions bside-layout">
          ${[1].map(i => `
            <div class="bpay-pos bside-pos-wrap" id="bside-pos-${i}">
              <div class="bside-pos-main">
                <div class="bpay-oval bpay-p-oval bside-gray-oval" id="bside-p-${i}">
                  <div class="bpay-oval-lbl">PLAYER</div>
                  <div class="bpay-oval-amt" id="bside-p-amt-${i}"></div>
                </div>
                <div class="bpay-oval bpay-b-oval bside-gray-oval" id="bside-b-${i}">
                  <div class="bpay-oval-lbl">BANKER</div>
                  <div class="bpay-oval-amt" id="bside-b-amt-${i}"></div>
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
              <div class="bside-pos-pairs">
                <div class="bpay-pair-circ bpay-ppair" id="bside-pp-${i}">P<br>PAIR<div class="bpay-circ-bet" id="bside-pp-amt-${i}"></div></div>
                <div class="bpay-pair-circ bpay-bpair" id="bside-bp-${i}">B<br>PAIR<div class="bpay-circ-bet" id="bside-bp-amt-${i}"></div></div>
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
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('poker')">← Back</button>
        <h2>🂡 ISP — Inspire Stud Poker</h2>
        <div class="sim-stats">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
        </div>
      </div>
      <div class="poker-table">
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
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('poker')">← Back</button>
        <h2>🂡 TCP — Three Card Poker</h2>
        <div class="sim-stats">
          <span>Rounds: <strong id="pk-rounds">0</strong></span>
          <span>Score: <strong id="pk-score">0</strong></span>
        </div>
      </div>
      <div class="poker-table">
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

  thpSim: () => `
    <div class="sim-page thpc-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('poker')">← Back</button>
        <h2>🂡 THP — 승자 판별 훈련</h2>
        <div class="sim-stats">
          <span>라운드: <strong id="thpc-rounds">0</strong></span>
          <span>정답: <strong id="thpc-score">0</strong></span>
        </div>
      </div>

      <div class="thpc-mode-row">
        <button id="thpc-btn-random"  class="thpc-mode-btn active" onclick="Sims.poker.thp.setMode('random')">🎲 랜덤</button>
        <button id="thpc-btn-curated" class="thpc-mode-btn"        onclick="Sims.poker.thp.setMode('curated')">📚 집중 연습</button>
      </div>

      <div id="thpc-scenario-info"></div>

      <div class="thpc-board">
        <div class="thpc-community-section">
          <div class="thpc-section-label">COMMUNITY BOARD</div>
          <div class="thpc-comm-cards" id="thpc-comm-cards"></div>
        </div>

        <div class="thpc-players-row" id="thpc-players"></div>

        <div id="thpc-split-btn"></div>
        <div id="thpc-result"></div>
        <div id="thpc-explain"></div>

        <div class="pk-start-bar">
          <button id="thpc-deal-btn" class="pk-start-btn" onclick="Sims.poker.thp.deal()">DEAL</button>
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

        if (p.hideCards) {
          handEl.innerHTML = '';
        } else {
          handEl.innerHTML = p.hand.map(c => bjFlipHTML(c, ++bjFlipId, true)).join('');
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

        // Deal round 1: all players get first card, then dealer upcard
        for (let i = 0; i < N; i++) S.players[i].hand.push(S.deck.pop());
        S.dh.push(S.deck.pop()); // dealer upcard (only card at start)

        // Deal round 2: players only, no second dealer card
        for (let i = 0; i < N; i++) {
          S.players[i].hand.push(nonBJCard(S.players[i].hand[0]));
        }

        // Clear hand displays
        for (let i = 0; i < N; i++) $(`bj-hand-${i}`).innerHTML = '';
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
              const el = $(`bj-hand-${step.idx}`);
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
            const handEl = $(`bj-hand-${i}`);
            const id = ++bjFlipId;
            if (handEl) handEl.insertAdjacentHTML('beforeend', bjFlipHTML(newCard, id, false));
            setTimeout(() => bjReveal(id), 90);
            setTimeout(() => {
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
        setTimeout(() => showDealerControls(), 400);
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
    const enableDraw  = () => { const e = $('bac-draw-btn'); if (e) { e.disabled = false; e.style.opacity = ''; } };
    const disableDraw = () => { const e = $('bac-draw-btn'); if (e) { e.disabled = true;  e.style.opacity = '0.4'; } };

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
      }, cards.length * 420 + 480);
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
      const colors = { player: '#e03030', banker: '#c9a84c', tie: '#6ec864' };
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
      const { lines, color } = getSpecialLabel(side);
      el.innerHTML = `<div class="bac-winner-flash-text" style="color:${color}">${lines.join('<br>')}</div>`;
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
          const r = Math.random();
          numDenoms = r < 0.4 ? 1 : r < 0.7 ? 2 : 3;
          allow10kStack = true;
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
            discs += `<div class="bpay-chip-stack bpay-chip-stack-half${newGroup ? ' new-denom' : ''}">` +
              `<div class="bpay-chip-stack-face"></div>` +
              `<div class="bpay-chip-stack-body"></div>` +
              `<div class="bpay-chip-stack-label"><span class="bpay-stack-key">10K</span><span class="bpay-stack-cnt">×5</span></div>` +
              `</div>`;
            for (let j = 0; j < 5; j++) {
              discs += `<div class="bpay-chip-disc bpay-stack-spread-disc" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
            }
          } else if (key === '10K' && cnt > 10) {
            discs += `<div class="bpay-chip-stack bpay-chip-stack-full${newGroup ? ' new-denom' : ''}">` +
              `<div class="bpay-chip-stack-face"></div>` +
              `<div class="bpay-chip-stack-body"></div>` +
              `<div class="bpay-chip-stack-label"><span class="bpay-stack-key">10K</span><span class="bpay-stack-cnt">×${cnt}</span></div>` +
              `</div>`;
          } else {
            for (let j = 0; j < cnt; j++) {
              const sep = j === 0 && newGroup;
              discs += `<div class="bpay-chip-disc${sep ? ' new-denom' : ''}" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
            }
          }
        });
        bAmt.innerHTML = `<div class="bpay-chip-spread">${discs}</div>`;
      });
    }

    function updateSpread() {
      const section = $('bpay-spread-section');
      if (!section) return;
      const items = [];
      COMM_CHIPS.forEach(c => {
        const cnt = parseInt($(`bpay-ci-${c.key}`)?.value) || 0;
        for (let i = 0; i < cnt; i++) {
          const isNewDenom  = i === 0;
          const isGroup5Gap = !isNewDenom && i % 5 === 0;
          items.push({ c, isNewDenom, isGroup5Gap });
        }
      });
      if (items.length === 0) { section.innerHTML = ''; return; }
      const discs = items.map(({ c, isNewDenom, isGroup5Gap }, idx) => {
        let cls = 'spread-disc';
        if (idx > 0) {
          if (isNewDenom)  cls += ' spread-gap';
          else if (isGroup5Gap) cls += ' spread-gap5';
        }
        return `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
      }).join('');
      section.innerHTML = `<div class="spread-row">${discs}</div>`;
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
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.addChip('${c.key}',5)">+5개</button>
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.addChip('${c.key}',1)">+1개</button>
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
      const maxAmt  = SIDE_BET_MAX[key] ?? 1_000_000;
      const maxUnits = maxAmt / SIDE_BET_MIN;
      const units   = 1 + Math.floor(Math.random() * maxUnits);
      const total   = units * SIDE_BET_MIN;
      const cnt100  = Math.floor(total / 100_000);
      const cnt10   = (total % 100_000) / 10_000;
      const result  = {};
      if (cnt100 > 0) result[SIDE_CHIPS[0].key] = cnt100;
      if (cnt10  > 0) result[SIDE_CHIPS[1].key] = cnt10;
      return result;
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
      const items = [];
      COMM_CHIPS.forEach(c => {
        const cnt = parseInt($(`bside-ci-${c.key}`)?.value) || 0;
        for (let i = 0; i < cnt; i++) {
          items.push({ c, isNewDenom: i === 0, isGroup5Gap: i > 0 && i % 5 === 0 });
        }
      });
      if (items.length === 0) { section.innerHTML = ''; return; }
      const discs = items.map(({ c, isNewDenom, isGroup5Gap }, idx) => {
        let cls = 'spread-disc';
        if (idx > 0) {
          if (isNewDenom) cls += ' spread-gap';
          else if (isGroup5Gap) cls += ' spread-gap5';
        }
        return `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${c.key}</div>`;
      }).join('');
      section.innerHTML = `<div class="spread-row">${discs}</div>`;
    }

    function showPayTray() {
      const panel = $('bside-comm-panel');
      const spread = $('bside-spread-section');
      if (!panel) return;
      panel.style.display = 'block';
      if (spread) { spread.style.display = 'flex'; spread.innerHTML = ''; }
      const multBadge = S.currentMult !== undefined
        ? `<div class="bside-mult-badge">×${S.currentMult}</div>` : '';
      panel.innerHTML = `<div class="comm-tray">
        ${multBadge}
        <div class="comm-tray-slots">
          ${COMM_CHIPS.filter(c => c.val >= 10000).map(c => `
            <div class="comm-slot">
              <div class="comm-slot-chip" style="background:${c.bg};color:${c.fg}">${c.key}</div>
              <input type="hidden" id="bside-ci-${c.key}" value="0">
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.baccaratSide.addChip('${c.key}',5)">+5개</button>
                <button class="comm-5k-btn" onclick="Sims.baccaratSide.addChip('${c.key}',1)">+1개</button>
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
      { key: 'red',    val:   5_000, bg: '#e53935', fg: '#fff'    },
      { key: 'blue',   val:  10_000, bg: '#1565c0', fg: '#fff'    },
      { key: 'green',  val:  25_000, bg: '#2e7d32', fg: '#fff'    },
      { key: 'yellow', val:  50_000, bg: '#f9a825', fg: '#1a1a1a' },
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

    function genChips(color) {
      const count = 1 + Math.floor(Math.random() * 5); // 1-5 chips
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

      // Reset zoom before re-rendering
      tbl.style.transition = 'none';
      tbl.style.transform = '';
      tbl.style.transformOrigin = '';
      const tableWrap = document.querySelector('.rpay-sim .rpay-table');
      if (tableWrap) tableWrap.classList.remove('rpay-zoomed');

      // Reset win highlight and remove old chip spots/dolly
      tbl.querySelectorAll('.rpay-win-cell').forEach(el => el.classList.remove('rpay-win-cell'));
      tbl.querySelectorAll('.rpay-spot').forEach(el => el.remove());
      tbl.querySelectorAll('.rpay-dolly').forEach(el => el.remove());

      // Highlight winning number
      const winEl = tbl.querySelector(`[data-bet="${N}"]`);
      if (winEl) winEl.classList.add('rpay-win-cell');

      requestAnimationFrame(() => {
        const tRect = tbl.getBoundingClientRect();

        function cc(num) {
          const el = tbl.querySelector(`[data-bet="${num}"]`);
          if (!el) return null;
          // Use td bounds for border-exact intersection positioning
          const cell = el.closest('td') || el;
          const r = cell.getBoundingClientRect();
          return {
            x:      r.left - tRect.left + r.width/2,
            y:      r.top  - tRect.top  + r.height/2,
            left:   r.left   - tRect.left,
            right:  r.right  - tRect.left,
            top:    r.top    - tRect.top,
            bottom: r.bottom - tRect.top,
          };
        }

        activeSpots.forEach((sp, i) => {
          let x, y;
          if (sp.type === 'Straight') {
            const c = cc(N); if (!c) return;
            x = c.x; y = c.y;
          } else if (sp.type === 'Split' || sp.type === 'Corner') {
            const cs = sp.nums.map(n => cc(n)).filter(Boolean);
            if (!cs.length) return;
            x = cs.reduce((s,c) => s+c.x, 0)/cs.length;
            y = cs.reduce((s,c) => s+c.y, 0)/cs.length;
          } else if (sp.type === 'SixNum' || sp.type === 'Street') {
            const cs = sp.nums.map(n => cc(n)).filter(Boolean);
            if (!cs.length) return;
            x = cs.reduce((s,c) => s+c.x, 0)/cs.length;
            y = Math.min(...cs.map(c => c.top)); // outer edge toward outside bets
          }
          if (x === undefined) return;

          const [[key, cnt]] = Object.entries(sp.chips);
          const c = COLOR_CHIPS.find(b => b.key === key);
          const chipHtml = `<div class="rpay-spot-chip" style="background:${c.bg};border-color:${c.fg==='#fff'?'rgba(255,255,255,.5)':'rgba(0,0,0,.25)'}"><span class="rpay-spot-count" style="color:${c.fg}">CC</span></div>`;

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

          tbl.appendChild(el);
        });

        // Dolly marker on winning number
        const winC = cc(N);
        if (winC) {
          const dolly = document.createElement('div');
          dolly.className = 'rpay-dolly';
          dolly.style.cssText = `left:${winC.x}px;top:${winC.y}px`;
          tbl.appendChild(dolly);
        }

        Sims.roulettePay._startTimer();
        highlightSpot(0);
      });
    }

    function zoomToSpot(idx) {
      const tbl = document.getElementById('rpay-full-table');
      const tableWrap = document.querySelector('.rpay-bet-side');
      if (!tbl || !tableWrap) return;

      if (idx < 0) {
        tbl.style.transition = 'transform 0.35s ease';
        tbl.style.transform = '';
        tableWrap.classList.remove('rpay-zoomed');
        return;
      }

      const spotEl = document.getElementById(`rpay-spot-${idx}`);
      if (!spotEl) return;

      const cx = parseFloat(spotEl.dataset.bboxCx ?? spotEl.style.left);

      // scale so the 3-row number grid fills ~88% of container height
      const tblRect = tbl.getBoundingClientRect();
      const topCell = tbl.querySelector('[data-bet="34"]');
      const botCell = tbl.querySelector('[data-bet="36"]');
      const ch = tableWrap.offsetHeight;
      const tw = tbl.offsetWidth;
      const th = tbl.offsetHeight;

      let gridH  = th;
      let gridCy = th / 2;
      if (topCell && botCell) {
        const tR = topCell.getBoundingClientRect();
        const bR = botCell.getBoundingClientRect();
        gridH  = bR.bottom - tR.top;
        gridCy = (tR.top - tblRect.top) + gridH / 2;
      }

      const spotType = S.spots[idx]?.type;
      const fillFactor = (spotType === 'Street' || spotType === 'SixNum') ? 0.3 : 0.88;
      const maxScale  = (spotType === 'Street' || spotType === 'SixNum') ? 2.0 : 4.5;
      const scale = Math.min(ch * fillFactor / gridH, maxScale);

      const tx = tw / (2 * scale) - cx;
      const padTop = parseFloat(getComputedStyle(tableWrap).paddingTop) || 0;
      const ty = (ch / 2 - padTop) / scale - gridCy;

      tableWrap.classList.add('rpay-zoomed');
      tbl.style.transition = 'transform 0.35s ease';
      tbl.style.transformOrigin = '0 0';
      tbl.style.transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
    }

    function highlightSpot(idx) {
      const tbl = document.getElementById('rpay-full-table');

      // clear previous bet cell highlights
      if (tbl) tbl.querySelectorAll('.rpay-bet-cell').forEach(el => el.classList.remove('rpay-bet-cell'));

      document.querySelectorAll('.rpay-spot').forEach((el,i) => {
        el.classList.toggle('rpay-spot-paying', i === idx);
        el.classList.toggle('rpay-spot-paid', i < idx);
      });

      // highlight cells of the active bet
      if (tbl && idx >= 0) {
        const spotEl = document.getElementById(`rpay-spot-${idx}`);
        if (spotEl && spotEl.dataset.betNums) {
          spotEl.dataset.betNums.split(',').forEach(n => {
            const cell = tbl.querySelector(`[data-bet="${n}"]`);
            if (cell && !cell.classList.contains('rpay-win-cell')) cell.classList.add('rpay-bet-cell');
          });
        }
      }

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

      panel.innerHTML = `
        <div class="comm-tray rpay-btray">
          <div id="rpay-order-warn" class="bpay-order-warn" style="display:none"><span>저액 칩스부터 세팅하세요</span></div>
          <div class="comm-tray-slots">
            <div class="comm-slot">
              <div class="comm-slot-chip" id="rpay-disc-color" style="background:${color.bg};color:${color.fg}">CC</div>
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',20)">+20개</button>
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',5)">+5개</button>
                <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('color',1)">+1개</button>
              </div>
              <button class="comm-5k-reset" onclick="Sims.roulettePay.resetChip('color')">RESET</button>
            </div>
            ${MONEY_CHIPS.map(c => `
              <div class="comm-slot">
                <div class="comm-slot-chip" id="rpay-disc-${c.key}" style="background:${c.bg};color:${c.fg}">${c.key}</div>
                <div class="comm-5k-btns">
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',20)">+20개</button>
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',5)">+5개</button>
                  <button class="comm-5k-btn" onclick="Sims.roulettePay.addChip('${c.key}',1)">+1개</button>
                </div>
                <button class="comm-5k-reset" onclick="Sims.roulettePay.resetChip('${c.key}')">RESET</button>
              </div>`).join('')}
            <div class="comm-pay-slot">
              <button class="comm-pay-btn" onclick="Sims.roulettePay.submitPay()">PAY</button>
              <button class="comm-all-reset-btn" onclick="Sims.roulettePay.resetPay()">ALL RESET</button>
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

      // Stack 2D layout positions [col, row] per stack count (1–4)
      const STACK_LAYOUTS = [
        null,
        [[0, 0]],                                        // 1: single
        [[0, 1], [1, 0]],                                // 2: diagonal
        [[0, 1], [2, 1], [1, 0]],                       // 3: triangle
        [[1, 0], [0, 1], [2, 1], [1, 2]],               // 4: diamond (3-triangle + top-left stack)
        [[0, 0], [2, 0], [4, 0], [1, 1], [3, 1]],      // 5: 3-top, 2-bottom
      ];
      const STK_W = 38, STK_H = 33;

      function makeStackGroup(c, label, count) {
        const layout = STACK_LAYOUTS[Math.min(count, 5)];
        const colStep = count === 5 ? 10 : 16;
        const rowStep = count === 5 ? 18 : 14;
        const maxCol = Math.max(...layout.map(p => p[0]));
        const maxRow = Math.max(...layout.map(p => p[1]));
        const cw = maxCol * colStep + STK_W;
        const ch = maxRow * rowStep + STK_H;
        const stackHtml = layout.slice(0, count).map(([col, row]) =>
          `<div class="rpay-chip-stack" style="--stk-bg:${c.bg};--stk-fg:${c.fg};position:absolute;left:${col*colStep}px;top:${row*rowStep}px;z-index:${row+1}">` +
          `<div class="rpay-chip-stack-face"></div>` +
          `<div class="rpay-chip-stack-body"></div>` +
          `<span class="rpay-stack-label" style="color:${c.fg}">${label}</span>` +
          `</div>`
        ).join('');
        const totalLabel = `<span style="font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9)">${count * 20}</span>`;
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0">` +
          `<div style="position:relative;width:${cw}px;height:${ch}px;flex-shrink:0">${stackHtml}</div>` +
          `${totalLabel}</div>`;
      }

      const parts = [];
      allChipDefs.forEach(c => {
        const cnt = S.payChips[c.key] || 0;
        if (!cnt) return;

        if (c.key === 'color') {
          // 20의 배수 → 풀스택, 나머지는 5개 단위: (n번째 그룹까지 미니스택, 마지막 그룹 스프레드)
          const fullStacks = Math.floor(cnt / 20);
          const rem = cnt % 20;
          const miniStacks = rem >= 5 ? Math.max(0, Math.floor(rem / 5) - 1) : 0;
          const spreadCount = rem - miniStacks * 5;

          const inner = [];
          if (fullStacks > 0) inner.push(makeStackGroup(c, 'CC', fullStacks));
          for (let i = 0; i < miniStacks; i++) {
            inner.push(
              `<div class="rpay-chip-stack rpay-mini-stack" style="--stk-bg:${c.bg};--stk-fg:${c.fg}">` +
              `<div class="rpay-chip-stack-face"></div>` +
              `<div class="rpay-chip-stack-body"></div>` +
              `<span class="rpay-stack-label" style="color:${c.fg}">CC</span>` +
              `</div>`
            );
          }
          if (spreadCount > 0) {
            let discs = '';
            for (let i = 0; i < spreadCount; i++) {
              discs += `<div class="spread-disc" style="background:${c.bg};color:${c.fg}">CC</div>`;
            }
            inner.push(`<div class="spread-row">${discs}</div>`);
          }
          parts.push(`<div style="display:flex;align-items:flex-end;gap:6px;flex-shrink:0">${inner.join('')}</div>`);
        } else {
          const label = c.key;
          const stackCount = Math.floor(cnt / 20);
          const loose = cnt % 20;
          if (stackCount > 0) parts.push(makeStackGroup(c, label, stackCount));
          if (loose > 0) {
            let discs = '';
            for (let i = 0; i < loose; i++) {
              let cls = 'spread-disc';
              if (i > 0 && i % 5 === 0) cls += ' spread-gap5';
              discs += `<div class="${cls}" style="background:${c.bg};color:${c.fg}">${label}</div>`;
            }
            parts.push(`<div class="spread-row">${discs}</div>`);
          }
        }
      });

      zone.innerHTML = parts.length
        ? `<div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;gap:10px">${parts.join('')}</div>`
        : '';
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
        S = { winNum: null, spots: [], spotIdx: 0, rounds: 0, score: 0, lastNum: null, roundColor: null,
              payChips: { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 },
              timerStart: null, timerInterval: null };
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
        const roundColor = COLOR_CHIPS[Math.floor(Math.random() * COLOR_CHIPS.length)];
        S.roundColor = roundColor;
        S.spots = allSpots.map(sp => {
          const { chips, total } = genChips(roundColor);
          return { ...sp, chips, total };
        });

        renderFullGrid(N, S.spots);
        showTray();
      },

      addChip(key, n) {
        S.payChips[key] = (S.payChips[key] || 0) + n;
        updateTray();
      },

      resetChip(key) {
        S.payChips[key] = 0;
        updateTray();
      },

      resetPay() {
        S.payChips = { color: 0, '100M': 0, '10M': 0, '1M': 0, '100K': 0, '10K': 0, '5K': 0 };
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

    function mkThpCompare() {
      const $ = id => document.getElementById(id);
      const sh = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
      const NAMES = ['플레이어 1', '플레이어 2', '플레이어 3', '딜러'];

      let S = { rounds: 0, score: 0, phase: 'idle', mode: 'random', curIdx: 0 };

      function init() {
        S = { rounds: 0, score: 0, phase: 'idle', mode: 'random', curIdx: 0 };
        sh('thpc-rounds', '0'); sh('thpc-score', '0');
        sh('thpc-comm-cards', ''); sh('thpc-players', '');
        sh('thpc-split-btn', ''); sh('thpc-result', ''); sh('thpc-explain', '');
        sh('thpc-scenario-info', '');
        updateModeUI();
        const btn = $('thpc-deal-btn');
        if (btn) { btn.disabled = false; btn.textContent = 'DEAL'; }
      }

      function setMode(m) {
        S.mode = m; S.curIdx = 0; S.phase = 'idle';
        updateModeUI();
        sh('thpc-scenario-info', ''); sh('thpc-comm-cards', ''); sh('thpc-players', '');
        sh('thpc-split-btn', ''); sh('thpc-result', ''); sh('thpc-explain', '');
        const btn = $('thpc-deal-btn');
        if (btn) { btn.disabled = false; btn.textContent = 'DEAL'; }
      }

      function updateModeUI() {
        const rb = $('thpc-btn-random'), cb = $('thpc-btn-curated');
        if (rb) rb.classList.toggle('active', S.mode === 'random');
        if (cb) cb.classList.toggle('active', S.mode === 'curated');
      }

      function deal() {
        if (S.phase === 'quiz') return;
        if (S.mode === 'random') dealRandom(); else dealCurated();
      }

      function dealRandom() {
        S.rounds++; sh('thpc-rounds', S.rounds);
        const deck = createDeck(1);
        S.players = NAMES.map(name => ({ name, cards: [deck.pop(), deck.pop()] }));
        S.comm = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
        sh('thpc-scenario-info', '');
        renderBoard();
      }

      function dealCurated() {
        const sc = THP_CURATED[S.curIdx];
        S.rounds++; sh('thpc-rounds', S.rounds);
        S.players = sc.players.map(p => ({ name: p.name, cards: p.cards.map(c => ({...c})) }));
        S.comm = sc.community.map(c => ({...c}));
        const thisIdx = S.curIdx;
        S.curIdx = (S.curIdx + 1) % THP_CURATED.length;
        const diffMap = { easy: '쉬움', medium: '보통', hard: '어려움' };
        sh('thpc-scenario-info', `
          <div class="thpc-scenario-info-box">
            <div class="thpc-scenario-header">
              <span class="thpc-diff-badge thpc-diff-${sc.difficulty}">${diffMap[sc.difficulty]}</span>
              <span class="thpc-scenario-title">${sc.title}</span>
              <span class="thpc-scenario-count">${thisIdx + 1} / ${THP_CURATED.length}</span>
            </div>
            <div class="thpc-scenario-desc">${sc.desc}</div>
          </div>`);
        renderBoard();
      }

      function renderBoard() {
        S.phase = 'quiz';
        sh('thpc-result', ''); sh('thpc-explain', '');
        sh('thpc-comm-cards', S.comm.map(c => cardHTML(c)).join(''));
        sh('thpc-players', S.players.map((p, i) => `
          <div class="thpc-player quiz-active" id="thpc-p${i}" onclick="Sims.poker.thp.answer(${i})">
            <div class="thpc-player-name">${p.name}</div>
            <div class="thpc-hole-cards">${p.cards.map(c => cardHTML(c)).join('')}</div>
            <div id="thpc-reveal-${i}"></div>
          </div>`).join(''));
        sh('thpc-split-btn', `<div class="thpc-split-row">
          <button class="btn-pk btn-pk-tie" onclick="Sims.poker.thp.answer('split')">🤝 스플릿 (동점)</button>
        </div>`);
        const btn = $('thpc-deal-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'DEAL'; }
      }

      function answer(choice) {
        if (S.phase !== 'quiz') return;
        S.phase = 'done';

        const results = S.players.map((p, i) => {
          const { ev, bestCards } = bestPokerHandCards([...p.cards, ...S.comm]);
          return { name: p.name, idx: i, ev, bestCards };
        });

        const topEv = results.reduce((b, r) => !b || cmpPokerHands(r.ev, b) > 0 ? r.ev : b, null);
        const winners = results.filter(r => cmpPokerHands(r.ev, topEv) === 0);
        const isSplit = winners.length > 1;
        const correct = isSplit ? 'split' : winners[0].idx;
        const ok = choice === correct;
        if (ok) S.score++;
        sh('thpc-score', S.score);

        results.forEach(r => {
          const el = $(`thpc-p${r.idx}`);
          if (!el) return;
          el.onclick = null;
          el.classList.remove('quiz-active');
          const isWin = winners.some(w => w.idx === r.idx);
          el.classList.add(isWin ? 'thpc-winner' : 'thpc-loser');
          if (r.idx === choice) el.classList.add(ok ? 'thpc-pick-ok' : 'thpc-pick-wrong');
          sh(`thpc-reveal-${r.idx}`, `
            <div class="thpc-hand-reveal">
              <div class="thpc-hand-name">${r.ev.l}</div>
              <div class="thpc-best-label">최강 5장</div>
              <div class="thpc-best-cards">${r.bestCards.map(c => cardHTML(c)).join('')}</div>
            </div>`);
        });

        sh('thpc-split-btn', isSplit && choice !== 'split'
          ? `<div class="thpc-split-row thpc-split-answer">🤝 스플릿이 정답이었습니다</div>`
          : choice === 'split' ? `<div class="thpc-split-row">${ok ? '✓' : '✗'} 스플릿 선택</div>` : '');

        const winnerNames = winners.map(w => w.name).join(', ');
        sh('thpc-result', `<div class="pk-result-msg ${ok ? 'pk-ok' : 'pk-wrong'}">
          ${ok ? '✓ 정답!' : '✗ 오답'} — ${isSplit ? `스플릿 (${winnerNames})` : `${winnerNames} 승리`}
        </div>`);

        const sorted = [...results].sort((a, b) => cmpPokerHands(b.ev, a.ev));
        const allSame = results.every(r => r.ev.r === results[0].ev.r);
        const kickerNote = (allSame && !isSplit)
          ? `<div class="thpc-kicker-note">⚡ 모두 ${results[0].ev.l} — 키커(kicker)로 승자 결정</div>` : '';
        const rankIcons = ['🥇','🥈','🥉',''];
        const rows = sorted.map((r, rank) => {
          const isWin = winners.some(w => w.idx === r.idx);
          return `<div class="thpc-explain-entry ${isWin ? 'winner-entry' : 'loser-entry'}">
            <span class="thpc-explain-icon">${rankIcons[Math.min(rank, 3)]}</span>
            <span class="thpc-explain-name">${r.name}</span>
            <span class="thpc-explain-hand">${r.ev.l}</span>
          </div>`;
        }).join('');
        sh('thpc-explain', `<div class="thpc-explain-box">${kickerNote}${rows}</div>`);

        const btn = $('thpc-deal-btn');
        if (btn) { btn.disabled = false; btn.textContent = 'NEXT'; }
      }

      return { init, deal, answer, setMode };
    }

    return {
      isp: mkSim('isp', 5, 5, 0),
      tcp: mkSim('tcp', 3, 3, 2),
      thp: mkThpCompare(),
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

  let html = `<div class="evens-row">
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

  html += `<table class="roulette-grid"><tbody>`;
  rows.forEach((row, ri) => {
    html += `<tr>`;
    html += `<td><div class="bet-spot col-bet" data-bet="${colBets[ri]}">2TO1</div></td>`;
    row.forEach(n => {
      const cls = RED_NUMS.has(n) ? 'red-num' : 'black-num';
      html += `<td><div class="bet-spot ${cls}" data-bet="${n}">${n}</div></td>`;
    });
    if (ri === 0) html += `<td rowspan="3" class="zero-cell"><div class="bet-spot green-num" data-bet="0">0</div></td>`;
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  return html;
}

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => App.init());
