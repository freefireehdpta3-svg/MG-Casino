// Lógica de juego segura en el servidor (Real-Math con control de RTP)

// Función para calcular combinaciones matemáticas (n sobre k)
function choose(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
}

// 1. MINES MULTIPLIER CALCULATOR
function getMinesMultiplier(minesCount, revealedCount) {
  if (revealedCount === 0) return 1.0;
  const totalCells = 25;
  const gemsCount = totalCells - minesCount;
  
  if (revealedCount > gemsCount) return 0;

  // Fórmula matemática de casino: houseEdge * C(25, R) / C(25 - M, R)
  const houseEdge = 0.98; // 2% de ventaja de la casa
  const totalCombinations = choose(totalCells, revealedCount);
  const winCombinations = choose(gemsCount, revealedCount);
  
  if (winCombinations === 0) return 0;
  
  const mult = houseEdge * (totalCombinations / winCombinations);
  return parseFloat(mult.toFixed(2));
}

// 2. SLOTS SPIN GENERATOR
// Símbolos y sus multiplicadores por coincidencia (3, 4, o 5 en línea de pago)
const SLOT_SYMBOLS = [
  { id: 'cherry', name: 'Cereza', weight: 40, payouts: { 3: 2, 4: 5, 5: 15 } },
  { id: 'lemon', name: 'Limón', weight: 35, payouts: { 3: 3, 4: 8, 5: 20 } },
  { id: 'orange', name: 'Naranja', weight: 30, payouts: { 3: 4, 4: 10, 5: 25 } },
  { id: 'plum', name: 'Ciruela', weight: 25, payouts: { 3: 5, 4: 15, 5: 40 } },
  { id: 'grape', name: 'Uva', weight: 20, payouts: { 3: 8, 4: 20, 5: 60 } },
  { id: 'melon', name: 'Sandía', weight: 15, payouts: { 3: 12, 4: 30, 5: 100 } },
  { id: 'bell', name: 'Campana', weight: 10, payouts: { 3: 20, 4: 50, 5: 200 } },
  { id: 'star', name: 'Estrella', weight: 5, payouts: { 3: 50, 4: 150, 5: 500 } },
  { id: 'seven', name: 'Siete', weight: 3, payouts: { 3: 100, 4: 300, 5: 1000 } }
];

// Líneas de pago predefinidas para un rodillo de 3x5
const SLOT_PAYLINES = [
  [1, 1, 1, 1, 1], // Línea horizontal media (Fila 1)
  [0, 0, 0, 0, 0], // Línea horizontal superior (Fila 0)
  [2, 2, 2, 2, 2], // Línea horizontal inferior (Fila 2)
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // V invertida
  [0, 0, 1, 2, 2], // Diagonal descendiente quebrada
  [2, 2, 1, 0, 0], // Diagonal ascendiente quebrada
  [1, 0, 1, 2, 1], // Zig-zag medio-arriba-abajo
  [1, 2, 1, 0, 1]  // Zig-zag medio-abajo-arriba
];

function generateRandomSlotGrid() {
  const grid = [];
  const totalWeight = SLOT_SYMBOLS.reduce((sum, sym) => sum + sym.weight, 0);

  for (let row = 0; row < 3; row++) {
    const rowSymbols = [];
    for (let col = 0; col < 5; col++) {
      let rand = Math.random() * totalWeight;
      let selected = SLOT_SYMBOLS[0].id;
      for (const sym of SLOT_SYMBOLS) {
        if (rand < sym.weight) {
          selected = sym.id;
          break;
        }
        rand -= sym.weight;
      }
      rowSymbols.push(selected);
    }
    grid.push(rowSymbols);
  }
  return grid;
}

