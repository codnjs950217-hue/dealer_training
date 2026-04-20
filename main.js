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
        <p class="hero-sub">Master the art of dealing with interactive video tutorials and hands-on simulations — designed to professional casino standards.</p>
        <div class="hero-actions">
          <button class="btn btn-primary"  onclick="App.navigate('blackjack','simulation')">Start Training</button>
          <button class="btn btn-outline"  onclick="App.navigate('baccarat','tutorial')">Watch Tutorial</button>
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
    </section>

    <section class="games-section">
      <div class="section-header">
        <h2>Choose Your Game</h2>
        <p>Select a game to begin your professional dealer training</p>
      </div>
      <div class="games-grid">
        ${Object.entries(GAMES).map(([k, g]) => `
          <div class="game-card" onclick="App.navigate('${k}')">
            <div class="game-card-icon">${g.icon}</div>
            <h3>${g.name}</h3>
            <p>${g.desc}</p>
            <div class="game-card-actions">
              <button class="btn btn-sm btn-tutorial" onclick="event.stopPropagation();App.navigate('${k}','tutorial')">▶ Tutorial</button>
              <button class="btn btn-sm btn-sim"      onclick="event.stopPropagation();App.navigate('${k}','simulation')">⚡ Simulate</button>
            </div>
          </div>`).join('')}
      </div>
    </section>

    <section class="features-section">
      <div class="features-grid">
        <div class="feature"><div class="feature-icon">📹</div><h4>Video Tutorials</h4><p>Step-by-step video guides covering all procedures and techniques</p></div>
        <div class="feature"><div class="feature-icon">🎮</div><h4>Interactive Simulation</h4><p>Practice dealing in a realistic environment without pressure</p></div>
        <div class="feature"><div class="feature-icon">📋</div><h4>Rule References</h4><p>Quick-access rule sheets and payout tables for all games</p></div>
        <div class="feature"><div class="feature-icon">🏆</div><h4>Industry Standards</h4><p>Trained to procedures used in real casinos worldwide</p></div>
      </div>
    </section>`,

  gameLanding: (game) => {
    const g = GAMES[game];
    return `
      <div class="sim-page">
        <div class="sim-header">
          <button class="back-btn" onclick="App.navigate('home')">← Home</button>
          <h2>${g.icon} ${g.name}</h2>
        </div>
        <p style="color:var(--text-dim);margin-bottom:2rem;max-width:560px">${g.desc}</p>
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <button class="btn btn-primary"   onclick="App.navigate('${game}','tutorial')">▶ Start Tutorial</button>
          <button class="btn btn-secondary" onclick="App.navigate('${game}','simulation')">⚡ Go to Simulation</button>
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
        <h2>♠ Blackjack Dealer Simulation</h2>
        <div class="sim-stats"><span>Rounds: <strong id="bj-rounds">0</strong></span><span>Score: <strong id="bj-score">0</strong></span></div>
      </div>
      <div class="blackjack-table">
        <div class="table-felt">
          <div class="dealer-area">
            <div class="area-label">Dealer</div>
            <div class="hand-display" id="bj-dealer-hand"></div>
            <div class="hand-value"   id="bj-dealer-value"></div>
          </div>
          <div class="divider-line"></div>
          <div class="player-area">
            <div class="area-label">Player</div>
            <div class="hand-display" id="bj-player-hand"></div>
            <div class="hand-value"   id="bj-player-value"></div>
          </div>
        </div>
      </div>
      <div class="sim-controls">
        <div class="message-board" id="bj-msg">Click "New Game" to start dealing.</div>
        <div class="action-buttons" id="bj-actions">
          <button class="btn btn-primary" onclick="Sims.blackjack.newGame()">New Game</button>
        </div>
      </div>
      <div class="hint-panel" id="bj-hint"></div>
    </div>`,

  baccaratSim: () => `
    <div class="sim-page baccarat-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('baccarat')">← Back</button>
        <h2>🃏 Baccarat Dealer Simulation</h2>
        <div class="sim-stats"><span>Rounds: <strong id="bac-rounds">0</strong></span><span>Hands: <strong id="bac-score">0</strong></span></div>
      </div>
      <div class="baccarat-table">
        <div class="table-felt">
          <div class="bac-side">
            <div class="area-label">Player</div>
            <div class="hand-display" id="bac-ph"></div>
            <div class="hand-value"   id="bac-pv"></div>
          </div>
          <div class="bac-center">
            <div class="shoe-indicator">SHOE</div>
            <div class="result-badge" id="bac-result"></div>
          </div>
          <div class="bac-side">
            <div class="area-label">Banker</div>
            <div class="hand-display" id="bac-bh"></div>
            <div class="hand-value"   id="bac-bv"></div>
          </div>
        </div>
      </div>
      <div class="sim-controls">
        <div class="message-board" id="bac-msg">Click "Deal" to begin.</div>
        <div class="action-buttons" id="bac-actions">
          <button class="btn btn-primary" onclick="Sims.baccarat.deal()">Deal</button>
        </div>
      </div>
      <div class="third-card-guide" id="bac-guide"></div>
    </div>`,

  rouletteSim: () => `
    <div class="sim-page roulette-sim">
      <div class="sim-header">
        <button class="back-btn" onclick="App.navigate('roulette')">← Back</button>
        <h2>🎡 Roulette Dealer Simulation</h2>
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
    let S = {};

    const $ = id => document.getElementById(id);
    const msg     = t => { $('bj-msg').textContent = t; $('bj-msg').style.color = ''; };
    const msgCol  = (t, c) => { $('bj-msg').textContent = t; $('bj-msg').style.color = c; };
    const actions = h => { $('bj-actions').innerHTML = h; };
    const hint    = t => { $('bj-hint').innerHTML = t ? `<div class="hint-content">💡 ${t}</div>` : ''; };
    const stats   = () => { $('bj-rounds').textContent = S.rounds; $('bj-score').textContent = S.score; };

    function bval(c) {
      if (c.rank === 'A') return 11;
      if (['J','Q','K','10'].includes(c.rank)) return 10;
      return +c.rank;
    }
    function total(hand) {
      let t = hand.reduce((s,c) => s + bval(c), 0);
      let a = hand.filter(c => c.rank === 'A').length;
      while (t > 21 && a--) t -= 10;
      return t;
    }
    const nat = h => h.length === 2 && total(h) === 21;

    function render(hideHole = true) {
      $('bj-player-hand').innerHTML = S.ph.map(c => cardHTML(c)).join('');
      $('bj-player-value').textContent = `Total: ${total(S.ph)}`;
      if (hideHole) {
        $('bj-dealer-hand').innerHTML = cardHTML(S.dh[0]) + cardHTML(S.dh[1], true);
        $('bj-dealer-value').textContent = `Showing: ${bval(S.dh[0])}`;
      } else {
        $('bj-dealer-hand').innerHTML = S.dh.map(c => cardHTML(c)).join('');
        $('bj-dealer-value').textContent = `Total: ${total(S.dh)}`;
      }
    }

    return {
      init() { S = { deck: createDeck(6), ph: [], dh: [], rounds: 0, score: 0 }; },

      newGame() {
        if (S.deck.length < 20) S.deck = createDeck(6);
        S.ph = [S.deck.pop(), S.deck.pop()];
        S.dh = [S.deck.pop(), S.deck.pop()];
        S.rounds++;
        render(true);
        stats();
        hint('');

        const pv = total(S.ph), ds = S.dh[0];

        if (nat(S.ph) && nat(S.dh)) { render(false); return this.end('Both have Blackjack — Push.', 'push'); }
        if (nat(S.dh)) {
          msg(`Dealer shows ${ds.rank}. Check hole card for potential Natural...`);
          actions(`<button class="btn btn-primary" onclick="Sims.blackjack.peekNatural()">Peek Hole Card</button>`);
          return;
        }
        if (nat(S.ph)) {
          if (ds.rank === 'A' || ['10','J','Q','K'].includes(ds.rank)) {
            msg(`Player Blackjack! Dealer shows ${ds.rank} — peek first.`);
            actions(`<button class="btn btn-primary" onclick="Sims.blackjack.peekForPlayer()">Peek Hole Card</button>`);
          } else {
            render(false);
            S.score++;
            this.end('Player Blackjack! Pay 3:2.', 'player');
          }
          return;
        }

        msg(`Dealer shows ${ds.rank}. Player total: ${pv}. Player action?`);
        actions(`
          <button class="btn btn-secondary" onclick="Sims.blackjack.hit()">Player Hits</button>
          <button class="btn btn-secondary" onclick="Sims.blackjack.stand()">Player Stands</button>`);
        if (ds.rank === 'A') hint('Dealer shows Ace. Offer insurance before proceeding.');
        else if (bval(ds) >= 7) hint(`Dealer shows ${bval(ds)} — a strong upcard. Player will likely hit toward 17+.`);
        else hint(`Dealer shows ${bval(ds)} — a bust card. Player may stand on 12+ and wait for dealer to bust.`);
      },

      peekNatural() {
        render(false);
        this.end('Dealer Blackjack! Collect all bets (Insurance wins 2:1).', 'dealer');
      },
      peekForPlayer() {
        render(false);
        if (nat(S.dh)) { this.end('Both Blackjack — Push.', 'push'); }
        else { S.score++; this.end('No dealer Blackjack. Pay Player Blackjack 3:2.', 'player'); }
      },

      hit() {
        S.ph.push(S.deck.pop());
        render(true);
        const pv = total(S.ph);
        if (pv > 21) { hint('Player busts! Collect the bet.'); return this.end(`Player busts with ${pv}. Dealer wins.`, 'dealer'); }
        if (pv === 21) { hint('21 — stand automatically.'); return this.stand(); }
        msg(`Player total: ${pv}. Continue?`);
        actions(`
          <button class="btn btn-secondary" onclick="Sims.blackjack.hit()">Player Hits</button>
          <button class="btn btn-secondary" onclick="Sims.blackjack.stand()">Player Stands</button>`);
      },

      stand() {
        msg('Player stands. Reveal dealer hole card and play dealer hand.');
        actions(`<button class="btn btn-primary" onclick="Sims.blackjack.reveal()">Reveal Hole Card</button>`);
      },

      reveal() {
        render(false);
        const dv = total(S.dh);
        if (dv < 17) {
          msg(`Dealer total: ${dv}. Dealer must hit (rule: hit on 16 or less).`);
          hint(`Dealer has ${dv} — hit required.`);
          actions(`<button class="btn btn-warning" onclick="Sims.blackjack.dealerHit()">Dealer Hits (Required)</button>`);
        } else { this.dealerStand(); }
      },

      dealerHit() {
        S.dh.push(S.deck.pop());
        render(false);
        const dv = total(S.dh);
        if (dv > 21) { S.score++; stats(); hint('Dealer busts! Pay all remaining players.'); return this.end(`Dealer busts with ${dv}. Player wins!`, 'player'); }
        if (dv < 17) {
          msg(`Dealer total: ${dv}. Must hit again.`);
          hint(`Dealer has ${dv} — must continue.`);
          actions(`<button class="btn btn-warning" onclick="Sims.blackjack.dealerHit()">Dealer Hits (Required)</button>`);
        } else { this.dealerStand(); }
      },

      dealerStand() {
        const dv = total(S.dh), pv = total(S.ph);
        msg(`Dealer stands at ${dv}. Compare hands: Player ${pv} vs Dealer ${dv}.`);
        hint(`Dealer stands on ${dv}. Now compare with player hand.`);
        actions(`<button class="btn btn-primary" onclick="Sims.blackjack.compare()">Compare & Settle</button>`);
      },

      compare() {
        const dv = total(S.dh), pv = total(S.ph);
        if      (pv > dv) { S.score++; this.end(`Player ${pv} beats Dealer ${dv}. Pay player 1:1.`, 'player'); }
        else if (dv > pv) { this.end(`Dealer ${dv} beats Player ${pv}. Collect player bet.`, 'dealer'); }
        else               { this.end(`Push — ${pv} ties ${dv}. Return player bet.`, 'push'); }
        stats();
      },

      end(text, who) {
        const c = who === 'player' ? '#4ecdc4' : who === 'dealer' ? '#ff6b6b' : '#c9a84c';
        msgCol(text, c);
        setTimeout(() => { if ($('bj-msg')) $('bj-msg').style.color = ''; }, 2200);
        hint('');
        actions(`<button class="btn btn-primary" onclick="Sims.blackjack.newGame()">New Game</button>`);
      },
    };
  })(),

  // ---- BACCARAT ----
  baccarat: (() => {
    let S = {};

    const $ = id => document.getElementById(id);
    const msg     = t => { $('bac-msg').textContent = t; };
    const actions = h => { $('bac-actions').innerHTML = h; };
    const guide   = h => { $('bac-guide').innerHTML = h; };
    const result  = (t, cls) => { const el = $('bac-result'); el.textContent = t; el.className = 'result-badge ' + (cls||''); };

    function bval(c) {
      if (['10','J','Q','K'].includes(c.rank)) return 0;
      if (c.rank === 'A') return 1;
      return +c.rank;
    }
    const pts = h => h.reduce((s,c) => s + bval(c), 0) % 10;

    function render(showAll) {
      $('bac-ph').innerHTML = S.ph.map((c,i) => cardHTML(c, i >= 2 && !showAll)).join('');
      $('bac-bh').innerHTML = S.bh.map((c,i) => cardHTML(c, i >= 2 && !showAll)).join('');
      $('bac-pv').textContent = showAll ? `Points: ${pts(S.ph)}` : '';
      $('bac-bv').textContent = showAll ? `Points: ${pts(S.bh)}` : '';
    }
    function stats() { $('bac-rounds').textContent = S.rounds; $('bac-score').textContent = S.score; }

    function bankerDraw(bt, pThird) {
      if (pThird === null) return bt <= 5;
      const v = bval(pThird);
      if (bt <= 2) return true;
      if (bt === 3) return v !== 8;
      if (bt === 4) return v >= 2 && v <= 7;
      if (bt === 5) return v >= 4 && v <= 7;
      if (bt === 6) return v === 6 || v === 7;
      return false;
    }

    return {
      init() { S = { deck: createDeck(8), ph: [], bh: [], pThird: null, rounds: 0, score: 0 }; },

      deal() {
        if (S.deck.length < 20) S.deck = createDeck(8);
        S.ph = [S.deck.pop(), S.deck.pop()];
        S.bh = [S.deck.pop(), S.deck.pop()];
        S.pThird = null;
        S.rounds++;
        result('', '');
        guide('');
        render(false);
        stats();
        msg('Cards dealt face down. Reveal to announce points.');
        actions(`<button class="btn btn-primary" onclick="Sims.baccarat.reveal()">Reveal Cards</button>`);
      },

      reveal() {
        render(true);
        const pp = pts(S.ph), bp = pts(S.bh);

        if (pp >= 8 || bp >= 8) {
          guide(`<div class="guide-box natural">✓ Natural ${Math.max(pp,bp)}: No third cards drawn. Announce the winner.</div>`);
          msg(`Natural! Player: ${pp} — Banker: ${bp}. No more cards.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.announce()">Announce Winner</button>`);
          return;
        }

        let g = `<div class="guide-box">Point Analysis — Player: <strong>${pp}</strong> · Banker: <strong>${bp}</strong></div>`;
        if (pp <= 5) {
          g += `<div class="guide-box draw">Player total ${pp} → Player draws a third card</div>`;
          msg(`Player total: ${pp} (must draw). Banker total: ${bp}. Deal Player third card.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.playerThird()">Deal Player Third Card</button>`);
        } else {
          g += `<div class="guide-box stand">Player total ${pp} → Player stands</div>`;
          msg(`Player stands at ${pp}. Check Banker rule.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.checkBanker()">Check Banker Rule</button>`);
        }
        guide(g);
      },

      playerThird() {
        const card = S.deck.pop();
        S.ph.push(card);
        S.pThird = card;
        render(true);
        const pp = pts(S.ph), bp = pts(S.bh), v = bval(card);
        const draws = bankerDraw(bp, card);

        let g = `<div class="guide-box">Player drew: <strong>${card.rank}${card.suit}</strong> (value: ${v}) → New Player total: ${pp}</div>`;
        if (draws) {
          g += `<div class="guide-box draw">Banker total ${bp}, Player's third ${v} → Banker draws</div>`;
          msg(`Player drew ${card.rank} (${v}). Banker must draw.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.bankerThird()">Deal Banker Third Card</button>`);
        } else {
          g += `<div class="guide-box stand">Banker total ${bp}, Player's third ${v} → Banker stands</div>`;
          msg(`Player drew ${card.rank}. Banker stands at ${bp}.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.announce()">Announce Winner</button>`);
        }
        guide(g);
      },

      checkBanker() {
        const bp = pts(S.bh);
        const draws = bankerDraw(bp, null);
        let g = `<div class="guide-box">Banker total: <strong>${bp}</strong> (Player stood)</div>`;
        if (draws) {
          g += `<div class="guide-box draw">Banker total ${bp} → Banker draws</div>`;
          msg(`Banker total ${bp}: must draw.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.bankerThird()">Deal Banker Third Card</button>`);
        } else {
          g += `<div class="guide-box stand">Banker total ${bp} → Banker stands</div>`;
          msg(`Banker stands at ${bp}.`);
          actions(`<button class="btn btn-primary" onclick="Sims.baccarat.announce()">Announce Winner</button>`);
        }
        guide(g);
      },

      bankerThird() {
        const card = S.deck.pop();
        S.bh.push(card);
        render(true);
        const pp = pts(S.ph), bp = pts(S.bh);
        let g = `<div class="guide-box">Banker drew: <strong>${card.rank}${card.suit}</strong></div>`;
        g += `<div class="guide-box">Final — Player: <strong>${pp}</strong> · Banker: <strong>${bp}</strong></div>`;
        guide(g);
        msg(`Banker drew ${card.rank}. Final: Player ${pp} vs Banker ${bp}.`);
        actions(`<button class="btn btn-primary" onclick="Sims.baccarat.announce()">Announce Winner</button>`);
      },

      announce() {
        const pp = pts(S.ph), bp = pts(S.bh);
        let who, res, cls, pay;
        if      (pp > bp) { who = 'PLAYER'; res = `Player wins! ${pp} over ${bp}`;  cls = 'player-win'; pay = 'Pay Player bets 1:1. Collect Banker bets.'; }
        else if (bp > pp) { who = 'BANKER'; res = `Banker wins! ${bp} over ${pp}`;  cls = 'banker-win'; pay = 'Pay Banker bets 1:1 (collect 5% commission). Collect Player bets.'; }
        else              { who = 'TIE';    res = `Tie! Both ${pp}`;                 cls = 'tie-win';    pay = 'Pay Tie 8:1. Player and Banker bets push.'; }
        result(who, cls);
        msg(res);
        guide(`<div class="guide-box payout">💰 ${pay}</div>`);
        actions(`<button class="btn btn-primary" onclick="Sims.baccarat.deal()">Next Hand</button>`);
        S.score++;
        stats();
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
