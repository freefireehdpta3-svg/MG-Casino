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

module.exports = {
  getMinesMultiplier,
  generateRandomSlotGrid,
  checkSlotWins,
  calculateRouletteWin,
  generateCrashPoint,
  ROULETTE_NUMBERS,
  getCardValue,
  calculateHandScore,
  createDeck
};
