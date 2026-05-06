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
      if (game === 'roulette')  el.innerHTML = Views.rouletteSim();
      Sims[game] && Sims[game].init();
    }
    if (mode === 'paysim' && game === 'baccarat') {
      el.innerHTML = Views.baccaratPaySim();
      Sims.baccaratPay && Sims.baccaratPay.init();
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
};

// ---- VIEWS ----

const Views = {
  home: () => `
    <section class="hero">
      <div class="hero-content">
        <div class="badge">♠ Professional Dealer Training</div>
        <h1 class="hero-title">Casino Dealer<br><span class="gold">Training System</span></h1>
        <p class="hero-sub">왼쪽 메뉴에서 연습할 항목을 선택하세요.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="App.navigate('baccarat','simulation')">🃏 Drawing Practice</button>
          <button class="btn btn-outline" onclick="App.navigate('baccarat','paysim')">💰 Payout Practice</button>
        </div>
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
         <button class="btn btn-secondary" onclick="App.navigate('baccarat','paysim')">⚡ Payout Practice</button>
         `
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
    return `
      <div class="tutorial-page">
        <div class="tutorial-header">
          <button class="back-btn" onclick="App.navigate('${game}')">← Back</button>
          <h1>${g.icon} ${g.name} Tutorial</h1>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('${game}','simulation')">Simulation →</button>
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
            <button class="btn btn-primary btn-full" onclick="App.navigate('${game}','simulation')">⚡ Practice Simulation</button>
          </div>
        </div>
      </div>`;
  },

  blackjackSim: () => `
    <div class="sim-page blackjack-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('blackjack')">← Back</button>
        <h2>♠ Blackjack Card Counting Practice</h2>
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
                <div class="area-label">P${i+1}</div>
              </div>`).join('')}
          </div>
          <div class="dealer-area-bj" id="bj-dealer-wrap">
            <div class="area-label">DEALER</div>
            <div class="hand-display" id="bj-dealer-hand"></div>
            <div class="dealer-ctrl-area" id="bj-dealer-controls"></div>
          </div>
        </div>
      </div>
      <div class="sim-controls">
        <div class="message-board" id="bj-msg">Press Start to deal.</div>
        <div class="action-buttons" id="bj-actions"></div>
      </div>
    </div>`,

  baccaratSim: () => `
    <div class="sim-page baccarat-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Baccarat Drawing Practice</h2>
        <div class="sim-stats"><span>Rounds: <strong id="bac-rounds">0</strong></span><span>Score: <strong id="bac-score">0</strong></span></div>
      </div>
      <div class="baccarat-table">
        <div id="bac-win-header" class="bac-win-header"></div>
        <div class="bac-btn-cluster">
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
            <button class="btn-draw-shoe" id="bac-draw-btn" onclick="Sims.baccarat.deal()">START</button>
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
      </div>
      <div class="bac-pay-panel" id="bac-pay-panel" style="display:none"></div>
    </div>`,

  rouletteSim: () => `
    <div class="sim-page roulette-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('roulette')">← Back</button>
        <h2>🎡 Roulette Simulation</h2>
        <div class="sim-stats"><span>Rounds: <strong id="rou-rounds">0</strong></span></div>
      </div>
      <div class="roulette-layout">
        <div class="wheel-area">
          <div class="roulette-wheel">
            <div class="wheel-inner" id="wheel-inner">${buildWheel()}</div>
            <div class="wheel-center"><div class="wheel-center-dot"></div></div>
          </div>
          <div class="result-display" id="rou-result"></div>
        </div>
        <div class="betting-area">
          <div class="betting-table" id="betting-table">${buildBettingTable()}</div>
          <div class="bet-summary">Active bets: <strong id="bet-list">None</strong></div>
        </div>
      </div>
      <div class="sim-controls">
        <div class="message-board" id="rou-msg">Place bets on the table, then click "No More Bets / Spin".</div>
        <div class="action-buttons" id="rou-actions">
          <button class="btn btn-secondary" onclick="Sims.roulette.clearBets()">Clear Bets</button>
          <button class="btn btn-primary"   onclick="Sims.roulette.spin()">No More Bets / Spin</button>
        </div>
      </div>
      <div class="payout-panel" id="rou-payouts"></div>
    </div>`,

  baccaratPaySim: () => `
    <div class="sim-page baccarat-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Baccarat Payout Practice</h2>
        <div class="sim-stats">
          <span>Rounds: <strong id="bpay-rounds">0</strong></span>
          <span>Score: <strong id="bpay-score">0</strong></span>
        </div>
      </div>
      <div class="baccarat-table">
        <div class="bpay-positions">
          ${[1,2,3].map(i => `
            <div class="bpay-pos" id="bpay-pos-${i}">
              <div class="bpay-oval bpay-p-oval" id="bpay-p-${i}">
                <div class="bpay-oval-lbl">PLAYER</div>
                <div class="bpay-oval-amt" id="bpay-p-amt-${i}"></div>
              </div>
              <div class="bpay-oval bpay-b-oval" id="bpay-b-${i}">
                <div class="bpay-oval-lbl">BANKER</div>
                <div class="bpay-oval-amt" id="bpay-b-amt-${i}"></div>
              </div>
              <div class="bpay-circles">
                <div class="bpay-circ bpay-tiger">BIG<br>TIGER<br><span class="bpay-circ-pay">×50</span></div>
                <div class="bpay-circ bpay-tiger">TIE<br><span class="bpay-circ-pay">×8</span></div>
                <div class="bpay-circ bpay-tiger">SMALL<br>TIGER<br><span class="bpay-circ-pay">×22</span></div>
              </div>
              <div class="bpay-circles">
                <div class="bpay-circ bpay-dragon">SMALL<br>DRAGON<br><span class="bpay-circ-pay">×15</span></div>
                <div class="bpay-circ bpay-dragon">SUPER<br>7</div>
                <div class="bpay-circ bpay-dragon">BIG<br>DRAGON<br><span class="bpay-circ-pay">×30</span></div>
              </div>
            </div>`).join('')}
        </div>
        <div class="bpay-start-overlay" id="bpay-start-overlay">
          <button class="bpay-start-btn" onclick="Sims.baccaratPay.deal()">START</button>
        </div>
      </div>
      <div class="bpay-comm-panel" id="bpay-comm-panel" style="display:none"></div>
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
      { bet: 'Player Pair', pays: '11:1' },
      { bet: 'Banker Pair', pays: '11:1' },
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
};

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
    const msg    = t      => { $('bj-msg').textContent = t; $('bj-msg').style.color = ''; };
    const msgCol = (t, c) => { $('bj-msg').textContent = t; $('bj-msg').style.color = c; };
    const actions = h     => { $('bj-actions').innerHTML = h; };
    const stats   = ()    => { $('bj-rounds').textContent = S.rounds; $('bj-score').textContent = S.score; };
    const dealerCtrl    = h => { const e = $('bj-dealer-controls'); if (e) e.innerHTML = h; };
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
      setTimeout(() => { wrap.remove(); callback(); }, 1000);
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
      const wins   = S.players.filter(p => p.status === 'win').length;
      const losses = S.players.filter(p => p.status === 'lose').length;
      const pushes = S.players.filter(p => p.status === 'push').length;
      msgCol(`Round complete! Paid: ${wins} · Took: ${losses} · Push: ${pushes}`, '#c9a84c');
      S.score += wins;
      stats();
      enableStart();
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
              setTimeout(() => bjReveal(id), 180);
            } else {
              const el = $('bj-dealer-hand');
              if (!el) return;
              el.insertAdjacentHTML('beforeend', bjFlipHTML(step.card, id, false));
              setTimeout(() => bjReveal(id), 180);
            }
          }, n * 260);
        });

        setTimeout(() => {
          stats();
          msg('Game started!');
          S.current = -1;
          advancePlayer();
        }, steps.length * 260 + 600);
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
            setTimeout(() => bjReveal(id), 180);
            setTimeout(() => {
              const pv = total(p.hand);
              if (pv > 21) {
                p.status = 'bust';
                renderPlayers();
                msg(`Player ${i + 1}: Bust!`);
                setTimeout(() => advancePlayer(), 700);
              } else if (pv === 21) {
                p.status = 'stand';
                renderPlayers();
                msg(`Player ${i + 1}: 21`);
                setTimeout(() => advancePlayer(), 700);
              } else {
                autoDecide();
              }
            }, 750);
          } else {
            p.status = 'stand';
            setTimeout(() => advancePlayer(), 650);
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
        setTimeout(() => bjReveal(id), 180);
        setTimeout(() => showDealerControls(), 700);
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

    function showMistake(retryFn) {
      clearInlineBtns();
      const tbl = document.querySelector('.baccarat-table');
      if (!tbl) return;
      const ov = document.createElement('div');
      ov.className = 'mistake-overlay';
      ov.innerHTML = '<div class="mistake-text">MISTAKE!</div>';
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

    function showInitialQuiz() {
      setBtn('bac-b-btn-top', `<button class="btn-bac-banker bac-inline-btn" onclick="Sims.baccarat.quizInitial('win','banker')">BANKER WIN</button>`);
      setBtn('bac-b-btn-bot', `<button class="btn-bac-draw bac-inline-btn" onclick="Sims.baccarat.quizInitial('draw-banker',null)">BANKER DRAW</button>`);
      setBtn('bac-p-btn-top', `<button class="btn-bac-player bac-inline-btn" onclick="Sims.baccarat.quizInitial('win','player')">PLAYER WIN</button>`);
      setBtn('bac-p-btn-bot', `<button class="btn-bac-draw bac-inline-btn" onclick="Sims.baccarat.quizInitial('draw-player',null)">PLAYER DRAW</button>`);
      setBtn('bac-tie-btn',   `<button class="btn-bac-tie bac-inline-btn" onclick="Sims.baccarat.quizInitial('win','tie')">TIE</button>`);
      msg('Choose action:');
    }

    function showAnnounceQuiz() {
      setBtn('bac-b-btn-top', `<button class="btn-bac-banker bac-inline-btn" onclick="Sims.baccarat.quizAnnounce('banker')">BANKER WIN</button>`);
      setBtn('bac-b-btn-bot', '');
      setBtn('bac-p-btn-top', `<button class="btn-bac-player bac-inline-btn" onclick="Sims.baccarat.quizAnnounce('player')">PLAYER WIN</button>`);
      setBtn('bac-p-btn-bot', '');
      setBtn('bac-tie-btn',   `<button class="btn-bac-tie bac-inline-btn" onclick="Sims.baccarat.quizAnnounce('tie')">TIE</button>`);
      msg('Announce winner:');
    }

    function showBankerDrawQuiz() {
      setBtn('bac-b-btn-top', `<button class="btn-bac-banker bac-inline-btn" onclick="Sims.baccarat.quizBanker('win','banker')">BANKER WIN</button>`);
      setBtn('bac-b-btn-bot', `<button class="btn-bac-draw bac-inline-btn" onclick="Sims.baccarat.quizBanker('draw-banker',null)">BANKER DRAW</button>`);
      setBtn('bac-p-btn-top', `<button class="btn-bac-player bac-inline-btn" onclick="Sims.baccarat.quizBanker('win','player')">PLAYER WIN</button>`);
      setBtn('bac-p-btn-bot', '');
      setBtn('bac-tie-btn',   `<button class="btn-bac-tie bac-inline-btn" onclick="Sims.baccarat.quizBanker('win','tie')">TIE</button>`);
      msg(`Player drew ${S.pThird.rank}${S.pThird.suit}. Banker action?`);
    }

    function getSpecialLabel(side) {
      const colors = { player: '#4ecdc4', banker: '#c9a84c', tie: '#6ec864' };
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
      if (pp === 7 && S.ph.length === 2 && bp === 6) lines.push('SUPER 7');
      else if (pp === 7 && S.ph.length === 2)        lines.push('SMALL 7');
      if (pp === 7 && S.ph.length === 3)             lines.push('BIG 7');
      return { lines, color };
    }

    function showWinnerFlash(side) {
      const el = $('bac-winner-flash');
      if (!el) return;
      const { lines, color } = getSpecialLabel(side);
      el.innerHTML = `<div class="bac-winner-flash-text" style="color:${color}">${lines.join('<br>')}</div>`;
      el.className = 'bac-winner-flash bac-wf-in';
      setTimeout(() => {
        el.classList.replace('bac-wf-in', 'bac-wf-out');
        setTimeout(() => { el.className = 'bac-winner-flash'; }, 700);
      }, 1200);
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
      const wh = $('bac-win-header');
      if (wh) wh.innerHTML = lines.map(l => `<span class="bac-win-announce ${cls}">${l}</span>`).join('<span class="bac-win-sep"> · </span>');
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
        S = { deck: createDeck(8), ph: [], bh: [], pThird: null,
              rounds: 0, score: 0, winner: null, bets: [] };
        enableDraw();
      },

      deal() {
        if (S.deck.length < 20) S.deck = createDeck(8);
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
        const wh = $('bac-win-header'); if (wh) wh.innerHTML = '';
        clearInlineBtns();

        const wf = $('bac-winner-flash'); if (wf) { wf.className = 'bac-winner-flash'; wf.innerHTML = ''; }

        S.bets = generateBets();
        renderBets();

        const cards = [S.deck.pop(), S.deck.pop(), S.deck.pop(), S.deck.pop()];
        // cards[0]=P2(pos4), cards[1]=B1(pos2), cards[2]=P1(pos3), cards[3]=B2(pos1)
        S.ph = [cards[2], cards[0]]; // [P1, P2]
        S.bh = [cards[1], cards[3]]; // [B1, B2]

        msg('Dealing...');

        // Deal visual order: 4→2→3→1 (P2, B1, P1, B2)
        dealSequence(cards, ['bac-ph','bac-bh','bac-ph','bac-bh'], () => showInitialQuiz());
      },

      quizInitial(choice, side) {
        const pp = pts(S.ph), bp = pts(S.bh);
        let correctChoice, correctSide = null;
        if (pp >= 8 || bp >= 8) {
          correctChoice = 'win';
          correctSide = pp > bp ? 'player' : bp > pp ? 'banker' : 'tie';
        } else if (pp <= 5) {
          correctChoice = 'draw-player';
        } else if (bankerRule(bp, null)) {
          correctChoice = 'draw-banker';
        } else {
          correctChoice = 'win';
          correctSide = pp > bp ? 'player' : bp > pp ? 'banker' : 'tie';
        }
        const correct = correctChoice === 'win'
          ? (choice === 'win' && side === correctSide)
          : (choice === correctChoice);
        if (!correct) { showMistake(() => showInitialQuiz()); return; }
        clearInlineBtns();
        if (choice === 'win') {
          announceWinner(side);
        } else if (choice === 'draw-player') {
          doPlayerDraw(() => showBankerDrawQuiz());
        } else {
          doBankerDraw(() => showAnnounceQuiz());
        }
      },

      quizBanker(choice, side) {
        const pp = pts(S.ph), bp = pts(S.bh);
        const needsDraw = bankerRule(bp, S.pThird);
        const cw = pp > bp ? 'player' : bp > pp ? 'banker' : 'tie';
        const correct = needsDraw
          ? (choice === 'draw-banker')
          : (choice === 'win' && side === cw);
        if (!correct) { showMistake(() => showBankerDrawQuiz()); return; }
        clearInlineBtns();
        if (choice === 'draw-banker') {
          doBankerDraw(() => showAnnounceQuiz());
        } else {
          announceWinner(side);
        }
      },

      quizAnnounce(side) {
        const pp = pts(S.ph), bp = pts(S.bh);
        const correct = pp > bp ? 'player' : bp > pp ? 'banker' : 'tie';
        if (side !== correct) { showMistake(() => showAnnounceQuiz()); return; }
        clearInlineBtns();
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

  // ---- BACCARAT PAY SIM ----
  baccaratPay: (() => {
    const COMM_CHIPS = [
      { key: '1억', val: 100_000_000, bg: '#c62828', fg: '#fff'    },
      { key: '1천', val:  10_000_000, bg: '#1565c0', fg: '#fff'    },
      { key: '1백', val:   1_000_000, bg: '#f9a825', fg: '#1a1a1a' },
      { key: '1십', val:     100_000, bg: '#212121', fg: '#fff'    },
      { key: '1만', val:      10_000, bg: '#2e7d32', fg: '#fff'    },
      { key: '5천', val:       5_000, bg: '#e91e8c', fg: '#fff'    },
    ];
    // Betting chips: min 10만원
    const BET_CHIPS = [COMM_CHIPS[3], COMM_CHIPS[2], COMM_CHIPS[1]]; // 1십, 1백, 1천

    let S = {};
    const $  = id => document.getElementById(id);

    function generateBetChips() {
      const numDenoms = Math.random() > 0.5 ? 1 : 2;
      const picked = [...BET_CHIPS].sort(() => Math.random() - 0.5).slice(0, numDenoms);
      const chips = {};
      picked.forEach(d => { chips[d.key] = 1 + Math.floor(Math.random() * 4); });
      return chips;
    }

    function chipTotal(chips) {
      return Object.entries(chips).reduce((sum, [key, cnt]) => {
        return sum + (COMM_CHIPS.find(c => c.key === key)?.val ?? 0) * cnt;
      }, 0);
    }

    function renderPositions() {
      S.bets.forEach((bet, i) => {
        const idx = i + 1;
        const bOval = $(`bpay-b-${idx}`);
        const bAmt  = $(`bpay-b-amt-${idx}`);
        if (!bOval || !bAmt) return;
        bOval.classList.add('has-bet');
        // Sort denominations high→low (high value on left, low on right like dealer spread)
        const sorted = Object.entries(bet.chips).sort((a, b) => {
          const va = COMM_CHIPS.find(c => c.key === a[0])?.val ?? 0;
          const vb = COMM_CHIPS.find(c => c.key === b[0])?.val ?? 0;
          return vb - va;
        });
        let discs = '';
        sorted.forEach(([key, cnt], groupIdx) => {
          const chip = COMM_CHIPS.find(c => c.key === key);
          for (let j = 0; j < cnt; j++) {
            const newGroup = j === 0 && groupIdx > 0;
            discs += `<div class="bpay-chip-disc${newGroup ? ' new-denom' : ''}" style="background:${chip.bg};color:${chip.fg}">${chip.key}</div>`;
          }
        });
        bAmt.innerHTML = `<div class="bpay-chip-spread">${discs}</div>`;
      });
    }

    function showCommTray() {
      const panel = $('bpay-comm-panel');
      if (!panel) return;
      panel.style.display = 'block';
      panel.innerHTML = `<div class="comm-tray">
        <div class="comm-tray-slots">
          ${COMM_CHIPS.map(c => c.key === '5천' ? `
            <div class="comm-slot comm-slot-5k">
              <div class="comm-slot-chip" style="background:${c.bg};color:${c.fg}">${c.key}</div>
              <div class="comm-5k-count" id="bpay-5k-display">0</div>
              <input type="hidden" id="bpay-ci-5천" value="0">
              <div class="comm-5k-btns">
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.add5k(5)">+5개</button>
                <button class="comm-5k-btn" onclick="Sims.baccaratPay.add5k(1)">+1개</button>
              </div>
            </div>` : `
            <div class="comm-slot">
              <div class="comm-slot-chip" style="background:${c.bg};color:${c.fg}">${c.key}</div>
              <input class="comm-slot-input" id="bpay-ci-${c.key}" type="number"
                min="0" max="20" placeholder="0" oninput="if(+this.value<0)this.value=''">
            </div>`).join('')}
          <div class="comm-pay-slot">
            <button class="comm-pay-btn" onclick="Sims.baccaratPay.submitComm()">PAY</button>
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
      const panel = $('bpay-comm-panel'); if (panel) panel.style.display = 'none';
      const pos = positions(); if (pos) pos.classList.remove('paying');
      for (let j = 1; j <= 3; j++) { const p = $(`bpay-pos-${j}`); if (p) p.classList.remove('active'); }
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
      if (idx < 0) {
        showNextHand();
        return;
      }
      S.commIdx = idx;
      const posNum = idx + 1;
      const pos = positions(); if (pos) pos.classList.add('paying');
      for (let j = 1; j <= 3; j++) {
        const p = $(`bpay-pos-${j}`); if (p) p.classList.toggle('active', j === posNum);
      }
      const comm = Math.floor(S.bets[idx].total * 0.05 / 5000) * 5000;
      S.commTarget = S.bets[idx].total - comm;
      showCommTray();
    }

    return {
      init() {
        S = { bets: [], commIdx: 2, rounds: 0, score: 0, commTarget: 0 };
      },

      deal() {
        const startOverlay = $('bpay-start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';
        const pos = positions(); if (pos) pos.classList.remove('paying');
        S.rounds++; S.commIdx = 2; S.commTarget = 0;
        $('bpay-rounds').textContent = S.rounds;
        for (let j = 1; j <= 3; j++) {
          const p = $(`bpay-pos-${j}`); if (p) p.classList.remove('active');
          const bOval = $(`bpay-b-${j}`); if (bOval) bOval.classList.remove('has-bet');
          const bAmt  = $(`bpay-b-amt-${j}`); if (bAmt) bAmt.innerHTML = '';
          const pAmt  = $(`bpay-p-amt-${j}`); if (pAmt) pAmt.innerHTML = '';
        }
        const panel = $('bpay-comm-panel'); if (panel) panel.style.display = 'none';
        S.bets = Array.from({length: 3}, () => {
          const chips = generateBetChips();
          return { chips, total: chipTotal(chips) };
        });
        renderPositions();
        setTimeout(() => startCommAt(2), 400);
      },

      add5k(n) {
        const inp  = $('bpay-ci-5천');
        const disp = $('bpay-5k-display');
        if (!inp || !disp) return;
        const next = (parseInt(inp.value) || 0) + n;
        inp.value = next;
        disp.textContent = next;
      },

      submitComm() {
        const entered = COMM_CHIPS.reduce((sum, c) => {
          return sum + c.val * (parseInt($(`bpay-ci-${c.key}`)?.value) || 0);
        }, 0);
        if (entered !== S.commTarget) {
          showMistake(() => {
            COMM_CHIPS.forEach(c => {
              const inp = $(`bpay-ci-${c.key}`);
              if (inp) inp.value = c.key === '5천' ? '0' : '';
            });
            const disp = $('bpay-5k-display'); if (disp) disp.textContent = '0';
          });
          return;
        }
        startCommAt(S.commIdx - 1);
      },
    };
  })(),

  // ---- ROULETTE ----
  roulette: (() => {
    const WHEEL    = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
    const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

    let S = {};
    const numColor = n => n === 0 ? 'green' : RED_NUMS.has(n) ? 'red' : 'black';

    return {
      init() {
        S = { bets: {}, spinning: false, rounds: 0 };
        document.querySelectorAll('.bet-spot').forEach(el => {
          el.addEventListener('click', () => this.toggleBet(el));
        });
      },

      toggleBet(el) {
        if (S.spinning) return;
        const k = el.dataset.bet;
        if (S.bets[k]) { delete S.bets[k]; el.classList.remove('active-bet'); }
        else           { S.bets[k] = 1;    el.classList.add('active-bet'); }
        document.getElementById('bet-list').textContent = Object.keys(S.bets).join(', ') || 'None';
      },

      clearBets() {
        S.bets = {};
        document.querySelectorAll('.bet-spot').forEach(el => el.classList.remove('active-bet'));
        document.getElementById('bet-list').textContent = 'None';
        document.getElementById('rou-msg').textContent = 'Bets cleared. Place new bets.';
        document.getElementById('rou-payouts').innerHTML = '';
        document.getElementById('rou-result').innerHTML = '';
      },

      spin() {
        if (S.spinning) return;
        S.spinning = true;
        S.rounds++;
        document.getElementById('rou-rounds').textContent = S.rounds;
        document.getElementById('rou-msg').textContent = 'No more bets! Ball is spinning...';
        document.getElementById('rou-actions').innerHTML = '';
        document.getElementById('rou-payouts').innerHTML = '';

        const num = Math.floor(Math.random() * 37);
        const idx = WHEEL.indexOf(num);
        const cur = parseFloat(document.getElementById('wheel-inner').style.transform.replace(/[^0-9.]/g, '')) || 0;
        const deg = cur + 1440 + idx * (360 / 37) + Math.random() * 90;

        const inner = document.getElementById('wheel-inner');
        inner.style.transition = 'transform 4.5s cubic-bezier(0.2, 0.6, 0.15, 1)';
        inner.style.transform  = `rotate(${deg}deg)`;

        setTimeout(() => { this.showResult(num); S.spinning = false; }, 4700);
      },

      showResult(num) {
        const color = numColor(num);
        const isOdd = num !== 0 && num % 2 !== 0;
        const isLow = num >= 1 && num <= 18;
        const icon  = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';

        document.getElementById('rou-result').innerHTML = `
          <div class="result-number ${color}">${num}</div>
          <div class="result-info">${icon} ${color.toUpperCase()} · ${num === 0 ? 'ZERO' : (isOdd ? 'ODD' : 'EVEN')} · ${num === 0 ? '—' : (isLow ? 'LOW (1-18)' : 'HIGH (19-36)')}</div>`;

        document.getElementById('rou-msg').textContent =
          `Result: ${num} ${color.toUpperCase()}${num !== 0 ? (isOdd ? ' ODD' : ' EVEN') : ''}`;

        const wins = this.calcPayouts(num);
        document.getElementById('rou-payouts').innerHTML = wins.length
          ? `<div class="payout-results"><h4>Winning Bets:</h4>${wins.map(w => `<div class="win-item">✓ ${w}</div>`).join('')}</div>`
          : `<div class="payout-results no-win">No active bets won this round.</div>`;

        document.getElementById('rou-actions').innerHTML = `
          <button class="btn btn-secondary" onclick="Sims.roulette.clearBets()">Clear Bets</button>
          <button class="btn btn-primary"   onclick="Sims.roulette.spin()">Spin Again</button>`;
      },

      calcPayouts(num) {
        const wins = [];
        const color = numColor(num);
        const isOdd = num !== 0 && num % 2 !== 0;
        const isLow = num >= 1 && num <= 18;
        const dozen = num === 0 ? 0 : Math.ceil(num / 12);
        const col   = num === 0 ? 0 : (num % 3 === 0 ? 3 : num % 3);

        for (const bet of Object.keys(S.bets)) {
          if (bet === String(num))       wins.push(`Straight Up ${num}: 35:1`);
          if (bet === 'red'   && color === 'red')             wins.push('Red: 1:1');
          if (bet === 'black' && color === 'black')           wins.push('Black: 1:1');
          if (bet === 'odd'   && isOdd)                       wins.push('Odd: 1:1');
          if (bet === 'even'  && !isOdd && num !== 0)         wins.push('Even: 1:1');
          if (bet === 'low'   && isLow)                       wins.push('Low (1-18): 1:1');
          if (bet === 'high'  && !isLow && num !== 0)         wins.push('High (19-36): 1:1');
          if (bet === `dozen${dozen}` && dozen > 0)           wins.push(`Dozen ${dozen}: 2:1`);
          if (bet === `col${col}`     && col > 0)             wins.push(`Column ${col}: 2:1`);
        }
        return wins;
      },
    };
  })(),
};

// ============================================================
//  ROULETTE LAYOUT BUILDERS
// ============================================================

function buildWheel() {
  const WHEEL    = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  return WHEEL.map((n, i) => {
    const cls = n === 0 ? 'g' : RED_NUMS.has(n) ? 'r' : 'b';
    const deg = i * (360 / 37);
    return `<div class="wheel-num wheel-num-${cls}" style="transform:rotate(${deg}deg) translateY(-105px)">${n}</div>`;
  }).join('');
}

function buildBettingTable() {
  const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  // Standard layout: 3 rows, col by col
  // Row 0 (top): 3,6,9,...,36   (n % 3 === 0, col3)
  // Row 1 (mid): 2,5,8,...,35   (n % 3 === 2, col2)
  // Row 2 (bot): 1,4,7,...,34   (n % 3 === 1, col1)
  const rows = [
    Array.from({length:12}, (_,i) => 3 + i*3),  // 3,6,...,36
    Array.from({length:12}, (_,i) => 2 + i*3),  // 2,5,...,35
    Array.from({length:12}, (_,i) => 1 + i*3),  // 1,4,...,34
  ];
  const colBets = ['col3','col2','col1'];

  let html = `<table class="roulette-grid"><tbody>`;
  rows.forEach((row, ri) => {
    html += `<tr>`;
    if (ri === 0) html += `<td rowspan="3" class="zero-cell"><div class="bet-spot green-num" data-bet="0">0</div></td>`;
    row.forEach(n => {
      const cls = RED_NUMS.has(n) ? 'red-num' : 'black-num';
      html += `<td><div class="bet-spot ${cls}" data-bet="${n}">${n}</div></td>`;
    });
    html += `<td><div class="bet-spot col-bet" data-bet="${colBets[ri]}">2:1</div></td>`;
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  html += `<div class="dozens-row">
    <div class="bet-spot outside" data-bet="dozen1">1st 12</div>
    <div class="bet-spot outside" data-bet="dozen2">2nd 12</div>
    <div class="bet-spot outside" data-bet="dozen3">3rd 12</div>
  </div>
  <div class="evens-row">
    <div class="bet-spot outside" data-bet="low">1-18</div>
    <div class="bet-spot outside" data-bet="even">Even</div>
    <div class="bet-spot outside red-bet" data-bet="red">●</div>
    <div class="bet-spot outside black-bet" data-bet="black">●</div>
    <div class="bet-spot outside" data-bet="odd">Odd</div>
    <div class="bet-spot outside" data-bet="high">19-36</div>
  </div>`;

  return html;
}

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => App.init());