function checkSlotWins(grid, betPerLine) {
  let totalWin = 0;
  const winningLines = [];

  SLOT_PAYLINES.forEach((line, lineIdx) => {
    // Obtener los símbolos en la línea de pago actual
    const lineSymbols = [];
    for (let col = 0; col < 5; col++) {
      const row = line[col];
      lineSymbols.push(grid[row][col]);
    }

    // Contar cuántos símbolos iguales consecutivos hay desde la izquierda
    const firstSymbol = lineSymbols[0];
    let matchCount = 1;
    for (let i = 1; i < 5; i++) {
      if (lineSymbols[i] === firstSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const symbolInfo = SLOT_SYMBOLS.find(s => s.id === firstSymbol);
      const multiplier = symbolInfo.payouts[matchCount] || 0;
      const winAmount = multiplier * betPerLine;
      if (winAmount > 0) {
        totalWin += winAmount;
        winningLines.push({
          lineIndex: lineIdx,
          symbol: firstSymbol,
          matchCount,
          winAmount
        });
      }
    }
  });

  return { totalWin, winningLines };
}

// 3. ROULETTE RESULTS AND PAYOUTS
// Números de la ruleta europea (0 a 36) y sus colores
const ROULETTE_NUMBERS = {
  0: 'green',
  1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black',
  7: 'red', 8: 'black', 9: 'red', 10: 'black', 11: 'black', 12: 'red',
  13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
  19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black',
  25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
  31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

function calculateRouletteWin(rolledNumber, bet) {
  // bet = { type: 'red'|'black'|'number'|'even'|'odd'|'dozen1'|'dozen2'|'dozen3', value?: number, amount: number }
  const rolledColor = ROULETTE_NUMBERS[rolledNumber];
  
  if (bet.type === 'number') {
    if (parseInt(bet.value) === rolledNumber) {
      return bet.amount * 35; // Paga 35 a 1 (retorna 36 veces la apuesta en total)
    }
  } else if (bet.type === 'red' && rolledColor === 'red') {
    return bet.amount * 1; // Paga 1 a 1
  } else if (bet.type === 'black' && rolledColor === 'black') {
    return bet.amount * 1;
  } else if (bet.type === 'even' && rolledNumber !== 0 && rolledNumber % 2 === 0) {
    return bet.amount * 1;
  } else if (bet.type === 'odd' && rolledNumber !== 0 && rolledNumber % 2 !== 0) {
    return bet.amount * 1;
  } else if (bet.type === 'dozen1' && rolledNumber >= 1 && rolledNumber <= 12) {
    return bet.amount * 2; // Paga 2 a 1
  } else if (bet.type === 'dozen2' && rolledNumber >= 13 && rolledNumber <= 24) {
    return bet.amount * 2;
  } else if (bet.type === 'dozen3' && rolledNumber >= 25 && rolledNumber <= 36) {
    return bet.amount * 2;
  }
  
  return 0; // Perdido
}

// 4. CRASH GAME MULTIPLIER DETERMINATION
function generateCrashPoint(rtpSetting) {
  const rtp = parseFloat(rtpSetting) / 100;
  
  // Ventaja matemática para Crash
  // Si la probabilidad aleatoria cae en el margen de la casa, se estrella instantáneamente a 1.00x
  const houseEdge = 1.00 - rtp;
  if (Math.random() < houseEdge) {
    return 1.00;
  }
  
  // Curva estándar de multiplicador de Crash: 0.98 / (1 - U)
  const rand = Math.random();
  const crashPoint = 0.98 / (1 - rand);
  
  return parseFloat(Math.max(1.01, crashPoint).toFixed(2));
}

// 5. BLACKJACK GAME LOGIC
function getCardValue(card) {
  const rank = card.substring(0, card.length - 1);
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

function calculateHandScore(hand) {
  let score = hand.reduce((sum, card) => sum + getCardValue(card), 0);
  let aces = hand.filter(c => c.startsWith('A')).length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function createDeck() {
  const suits = ['H', 'D', 'C', 'S']; // Hearts (Corazones), Diamonds (Diamantes), Clubs (Tréboles), Spades (Picas)
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push(r + s);
    }
  }
  // Mezclar Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 6. PLINKO GAME LOGIC
const PLINKO_MULTIPLIERS = {
  8: [5.6, 1.6, 1.1, 0.6, 0.3, 0.6, 1.1, 1.6, 5.6],
  12: [33, 11, 4, 1.5, 0.8, 0.4, 0.2, 0.4, 0.8, 1.5, 4, 11, 33],
  16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
};

function getPlinkoResult(rows, rtpSetting) {
  const rtpVal = parseFloat(rtpSetting || 96);
  const availableRows = [8, 12, 16];
  const n = availableRows.includes(rows) ? rows : 12;
  const multipliers = PLINKO_MULTIPLIERS[n];

  let path = [];
  let rightBounces = 0;
  for (let i = 0; i < n; i++) {
    const step = Math.random() < 0.5 ? 0 : 1;
    path.push(step);
    rightBounces += step;
  }

  let multiplier = multipliers[rightBounces];

  // Control de RTP: Si el multiplicador es alto, aplicamos probabilidad de re-giro
  if (multiplier > 2.0 && Math.random() * 100 > rtpVal) {
    let attempts = 0;
    while (multiplier > 2.0 && attempts < 10) {
      path = [];
      rightBounces = 0;
      for (let i = 0; i < n; i++) {
        const step = Math.random() < 0.5 ? 0 : 1;
        path.push(step);
        rightBounces += step;
      }
      multiplier = multipliers[rightBounces];
      attempts++;
    }
  }

  return {
    path,
    bucket: rightBounces,
    multiplier
  };
}

// 7. DICE GAME LOGIC
function calculateDiceWin(target, mode, roll) {
  if (mode === 'over') {
    return roll >= target;
  } else {
    return roll <= target;
  }
}

function getDiceMultiplier(target, mode, rtpSetting) {
  const rtpVal = parseFloat(rtpSetting || 96);
  const houseEdgeMultiplier = rtpVal / 100;
  if (mode === 'over') {
    const winChance = 100 - target;
    if (winChance <= 0) return 0;
    return parseFloat((houseEdgeMultiplier * (100 / winChance)).toFixed(4));
  } else {
    const winChance = target;
    if (winChance <= 0) return 0;
    return parseFloat((houseEdgeMultiplier * (100 / winChance)).toFixed(4));
  }
}

// 8. JOKER'S JEWELS GAME LOGIC
const JOKER_SYMBOLS = [
  { id: 'gem_cyan', name: '💎', weight: 45, linePayouts: { 3: 4, 4: 10, 5: 40 } },
  { id: 'gem_blue', name: '🔵', weight: 40, linePayouts: { 3: 4, 4: 10, 5: 40 } },
  { id: 'gem_red', name: '🔴', weight: 35, linePayouts: { 3: 4, 4: 10, 5: 40 } },
  { id: 'clubs', name: '🪄', weight: 25, linePayouts: { 3: 10, 4: 40, 5: 200 } },
  { id: 'shoes', name: '🥿', weight: 20, linePayouts: { 3: 10, 4: 40, 5: 200 } },
  { id: 'lute', name: '🪕', weight: 15, linePayouts: { 3: 10, 4: 40, 5: 200 } },
  { id: 'crown', name: '👑', weight: 8, scatterPayouts: { 3: 10, 4: 50, 5: 250 } },
  { id: 'joker', name: '🃏', weight: 4, scatterPayouts: { 3: 20, 4: 200, 5: 1000 } }
];

const JOKER_PAYLINES = [
  [1, 1, 1, 1, 1], // Fila media
  [0, 0, 0, 0, 0], // Fila superior
  [2, 2, 2, 2, 2], // Fila inferior
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2]  // V invertida
];

function generateJokerGrid() {
  const grid = [];
  const totalWeight = JOKER_SYMBOLS.reduce((sum, sym) => sum + sym.weight, 0);

  for (let row = 0; row < 3; row++) {
    const rowSymbols = [];
    for (let col = 0; col < 5; col++) {
      let rand = Math.random() * totalWeight;
      let selected = JOKER_SYMBOLS[0].id;
      for (const sym of JOKER_SYMBOLS) {
        if (rand < sym.weight) {
          selected = sym.id;
          break;
        }
        rand -= sym.weight;
      }
      rowSymbols.push(selected);
    }
    grid.push(rowSymbols);
  }
  return grid;
}

function checkJokerWins(grid, totalBet) {
  const betPerLine = totalBet / 5;
  let totalWin = 0;
  const winningLines = [];
  const scatters = { joker: 0, crown: 0 };

  // 1. Contar Scatters (en cualquier posición de la cuadrícula)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const symId = grid[row][col];
      if (symId === 'joker') scatters.joker++;
      if (symId === 'crown') scatters.crown++;
    }
  }

  // Payout de Scatters (se basan en la apuesta TOTAL)
  let scatterWins = [];
  ['joker', 'crown'].forEach(id => {
    const count = scatters[id];
    if (count >= 3) {
      const symInfo = JOKER_SYMBOLS.find(s => s.id === id);
      const mult = symInfo.scatterPayouts[count] || 0;
      const winAmount = mult * totalBet;
      if (winAmount > 0) {
        totalWin += winAmount;
        scatterWins.push({
          symbol: id,
          count,
          winAmount
        });
      }
    }
  });

  // 2. Verificar Líneas de Pago (para los demás símbolos)
  JOKER_PAYLINES.forEach((line, lineIdx) => {
    const lineSymbols = [];
    for (let col = 0; col < 5; col++) {
      const row = line[col];
      lineSymbols.push(grid[row][col]);
    }

    const firstSymbol = lineSymbols[0];
    
    // Scatters no pagan por línea
    if (firstSymbol === 'joker' || firstSymbol === 'crown') return;

    let matchCount = 1;
    for (let i = 1; i < 5; i++) {
      if (lineSymbols[i] === firstSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const symbolInfo = JOKER_SYMBOLS.find(s => s.id === firstSymbol);
      const multiplier = symbolInfo.linePayouts[matchCount] || 0;
      const winAmount = multiplier * betPerLine;
      if (winAmount > 0) {
        totalWin += winAmount;
        winningLines.push({
          lineIndex: lineIdx,
          symbol: firstSymbol,
          matchCount,
          winAmount
        });
      }
    }
  });

  return { totalWin, winningLines, scatterWins };
}

// ==========================================
// LÓGICA DE TRAGAMONEDAS PERSONALIZADOS REALES
// ==========================================

const CUSTOM_SLOTS_SYMBOLS = {
  gates_mg: [
    { id: 'gem_green', weight: 30, payout: { 8: 0.25, 10: 0.5, 12: 2.0 } },
    { id: 'gem_blue', weight: 28, payout: { 8: 0.4, 10: 0.75, 12: 4.0 } },
    { id: 'gem_purple', weight: 26, payout: { 8: 0.5, 10: 1.0, 12: 5.0 } },
    { id: 'gem_red', weight: 24, payout: { 8: 0.8, 10: 1.2, 12: 8.0 } },
    { id: 'gem_yellow', weight: 22, payout: { 8: 1.0, 10: 1.5, 12: 10.0 } },
    { id: 'ring', weight: 15, payout: { 8: 1.5, 10: 5.0, 12: 15.0 } },
    { id: 'cup', weight: 12, payout: { 8: 2.0, 10: 10.0, 12: 25.0 } },
    { id: 'hourglass', weight: 10, payout: { 8: 2.5, 10: 25.0, 12: 50.0 } },
    { id: 'crown', weight: 5, payout: { 8: 10.0, 10: 50.0, 12: 100.0 } }
  ],
  masks_fire: [
    { id: 'cherry', weight: 30, linePayout: { 3: 0.5, 4: 1.0, 5: 3.0 } },
    { id: 'bar', weight: 25, linePayout: { 3: 0.5, 4: 1.0, 5: 3.0 } },
    { id: 'bell', weight: 20, linePayout: { 3: 1.0, 4: 2.0, 5: 7.5 } },
    { id: 'single_7', weight: 15, linePayout: { 3: 2.0, 4: 7.5, 5: 37.5 } },
    { id: 'double_7', weight: 10, linePayout: { 3: 2.5, 4: 15.0, 5: 75.0 } },
    { id: 'triple_7', weight: 6, linePayout: { 3: 5.0, 4: 30.0, 5: 150.0 } },
    { id: 'mask', weight: 12 },
    { id: 'drum', weight: 8 }
  ],
  monopoly_king: [
    { id: 'shoe', weight: 30, linePayout: { 3: 0.2, 4: 1.0, 5: 2.5 } },
    { id: 'thimble', weight: 25, linePayout: { 3: 0.3, 4: 1.5, 5: 4.0 } },
    { id: 'ship', weight: 20, linePayout: { 3: 0.5, 4: 2.0, 5: 6.0 } },
    { id: 'dog', weight: 18, linePayout: { 3: 1.0, 4: 3.0, 5: 10.0 } },
    { id: 'car', weight: 14, linePayout: { 3: 1.5, 4: 5.0, 5: 15.0 } },
    { id: 'hat', weight: 10, linePayout: { 3: 2.5, 4: 10.0, 5: 30.0 } },
    { id: 'monopoly_guy', weight: 6, linePayout: { 3: 10.0, 4: 40.0, 5: 100.0 } },
    { id: 'community_chest', weight: 12 }
  ],
  dragon_ascension: [
    { id: 'card_J', weight: 25, linePayout: { 3: 0.2, 4: 0.5, 5: 2.0 } },
    { id: 'card_Q', weight: 25, linePayout: { 3: 0.2, 4: 0.5, 5: 2.0 } },
    { id: 'card_K', weight: 22, linePayout: { 3: 0.3, 4: 1.0, 5: 3.0 } },
    { id: 'card_A', weight: 20, linePayout: { 3: 0.3, 4: 1.0, 5: 3.0 } },
    { id: 'emerald', weight: 15, linePayout: { 3: 0.5, 4: 2.0, 5: 6.0 } },
    { id: 'amethyst', weight: 12, linePayout: { 3: 0.8, 4: 4.0, 5: 12.0 } },
    { id: 'ruby', weight: 8, linePayout: { 3: 1.0, 4: 6.0, 5: 20.0 } },
    { id: 'gold_chest', weight: 5, linePayout: { 3: 5.0, 4: 20.0, 5: 50.0 } },
    { id: 'egg_red', weight: 8 },
    { id: 'egg_purple', weight: 8 },
    { id: 'egg_green', weight: 8 }
  ],
  fishin_pots: [
    { id: 'card_Q', weight: 25, linePayout: { 3: 0.2, 4: 0.5, 5: 2.0 } },
    { id: 'card_K', weight: 22, linePayout: { 3: 0.2, 4: 0.5, 5: 2.0 } },
    { id: 'card_A', weight: 20, linePayout: { 3: 0.3, 4: 1.0, 5: 3.0 } },
    { id: 'float', weight: 18, linePayout: { 3: 0.5, 4: 2.0, 5: 6.0 } },
    { id: 'tackle_box', weight: 14, linePayout: { 3: 0.8, 4: 4.0, 5: 12.0 } },
    { id: 'hat', weight: 10, linePayout: { 3: 1.0, 4: 6.0, 5: 20.0 } },
    { id: 'pot_gold', weight: 8 },
    { id: 'fisherman', weight: 6 },
    { id: 'fish', weight: 15 }
  ]
};

const STANDARD_PAYLINES = [
  [1, 1, 1, 1, 1], // Fila horizontal media (Fila 1)
  [0, 0, 0, 0, 0], // Fila horizontal superior (Fila 0)
  [2, 2, 2, 2, 2], // Fila horizontal inferior (Fila 2)
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // V invertida
  [0, 0, 1, 2, 2], // Diagonal descendiente quebrada
  [2, 2, 1, 0, 0], // Diagonal ascendiente quebrada
  [1, 0, 1, 2, 1], // Zig-zag medio-arriba-abajo
  [1, 2, 1, 0, 1]  // Zig-zag medio-abajo-arriba
];

function generateCustomSlotGrid(gameId) {
  const symbols = CUSTOM_SLOTS_SYMBOLS[gameId];
  if (!symbols) return [];

  const totalWeight = symbols.reduce((sum, sym) => sum + sym.weight, 0);

  // Gates of MGCASINO tiene una grilla de 6 columnas y 5 filas
  if (gameId === 'gates_mg') {
    const grid = [];
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 6; c++) {
        // 8% de probabilidad de colocar un multiplicador orbe
        if (Math.random() < 0.08) {
          const multVal = [2, 3, 5, 8, 10, 15, 20, 25, 50, 100, 250, 500][Math.floor(Math.random() * 12)];
          row.push(`mult_${multVal}`);
        } else {
          let rand = Math.random() * totalWeight;
          let selected = symbols[0].id;
          for (const sym of symbols) {
            if (rand < sym.weight) {
              selected = sym.id;
              break;
            }
            rand -= sym.weight;
          }
          row.push(selected);
        }
      }
      grid.push(row);
    }
    return grid;
  }

  // Los demás juegos tienen grilla clásica de 5 columnas y 3 filas
  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      // Reglas especiales de símbolos por columna
      if (gameId === 'fishin_pots' && c === 4) {
        // Fisherman solo aparece en la columna 5
        if (Math.random() < 0.12) {
          row.push('fisherman');
          continue;
        }
      }

      let rand = Math.random() * totalWeight;
      let selected = symbols[0].id;
      for (const sym of symbols) {
        if (rand < sym.weight) {
          selected = sym.id;
          break;
        }
        rand -= sym.weight;
      }

      // Si es pez en Fishin' Pots, añadirle valor de efectivo
      if (gameId === 'fishin_pots' && selected === 'fish') {
        const fishVal = [1, 2, 5, 8, 10, 15, 20, 50][Math.floor(Math.random() * 8)];
        row.push(`fish_${fishVal}`);
      } else {
        row.push(selected);
      }
    }
    grid.push(row);
  }
  return grid;
}

function checkCustomSlotWins(gameId, grid, totalBet) {
  if (gameId === 'gates_mg') {
    return checkGatesMgWins(grid, totalBet);
  }

  const betPerLine = totalBet / 9; // 9 líneas fijas
  let totalWin = 0;
  const winningLines = [];
  let scatterWins = [];

  const symbolsList = CUSTOM_SLOTS_SYMBOLS[gameId];

  // 1. CHEQUEO DE LÍNEAS DE PAGO (Común para slots 5x3)
  STANDARD_PAYLINES.forEach((line, lineIdx) => {
    const lineSymbols = [];
    for (let c = 0; c < 5; c++) {
      const r = line[c];
      lineSymbols.push(grid[r][c]);
    }

    let firstSymbol = lineSymbols[0];
    
    // Tratamiento de comodines (WILD)
    let isWildStart = false;
    let targetSymbol = firstSymbol;

    // Buscar comodín inicial
    const isWild = (sym) => {
      if (!sym) return false;
      return (gameId === 'monopoly_king' && sym === 'monopoly_guy') ||
             (gameId === 'dragon_ascension' && sym === 'gold_chest');
    };

    if (isWild(firstSymbol)) {
      isWildStart = true;
      // Encontrar el primer símbolo no comodín en la línea para definir el target
      for (let i = 1; i < 5; i++) {
        if (!isWild(lineSymbols[i])) {
          targetSymbol = lineSymbols[i];
          break;
        }
      }
    }

    // Ignorar líneas que comiencen con Scatters puros
    const isScatter = (sym) => {
      if (!sym) return false;
      const cleanId = sym.startsWith('fish_') ? 'fish' : sym;
      return cleanId === 'mask' || cleanId === 'drum' || cleanId === 'community_chest' || 
             cleanId === 'egg_red' || cleanId === 'egg_purple' || cleanId === 'egg_green' || 
             cleanId === 'pot_gold' || cleanId === 'fisherman' || cleanId === 'fish';
    };

    if (isScatter(targetSymbol) && !isWildStart) return;

    // Contar matches
    let matchCount = 1;
    let hasWildInWin = isWild(firstSymbol);

    for (let i = 1; i < 5; i++) {
      const sym = lineSymbols[i];
      if (sym === targetSymbol || isWild(sym)) {
        matchCount++;
        if (isWild(sym)) hasWildInWin = true;
      } else {
        // En 12 Masks of Fire, los 7s pueden combinarse
        if (gameId === 'masks_fire' && targetSymbol.includes('_7') && sym.includes('_7')) {
          matchCount++;
        } else {
          break;
        }
      }
    }

    if (matchCount >= 3) {
      const cleanTargetId = targetSymbol.includes('_7') && gameId === 'masks_fire' ? 'single_7' : targetSymbol;
      const symInfo = symbolsList.find(s => s.id === cleanTargetId);
      
      if (symInfo && symInfo.linePayout) {
        let mult = symInfo.linePayout[matchCount] || 0;
        
        // Si hay 7s combinados y no son todos iguales, aplicar tabla mixta
        if (gameId === 'masks_fire' && targetSymbol.includes('_7')) {
          const allSame = lineSymbols.slice(0, matchCount).every(s => s === firstSymbol);
          if (!allSame) {
            // Payout mixto
            mult = { 3: 0.5, 4: 2.0, 5: 7.5 }[matchCount] || 0;
          }
        }

        let lineWin = mult * betPerLine;
        
        // Duplicar ganancias si se incluye comodín (Monopoly o Dragon Ascension)
        if (hasWildInWin && (gameId === 'monopoly_king' || gameId === 'dragon_ascension')) {
          lineWin *= 2;
        }

        if (lineWin > 0) {
          totalWin += lineWin;
          winningLines.push({
            lineIndex: lineIdx,
            symbol: targetSymbol,
            matchCount,
            winAmount: lineWin
          });
        }
      }
    }
  });

  // 2. REGLAS ESPECIALES POR JUEGO (Scatters, Colectores y Bonos)
  if (gameId === 'masks_fire') {
    // Contar Máscaras en toda la pantalla
    let maskCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === 'mask') maskCount++;
      }
    }

    if (maskCount >= 3) {
      const mult = { 3: 1, 4: 5, 5: 15, 6: 40, 7: 100, 8: 500, 9: 2000 }[maskCount] || 0;
      const scatterWin = mult * totalBet;
      if (scatterWin > 0) {
        totalWin += scatterWin;
        scatterWins.push({ symbol: 'mask', count: maskCount, winAmount: scatterWin });
      }
    }

    // Contar Tambores de Giros Gratis
    let drumCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === 'drum') drumCount++;
      }
    }
    if (drumCount >= 3) {
      // Multiplicador directo instantáneo de 15x de giros gratis
      const drumWin = 15 * totalBet;
      totalWin += drumWin;
      scatterWins.push({ symbol: 'drum', count: drumCount, winAmount: drumWin, bonusTrigger: true });
    }
  }

  else if (gameId === 'monopoly_king') {
    // Contar Cofres de Caja de Comunidad
    let chestCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === 'community_chest') chestCount++;
      }
    }

    if (chestCount >= 3) {
      const cards = [
        { name: "Error del Banco a tu Favor", mult: 15 },
        { name: "Avance a Boardwalk", mult: 50 },
        { name: "Cobro de Alquileres", mult: 25 },
        { name: "Heredar Fondos de la Banca", mult: 10 },
        { name: "Gran Premio Cash is King", mult: 100 }
      ];
      const selectedCard = cards[Math.floor(Math.random() * cards.length)];
      const bonusWin = selectedCard.mult * totalBet;
      totalWin += bonusWin;
      scatterWins.push({
        symbol: 'community_chest',
        count: chestCount,
        winAmount: bonusWin,
        bonusTrigger: true,
        cardName: selectedCard.name,
        cardMult: selectedCard.mult
      });
    }
  }

  else if (gameId === 'dragon_ascension') {
    // Contar Huevos de Dragón (Scatters)
    let eggCount = 0;
    const eggsList = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = grid[r][c];
        if (cell === 'egg_red' || cell === 'egg_purple' || cell === 'egg_green') {
          eggCount++;
          eggsList.push({ row: r, col: c, type: cell });
        }
      }
    }

    // Si caen 3 o más huevos, detonar "Area Link Jackpot Bonus"
    if (eggCount >= 3) {
      // Simular un mini tablero Hold & Spin
      // El tablero tiene 15 celdas. Los huevos se fijan con valores (1x a 10x bet).
      // Se simula 3 giros. Si cae un nuevo huevo, se reinicia.
      let bonusBoard = Array(15).fill(null);
      // Colocar los huevos gatillo
      eggsList.forEach(egg => {
        const idx = egg.row * 5 + egg.col;
        bonusBoard[idx] = { value: [1, 2, 5, 10][Math.floor(Math.random() * 4)], type: egg.type };
      });

      // Simular giros adicionales
      let respins = 3;
      let boardAnimations = [];
      
      while (respins > 0) {
        let placedNew = false;
        // Intentar colocar un nuevo fuego en las celdas vacías
        for (let i = 0; i < 15; i++) {
          if (bonusBoard[i] === null && Math.random() < 0.15) {
            bonusBoard[i] = {
              value: [1, 2, 3, 5, 10, 25, 50, 100][Math.floor(Math.random() * 8)],
              type: ['egg_red', 'egg_purple', 'egg_green'][Math.floor(Math.random() * 3)]
            };
            placedNew = true;
          }
        }

        if (placedNew) {
          respins = 3;
          boardAnimations.push(JSON.parse(JSON.stringify(bonusBoard)));
        } else {
          respins--;
        }
      }

      // Sumar todos los valores acumulados en el bonus
      let bonusMult = 0;
      bonusBoard.forEach(cell => {
        if (cell) bonusMult += cell.value;
      });

      // Otorgar un jackpot extra de 50x si se completó el tablero entero
      const isFull = bonusBoard.every(cell => cell !== null);
      if (isFull) bonusMult += 100; // Grand Jackpot

      const bonusWin = bonusMult * totalBet;
      totalWin += bonusWin;

      scatterWins.push({
        symbol: 'dragon_eggs',
        count: eggCount,
        winAmount: bonusWin,
        bonusTrigger: true,
        bonusBoard,
        boardAnimations,
        isFullGrand: isFull
      });
    }
  }

  else if (gameId === 'fishin_pots') {
    // 1. Verificar si cae Fisherman y recolectar peces
    let hasFisherman = false;
    let fishList = [];
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = grid[r][c];
        if (cell === 'fisherman') {
          hasFisherman = true;
        } else if (cell && cell.startsWith('fish_')) {
          const cashVal = parseInt(cell.split('_')[1]);
          fishList.push({ row: r, col: c, value: cashVal });
        }
      }
    }

    if (hasFisherman && fishList.length > 0) {
      let collectMultiplier = 0;
      fishList.forEach(fish => {
        collectMultiplier += fish.value;
      });
      const collectWin = collectMultiplier * totalBet;
      totalWin += collectWin;
      scatterWins.push({
        symbol: 'fisherman',
        winAmount: collectWin,
        collectTrigger: true,
        collectedFish: fishList
      });
    }

    // 2. Contar Ollas de Oro (Scatters)
    let potCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === 'pot_gold') potCount++;
      }
    }

    if (potCount >= 3) {
      const mult = { 3: 2, 4: 10, 5: 50 }[potCount] || 0;
      const potWin = mult * totalBet;
      totalWin += potWin;
      scatterWins.push({ symbol: 'pot_gold', count: potCount, winAmount: potWin });
    }
  }

  return {
    totalWin: parseFloat(totalWin.toFixed(2)),
    winningLines,
    scatterWins
  };
}

function checkGatesMgWins(grid, totalBet) {
  let steps = [];
  let currentGrid = JSON.parse(JSON.stringify(grid));
  let totalWin = 0;
  let multipliersSum = 0;
  let multiplierOrbs = [];
  
  // 1. Identificar multiplicadores presentes en la grilla inicial
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = currentGrid[r][c];
      if (cell && cell.startsWith('mult_')) {
        const val = parseInt(cell.split('_')[1]);
        multipliersSum += val;
        multiplierOrbs.push({ row: r, col: c, value: val });
      }
    }
  }

  // 2. Bucle de Tumbles/Cascadas
  let tumbleIndex = 0;
  let hasWinThisStep = true;
  const list = CUSTOM_SLOTS_SYMBOLS.gates_mg;

  while (hasWinThisStep && tumbleIndex < 10) {
    hasWinThisStep = false;
    
    // Contar regular symbols
    const counts = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const cell = currentGrid[r][c];
        if (cell && !cell.startsWith('mult_')) {
          counts[cell] = (counts[cell] || 0) + 1;
        }
      }
    }

    const winningSymbols = [];
    let stepWin = 0;

    for (const key in counts) {
      const count = counts[key];
      if (count >= 8) {
        const symInfo = list.find(s => s.id === key);
        let multiplier = 0;
        if (count >= 12) multiplier = symInfo.payout[12];
        else if (count >= 10) multiplier = symInfo.payout[10];
        else multiplier = symInfo.payout[8];

        const payout = multiplier * totalBet;
        stepWin += payout;
        winningSymbols.push({ symbol: key, count, payout });
        hasWinThisStep = true;
      }
    }

    if (hasWinThisStep) {
      totalWin += stepWin;
      
      // Remover ganadores
      const winningLocations = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 6; c++) {
          const cell = currentGrid[r][c];
          if (winningSymbols.find(ws => ws.symbol === cell)) {
            winningLocations.push({ row: r, col: c });
            currentGrid[r][c] = null;
          }
        }
      }

      // Copia de grilla con huecos
      const gridBeforeGravity = JSON.parse(JSON.stringify(currentGrid));

      // Gravedad
      for (let c = 0; c < 6; c++) {
        const colSymbols = [];
        for (let r = 4; r >= 0; r--) {
          if (currentGrid[r][c] !== null) {
            colSymbols.push(currentGrid[r][c]);
          }
        }
        
        const totalWeight = list.reduce((sum, sym) => sum + sym.weight, 0);
        while (colSymbols.length < 5) {
          // 4% de probabilidad de caer un nuevo multiplicador
          if (Math.random() < 0.04) {
            const mVal = [2, 3, 5, 10, 25, 50, 100][Math.floor(Math.random() * 7)];
            colSymbols.push(`mult_${mVal}`);
            multipliersSum += mVal;
            multiplierOrbs.push({ row: 5 - colSymbols.length, col: c, value: mVal });
          } else {
            let rand = Math.random() * totalWeight;
            let selected = list[0].id;
            for (const sym of list) {
              if (rand < sym.weight) {
                selected = sym.id;
                break;
              }
              rand -= sym.weight;
            }
            colSymbols.push(selected);
          }
        }

        for (let r = 4; r >= 0; r--) {
          currentGrid[r][c] = colSymbols[4 - r];
        }
      }

      steps.push({
        tumbleIndex,
        winningSymbols,
        winningLocations,
        stepGrid: gridBeforeGravity,
        nextGrid: JSON.parse(JSON.stringify(currentGrid)),
        stepWin
      });

      tumbleIndex++;
    }
  }

  // Multiplicar por orbes
  let finalWin = totalWin;
  if (totalWin > 0 && multipliersSum > 0) {
    finalWin = totalWin * multipliersSum;
  }

  return {
    totalWin: parseFloat(finalWin.toFixed(2)),
    rawWin: parseFloat(totalWin.toFixed(2)),
    winningLines: steps, // en Gates enviamos las cascadas en la estructura de winningLines
    scatterWins: multiplierOrbs, // enviamos los multiplicadores en la estructura de scatterWins
    multipliersSum
  };
}

module.exports = {
  getMinesMultiplier,
  generateRandomSlotGrid,
  checkSlotWins,
  calculateRouletteWin,
  generateCrashPoint,
  ROULETTE_NUMBERS,
  getCardValue,
  calculateHandScore,
  createDeck,
  getPlinkoResult,
  calculateDiceWin,
  getDiceMultiplier,
  generateJokerGrid,
  checkJokerWins,
  generateCustomSlotGrid,
  checkCustomSlotWins
};



