const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { initDb, dbQuery } = require('./db');
const gameLogic = require('./gameLogic');

// Inicializar Express y Servidores
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // En producción limitar al dominio del cliente
    methods: ['GET', 'POST']
  }
});

const JWT_SECRET = 'mg_casino_secret_key_2026_jwt_token';

// Middlewares
app.use(cors());
app.use(express.json());

// Crear directorios de subida si no existen
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configurar almacenamiento de Multer para comprobantes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'comprobante-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware de Autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso no autorizado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
}

// Middleware de Administrador
async function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { username, password, whatsapp } = req.body;
  if (!username || !password || !whatsapp) {
    return res.status(400).json({ error: 'Debe ingresar usuario, contraseña y número de WhatsApp' });
  }
  
  try {
    const existing = await dbQuery.get(`SELECT id FROM users WHERE username = ?`, [username]);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    await dbQuery.run(
      `INSERT INTO users (username, password_hash, role, balance, status, whatsapp) VALUES (?, ?, 'user', 0.0, 'pending', ?)`,
      [username, hash, whatsapp]
    );

    res.json({ success: true, message: 'Registro recibido. Su usuario está pendiente de aprobación por el administrador.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Debe ingresar usuario y contraseña' });
  }

  try {
    const user = await dbQuery.get(`SELECT * FROM users WHERE username = ?`, [username]);
    if (!user) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Esta cuenta ha sido suspendida' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Tu usuario está pendiente de activación. Te notificaremos a tu WhatsApp cuando esté activo.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, balance: user.balance } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbQuery.get(`SELECT id, username, role, balance, status FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Cuenta suspendida' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar datos de usuario' });
  }
});

// ==========================================
// RUTAS DEL CAJERO (DEPÓSITOS Y RETIROS)
// ==========================================

app.post('/api/cajero/deposit', authenticateToken, upload.single('receipt'), async (req, res) => {
  const { amount, method } = req.body;
  if (!amount || !method || !req.file) {
    return res.status(400).json({ error: 'Datos incompletos o falta comprobante' });
  }

  try {
    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) return res.status(400).json({ error: 'Monto inválido' });

    // Guardar la solicitud de depósito en estado 'pending'
    const relativePath = 'uploads/' + path.basename(req.file.path);
    await dbQuery.run(
      `INSERT INTO deposits (user_id, amount, method, receipt_path, status) VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.id, depositAmount, method, relativePath]
    );

    res.json({ success: true, message: 'Solicitud de depósito recibida, en revisión' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar depósito' });
  }
});

app.post('/api/cajero/withdraw', authenticateToken, async (req, res) => {
  const { amount, method, destination_details } = req.body;
  if (!amount || !method || !destination_details) {
    return res.status(400).json({ error: 'Datos incompletos para el retiro' });
  }

  try {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) return res.status(400).json({ error: 'Monto inválido' });

    // Obtener balance del usuario
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < withdrawAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Descontar saldo del usuario de inmediato (retención)
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [withdrawAmount, req.user.id]);

    // Crear solicitud de retiro
    await dbQuery.run(
      `INSERT INTO withdrawals (user_id, amount, method, destination_details, status) VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.id, withdrawAmount, method, destination_details]
    );

    res.json({ success: true, message: 'Solicitud de retiro creada. Su saldo está retenido hasta ser procesado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al solicitar retiro' });
  }
});

app.get('/api/cajero/history', authenticateToken, async (req, res) => {
  try {
    const deposits = await dbQuery.all(
      `SELECT 'deposito' AS type, amount, method, status, created_at, receipt_path AS detail FROM deposits WHERE user_id = ?`,
      [req.user.id]
    );
    const withdrawals = await dbQuery.all(
      `SELECT 'retiro' AS type, amount, method, status, created_at, destination_details AS detail FROM withdrawals WHERE user_id = ?`,
      [req.user.id]
    );

    // Unificar y ordenar por fecha descendente
    const history = [...deposits, ...withdrawals].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar historial' });
  }
});

// ==========================================
// LÓGICA DE JUEGOS EN MEMORIA (MINES)
// ==========================================
const activeMinesGames = {};

app.post('/api/games/mines/start', authenticateToken, async (req, res) => {
  const { betAmount, minesCount } = req.body;
  if (!betAmount || !minesCount) return res.status(400).json({ error: 'Faltan parámetros' });

  const bet = parseFloat(betAmount);
  const mines = parseInt(minesCount);

  if (bet <= 0 || mines < 1 || mines > 24) {
    return res.status(400).json({ error: 'Parámetros de juego inválidos' });
  }

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Saldo insuficiente para realizar la apuesta' });
    }

    // Descontar apuesta
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, req.user.id]);

    // Generar tablero de Mines (5x5, 25 celdas)
    // 0 = gema, 1 = mina
    const board = Array(25).fill(0);
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const randIndex = Math.floor(Math.random() * 25);
      if (board[randIndex] === 0) {
        board[randIndex] = 1;
        minesPlaced++;
      }
    }

    // Guardar estado del juego en memoria
    activeMinesGames[req.user.id] = {
      board,
      minesCount: mines,
      betAmount: bet,
      revealedCells: [],
      status: 'playing',
      currentMultiplier: 1.0
    };

    res.json({
      success: true,
      minesCount: mines,
      betAmount: bet,
      revealedCells: [],
      currentMultiplier: 1.0,
      currentPayout: bet
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar Mines' });
  }
});

app.post('/api/games/mines/reveal', authenticateToken, async (req, res) => {
  const { cellIndex } = req.body;
  const game = activeMinesGames[req.user.id];

  if (!game || game.status !== 'playing') {
    return res.status(400).json({ error: 'No tienes una partida activa de Mines' });
  }

  const idx = parseInt(cellIndex);
  if (idx < 0 || idx > 24 || game.revealedCells.includes(idx)) {
    return res.status(400).json({ error: 'Casilla inválida o ya revelada' });
  }

  try {
    // Si toca mina
    if (game.board[idx] === 1) {
      game.status = 'lost';
      
      // Guardar registro de apuesta en la DB
      await dbQuery.run(
        `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'mines', ?, 0.0, 0, ?)`,
        [req.user.id, game.betAmount, JSON.stringify({ minesCount: game.minesCount, revealedCount: game.revealedCells.length, hitMineAt: idx })]
      );

      const boardToSend = game.board;
      delete activeMinesGames[req.user.id];

      return res.json({
        hitMine: true,
        message: '¡Pum! Explotó una mina',
        board: boardToSend
      });
    }

    // Si toca gema
    game.revealedCells.push(idx);
    const multiplier = gameLogic.getMinesMultiplier(game.minesCount, game.revealedCells.length);
    game.currentMultiplier = multiplier;

    // Verificar si ya reveló todas las gemas posibles
    const totalGems = 25 - game.minesCount;
    if (game.revealedCells.length === totalGems) {
      // Auto-cashout
      const payoutAmount = game.betAmount * multiplier;
      game.status = 'won';

      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payoutAmount, req.user.id]);
      await dbQuery.run(
        `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'mines', ?, ?, 1, ?)`,
        [req.user.id, game.betAmount, payoutAmount, JSON.stringify({ minesCount: game.minesCount, revealedCount: game.revealedCells.length, winType: 'auto-cashout' })]
      );

      const boardToSend = game.board;
      delete activeMinesGames[req.user.id];

      return res.json({
        hitMine: false,
        autoCashout: true,
        payoutAmount,
        multiplier,
        board: boardToSend
      });
    }

    res.json({
      hitMine: false,
      revealedCells: game.revealedCells,
      currentMultiplier: multiplier,
      currentPayout: parseFloat((game.betAmount * multiplier).toFixed(2))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al revelar casilla' });
  }
});

app.post('/api/games/mines/cashout', authenticateToken, async (req, res) => {
  const game = activeMinesGames[req.user.id];
  if (!game || game.status !== 'playing') {
    return res.status(400).json({ error: 'No tienes una partida activa para retirar' });
  }

  if (game.revealedCells.length === 0) {
    return res.status(400).json({ error: 'Debes revelar al menos una gema antes de retirar' });
  }

  try {
    const payoutAmount = parseFloat((game.betAmount * game.currentMultiplier).toFixed(2));
    game.status = 'won';

    // Sumar saldo al usuario
    await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payoutAmount, req.user.id]);

    // Registrar apuesta ganada
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'mines', ?, ?, 1, ?)`,
      [req.user.id, game.betAmount, payoutAmount, JSON.stringify({ minesCount: game.minesCount, revealedCount: game.revealedCells.length })]
    );

    const boardToSend = game.board;
    delete activeMinesGames[req.user.id];

    res.json({
      success: true,
      payoutAmount,
      multiplier: game.currentMultiplier,
      board: boardToSend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al retirar ganancias' });
  }
});

// ==========================================
// JUEGO SLOTS
// ==========================================
app.post('/api/games/slots/spin', authenticateToken, async (req, res) => {
  const { betAmount } = req.body;
  if (!betAmount) return res.status(400).json({ error: 'Debe ingresar un monto a apostar' });

  const bet = parseFloat(betAmount);
  if (bet <= 0) return res.status(400).json({ error: 'Monto de apuesta inválido' });

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Obtener RTP de la configuración
    const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_slots'`);
    const rtp = parseFloat(rtpSetting ? rtpSetting.value : 94);

    // Descontar balance
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, req.user.id]);

    // Generar giro de slots
    let grid = gameLogic.generateRandomSlotGrid();
    const betPerLine = bet / 9; // 9 líneas de pago
    let { totalWin, winningLines } = gameLogic.checkSlotWins(grid, betPerLine);

    // Ajuste por RTP: Si gana demasiado, forzar una probabilidad basada en RTP
    if (totalWin > 0 && Math.random() * 100 > rtp) {
      // Re-generar un tablero vacío o con menos victorias hasta cumplir
      let attempts = 0;
      while (totalWin > 0 && attempts < 10) {
        grid = gameLogic.generateRandomSlotGrid();
        const check = gameLogic.checkSlotWins(grid, betPerLine);
        totalWin = check.totalWin;
        winningLines = check.winningLines;
        attempts++;
      }
    }

    let win = 0;
    if (totalWin > 0) {
      win = 1;
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [totalWin, req.user.id]);
    }

    // Registrar apuesta
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'slots', ?, ?, ?, ?)`,
      [req.user.id, bet, totalWin, win, JSON.stringify({ grid, winningLines })]
    );

    res.json({
      grid,
      winningLines,
      payoutAmount: parseFloat(totalWin.toFixed(2)),
      win: win === 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el giro de tragamonedas' });
  }
});

// ==========================================
// JUEGO RULETA
// ==========================================
app.post('/api/games/roulette/play', authenticateToken, async (req, res) => {
  const { bets } = req.body; // array de apuestas: [{ type, value, amount }]
  if (!bets || bets.length === 0) return res.status(400).json({ error: 'Debe colocar al menos una apuesta' });

  let totalBet = 0;
  for (const b of bets) {
    totalBet += parseFloat(b.amount);
  }

  if (totalBet <= 0) return res.status(400).json({ error: 'Monto de apuesta inválido' });

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < totalBet) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_roulette'`);
    const rtp = parseFloat(rtpSetting ? rtpSetting.value : 97.3);

    // Descontar saldo
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [totalBet, req.user.id]);

    // Girar ruleta
    let rolledNumber = Math.floor(Math.random() * 37);
    let totalPayout = 0;
    bets.forEach(b => {
      totalPayout += gameLogic.calculateRouletteWin(rolledNumber, b);
    });

    // Control de RTP (Cheating preventivo si el premio excede la tasa de retorno)
    if (totalPayout > totalBet && Math.random() * 100 > rtp) {
      let attempts = 0;
      while (totalPayout > totalBet && attempts < 10) {
        rolledNumber = Math.floor(Math.random() * 37);
        totalPayout = 0;
        bets.forEach(b => {
          totalPayout += gameLogic.calculateRouletteWin(rolledNumber, b);
        });
        attempts++;
      }
    }

    const win = totalPayout > 0 ? 1 : 0;
    if (win === 1) {
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [totalPayout, req.user.id]);
    }

    // Registrar apuesta
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'roulette', ?, ?, ?, ?)`,
      [req.user.id, totalBet, totalPayout, win, JSON.stringify({ rolledNumber, betsPlaced: bets })]
    );

    res.json({
      rolledNumber,
      color: gameLogic.ROULETTE_NUMBERS[rolledNumber],
      payoutAmount: parseFloat(totalPayout.toFixed(2)),
      win: win === 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la ruleta' });
  }
});

// ==========================================
// JUEGO BLACKJACK
// ==========================================
const activeBlackjackGames = {};

app.post('/api/games/blackjack/play', authenticateToken, async (req, res) => {
  const { action } = req.body;
  const userId = req.user.id;

  try {
    let game = activeBlackjackGames[userId];

    if (action === 'start') {
      const { betAmount } = req.body;
      const bet = parseFloat(betAmount);

      if (isNaN(bet) || bet <= 0) {
        return res.status(400).json({ error: "Monto de apuesta inválido." });
      }

      const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [userId]);
      if (user.balance < bet) {
        return res.status(400).json({ error: "Saldo insuficiente." });
      }

      // Descontar apuesta
      await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, userId]);

      const deck = gameLogic.createDeck();
      const playerHand = [deck.pop(), deck.pop()];
      const dealerHand = [deck.pop(), deck.pop()];

      game = {
        bet,
        deck,
        playerHand,
        dealerHand,
        status: 'playing'
      };

      const playerScore = gameLogic.calculateHandScore(playerHand);
      if (playerScore === 21) {
        // Blackjack natural
        game.status = 'finished';
        const dealerScore = gameLogic.calculateHandScore(dealerHand);
        let payout = 0;
        let resultMessage = "";

        if (dealerScore === 21) {
          payout = bet; // Empate
          resultMessage = "Empate (Ambos tienen Blackjack)";
        } else {
          payout = bet * 2.5; // Blackjack paga 3 a 2
          resultMessage = "¡Blackjack natural! Ganas 3 a 2.";
        }

        if (payout > 0) {
          await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payout, userId]);
        }

        // Registrar apuesta
        await dbQuery.run(
          `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'blackjack', ?, ?, ?, ?)`,
          [userId, bet, payout, payout > bet ? 1 : 0, JSON.stringify({ playerHand, dealerHand, result: resultMessage })]
        );

        delete activeBlackjackGames[userId];
        return res.json({ game, resultMessage, win: payout > bet });
      }

      activeBlackjackGames[userId] = game;
      // Retornar partida sin el mazo (para evitar que el cliente vea las cartas restantes)
      return res.json({
        game: {
          bet: game.bet,
          playerHand: game.playerHand,
          dealerHand: [game.dealerHand[0], 'hidden'], // Ocultar la segunda carta del crupier
          status: game.status
        }
      });
    }

    // Acciones secundarias (hit, double, stand)
    if (!game || game.status !== 'playing') {
      return res.status(400).json({ error: "No tienes una partida de Blackjack activa." });
    }

    if (action === 'hit') {
      game.playerHand.push(game.deck.pop());
      const playerScore = gameLogic.calculateHandScore(game.playerHand);

      if (playerScore > 21) {
        // Pasado de 21 (Bust)
        game.status = 'finished';
        const resultMessage = "Te pasaste de 21 (Bust). Pierdes la apuesta.";

        await dbQuery.run(
          `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'blackjack', ?, 0.0, 0, ?)`,
          [userId, game.bet, JSON.stringify({ playerHand: game.playerHand, dealerHand: game.dealerHand, result: resultMessage })]
        );

        delete activeBlackjackGames[userId];
        return res.json({ game, resultMessage, win: false });
      }

      activeBlackjackGames[userId] = game;
      return res.json({
        game: {
          bet: game.bet,
          playerHand: game.playerHand,
          dealerHand: [game.dealerHand[0], 'hidden'],
          status: game.status
        }
      });
    }

    if (action === 'double') {
      const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [userId]);
      if (user.balance < game.bet) {
        return res.status(400).json({ error: "Saldo insuficiente para doblar." });
      }

      // Descontar la apuesta extra (duplica la apuesta inicial)
      await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [game.bet, userId]);
      game.bet *= 2;

      game.playerHand.push(game.deck.pop());
      const playerScore = gameLogic.calculateHandScore(game.playerHand);

      if (playerScore > 21) {
        game.status = 'finished';
        const resultMessage = "Te pasaste de 21 al doblar (Bust).";

        await dbQuery.run(
          `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'blackjack', ?, 0.0, 0, ?)`,
          [userId, game.bet, JSON.stringify({ playerHand: game.playerHand, dealerHand: game.dealerHand, result: resultMessage })]
        );

        delete activeBlackjackGames[userId];
        return res.json({ game, resultMessage, win: false });
      }
      // Si no explota al doblar, se planta automáticamente (pasa a stand)
    }

    if (action === 'stand' || action === 'double') {
      game.status = 'finished';
      const playerScore = gameLogic.calculateHandScore(game.playerHand);
      let dealerScore = gameLogic.calculateHandScore(game.dealerHand);

      // Crupier saca cartas hasta alcanzar 17 o más
      while (dealerScore < 17) {
        game.dealerHand.push(game.deck.pop());
        dealerScore = gameLogic.calculateHandScore(game.dealerHand);
      }

      let payout = 0;
      let resultMessage = "";

      if (dealerScore > 21) {
        payout = game.bet * 2;
        resultMessage = `El crupier se pasó (${dealerScore}). ¡Ganas!`;
      } else if (playerScore > dealerScore) {
        payout = game.bet * 2;
        resultMessage = `Tus ${playerScore} vencen a los ${dealerScore} del crupier. ¡Ganas!`;
      } else if (playerScore < dealerScore) {
        payout = 0;
        resultMessage = `El crupier gana con ${dealerScore} vs tus ${playerScore}.`;
      } else {
        payout = game.bet; // Empate (Push)
        resultMessage = `Empate a ${playerScore}.`;
      }

      if (payout > 0) {
        await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payout, userId]);
      }

      // Registrar apuesta
      await dbQuery.run(
        `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'blackjack', ?, ?, ?, ?)`,
        [userId, game.bet, payout, payout > game.bet ? 1 : 0, JSON.stringify({ playerHand: game.playerHand, dealerHand: game.dealerHand, result: resultMessage })]
      );

      delete activeBlackjackGames[userId];
      return res.json({ game, resultMessage, win: payout > game.bet });
    }

  } catch (error) {
    console.error('Error en ruta Blackjack:', error);
    res.status(500).json({ error: 'Error interno en la partida' });
  }
});

// ==========================================
// JUEGO PLINKO
// ==========================================
app.post('/api/games/plinko/play', authenticateToken, async (req, res) => {
  const { betAmount, rows } = req.body;
  if (!betAmount || !rows) return res.status(400).json({ error: 'Faltan parámetros' });

  const bet = parseFloat(betAmount);
  const rowsCount = parseInt(rows);

  if (isNaN(bet) || bet <= 0) {
    return res.status(400).json({ error: 'Monto de apuesta inválido' });
  }

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Obtener RTP de Plinko
    const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_plinko'`);
    const rtp = parseFloat(rtpSetting ? rtpSetting.value : 96);

    // Descontar saldo
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, req.user.id]);

    // Calcular resultado
    const result = gameLogic.getPlinkoResult(rowsCount, rtp);
    const payoutAmount = parseFloat((bet * result.multiplier).toFixed(2));
    const win = result.multiplier >= 1.0 ? 1 : 0;

    if (payoutAmount > 0) {
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payoutAmount, req.user.id]);
    }

    // Registrar apuesta
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'plinko', ?, ?, ?, ?)`,
      [req.user.id, bet, payoutAmount, win, JSON.stringify({ rows: rowsCount, path: result.path, bucket: result.bucket, multiplier: result.multiplier })]
    );

    res.json({
      success: true,
      path: result.path,
      bucket: result.bucket,
      multiplier: result.multiplier,
      payoutAmount,
      win: win === 1
    });
  } catch (error) {
    console.error('Error en ruta Plinko:', error);
    res.status(500).json({ error: 'Error al jugar Plinko' });
  }
});

// ==========================================
// JUEGO DADOS (DICE)
// ==========================================
app.post('/api/games/dice/play', authenticateToken, async (req, res) => {
  const { betAmount, target, mode } = req.body;
  if (!betAmount || !target || !mode) return res.status(400).json({ error: 'Faltan parámetros' });

  const bet = parseFloat(betAmount);
  const targetVal = parseFloat(target);

  if (isNaN(bet) || bet <= 0) {
    return res.status(400).json({ error: 'Monto de apuesta inválido' });
  }
  if (targetVal < 2 || targetVal > 98) {
    return res.status(400).json({ error: 'Objetivo de dados fuera de rango (2-98)' });
  }
  if (mode !== 'over' && mode !== 'under') {
    return res.status(400).json({ error: 'Modo de juego inválido' });
  }

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Obtener RTP de dados
    const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_dice'`);
    const rtp = parseFloat(rtpSetting ? rtpSetting.value : 96);

    // Calcular multiplicador
    const multiplier = gameLogic.getDiceMultiplier(targetVal, mode, rtp);
    if (multiplier <= 0) return res.status(400).json({ error: 'Configuración de probabilidad inválida' });

    // Descontar saldo
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, req.user.id]);

    // Tirar dados (número entre 0.00 y 99.99)
    const roll = parseFloat((Math.random() * 100).toFixed(2));
    const isWin = gameLogic.calculateDiceWin(targetVal, mode, roll);
    const payoutAmount = isWin ? parseFloat((bet * multiplier).toFixed(2)) : 0.0;
    const win = isWin ? 1 : 0;

    if (payoutAmount > 0) {
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payoutAmount, req.user.id]);
    }

    // Registrar apuesta
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'dice', ?, ?, ?, ?)`,
      [req.user.id, bet, payoutAmount, win, JSON.stringify({ target: targetVal, mode, roll, multiplier })]
    );

    res.json({
      success: true,
      roll,
      multiplier,
      payoutAmount,
      win: isWin
    });
  } catch (error) {
    console.error('Error en ruta Dice:', error);
    res.status(500).json({ error: 'Error al jugar Dados' });
  }
});

// ==========================================
// JUEGO JOKER'S JEWELS
// ==========================================
app.post('/api/games/jokers-jewels/spin', authenticateToken, async (req, res) => {
  const { betAmount } = req.body;
  if (!betAmount) return res.status(400).json({ error: 'Debe ingresar un monto a apostar' });

  const bet = parseFloat(betAmount);
  if (bet <= 0) return res.status(400).json({ error: 'Monto de apuesta inválido' });

  try {
    const user = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Obtener RTP de Joker's Jewels de la configuración
    const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_jokers_jewels'`);
    const rtp = parseFloat(rtpSetting ? rtpSetting.value : 96);

    // Descontar balance
    await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [bet, req.user.id]);

    // Generar giro de slots
    let grid = gameLogic.generateJokerGrid();
    let { totalWin, winningLines, scatterWins } = gameLogic.checkJokerWins(grid, bet);

    // Ajuste por RTP: Si gana demasiado, forzar una probabilidad basada en RTP
    if (totalWin > 0 && Math.random() * 100 > rtp) {
      let attempts = 0;
      while (totalWin > 0 && attempts < 10) {
        grid = gameLogic.generateJokerGrid();
        const check = gameLogic.checkJokerWins(grid, bet);
        totalWin = check.totalWin;
        winningLines = check.winningLines;
        scatterWins = check.scatterWins;
        attempts++;
      }
    }

    let win = 0;
    if (totalWin > 0) {
      win = 1;
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [totalWin, req.user.id]);
    }

    // Registrar apuesta
    await dbQuery.run(
      `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'jokers_jewels', ?, ?, ?, ?)`,
      [req.user.id, bet, totalWin, win, JSON.stringify({ grid, winningLines, scatterWins })]
    );

    res.json({
      success: true,
      grid,
      winningLines,
      scatterWins,
      payoutAmount: parseFloat(totalWin.toFixed(2)),
      win: win === 1
    });
  } catch (error) {
    console.error('Error al girar Joker\'s Jewels:', error);
    res.status(500).json({ error: 'Error en el giro de tragamonedas de Joker' });
  }
});

// ==========================================
// APIS DEL PANEL ADMINISTRATIVO
// ==========================================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await dbQuery.get(`SELECT COUNT(id) AS count FROM users WHERE role = 'user'`);
    const totalDeposits = await dbQuery.get(`SELECT SUM(amount) AS sum FROM deposits WHERE status = 'approved'`);
    const totalWithdrawals = await dbQuery.get(`SELECT SUM(amount) AS sum FROM withdrawals WHERE status = 'approved'`);

    const depositsSum = totalDeposits.sum || 0;
    const withdrawalsSum = totalWithdrawals.sum || 0;
    const netProfit = depositsSum - withdrawalsSum;

    res.json({
      usersCount: totalUsers.count,
      depositsSum,
      withdrawalsSum,
      netProfit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar estadísticas' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await dbQuery.all(`SELECT id, username, role, balance, status, whatsapp, created_at FROM users ORDER BY id DESC`);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

app.post('/api/admin/users/balance', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, type, amount } = req.body; // type: 'add' o 'subtract'
  if (!userId || !type || !amount) return res.status(400).json({ error: 'Datos incompletos' });

  const val = parseFloat(amount);
  if (val <= 0) return res.status(400).json({ error: 'Monto inválido' });

  try {
    if (type === 'add') {
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [val, userId]);
    } else {
      await dbQuery.run(`UPDATE users SET balance = MAX(0.0, balance - ?) WHERE id = ?`, [val, userId]);
    }
    const updated = await dbQuery.get(`SELECT balance FROM users WHERE id = ?`, [userId]);
    res.json({ success: true, newBalance: updated.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar saldo' });
  }
});

app.post('/api/admin/users/status', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, status } = req.body; // status: 'active' o 'banned'
  try {
    await dbQuery.run(`UPDATE users SET status = ? WHERE id = ?`, [status, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estado de cuenta' });
  }
});

app.post('/api/admin/users/create', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, balance, whatsapp } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Debe ingresar usuario y contraseña' });
  }

  try {
    const existing = await dbQuery.get(`SELECT id FROM users WHERE username = ?`, [username]);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const initBalance = balance ? parseFloat(balance) : 0.0;

    const result = await dbQuery.run(
      `INSERT INTO users (username, password_hash, role, balance, status, whatsapp) VALUES (?, ?, 'user', ?, 'active', ?)`,
      [username, hash, initBalance, whatsapp || '']
    );

    res.json({ 
      success: true, 
      user: { 
        id: result.lastID, 
        username, 
        role: 'user', 
        balance: initBalance,
        status: 'active',
        whatsapp: whatsapp || ''
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario desde el panel de administración' });
  }
});


app.get('/api/admin/deposits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deposits = await dbQuery.all(`
      SELECT d.*, u.username 
      FROM deposits d 
      JOIN users u ON d.user_id = u.id 
      ORDER BY d.id DESC
    `);
    res.json(deposits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar depósitos' });
  }
});

app.post('/api/admin/deposits/action', authenticateToken, requireAdmin, async (req, res) => {
  const { depositId, action } = req.body; // action: 'approve' o 'reject'
  try {
    const deposit = await dbQuery.get(`SELECT * FROM deposits WHERE id = ?`, [depositId]);
    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ error: 'El depósito no existe o ya fue procesado' });
    }

    if (action === 'approve') {
      // Sumar saldo al usuario
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [deposit.amount, deposit.user_id]);
      await dbQuery.run(`UPDATE deposits SET status = 'approved' WHERE id = ?`, [depositId]);
    } else {
      await dbQuery.run(`UPDATE deposits SET status = 'rejected' WHERE id = ?`, [depositId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar depósito' });
  }
});

app.get('/api/admin/withdrawals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const withdrawals = await dbQuery.all(`
      SELECT w.*, u.username 
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.id DESC
    `);
    res.json(withdrawals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar retiros' });
  }
});

app.post('/api/admin/withdrawals/action', authenticateToken, requireAdmin, async (req, res) => {
  const { withdrawalId, action } = req.body; // action: 'approve' o 'reject'
  try {
    const withdrawal = await dbQuery.get(`SELECT * FROM withdrawals WHERE id = ?`, [withdrawalId]);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'El retiro no existe o ya fue procesado' });
    }

    if (action === 'approve') {
      await dbQuery.run(`UPDATE withdrawals SET status = 'approved' WHERE id = ?`, [withdrawalId]);
    } else {
      // REEMBOLSAR saldo retenido
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [withdrawal.amount, withdrawal.user_id]);
      await dbQuery.run(`UPDATE withdrawals SET status = 'rejected' WHERE id = ?`, [withdrawalId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar retiro' });
  }
});

app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await dbQuery.all(`SELECT * FROM settings`);
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar ajustes' });
  }
});

app.post('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  const { settings } = req.body; // array de { key, value }
  try {
    for (const s of settings) {
      await dbQuery.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar ajustes' });
  }
});

// ==========================================
// CRASH GAME WEBSOCKET REAL-TIME LOOP
// ==========================================
let crashState = {
  status: 'betting', // 'betting', 'flying', 'crashed'
  multiplier: 1.00,
  crashPoint: 2.00,
  countdown: 5.0, // segundos de cuenta regresiva
  bets: [] // apuestas activas de la ronda: { userId, username, amount, socketId, cashedOut: false, payout?: number }
};

// Bucle principal del juego Crash
async function runCrashLoop() {
  const rtpSetting = await dbQuery.get(`SELECT value FROM settings WHERE key = 'rtp_crash'`);
  const rtp = parseFloat(rtpSetting ? rtpSetting.value : 96);
  
  // 1. FASE DE APUESTAS (Betting)
  crashState.status = 'betting';
  crashState.multiplier = 1.00;
  crashState.countdown = 6.0; // 6 segundos de apuestas
  crashState.bets = [];
  crashState.crashPoint = gameLogic.generateCrashPoint(rtp);
  
  // Emitir inicio de apuestas
  io.emit('crash_betting', { countdown: crashState.countdown });

  const countdownInterval = setInterval(() => {
    crashState.countdown -= 1;
    if (crashState.countdown <= 0) {
      clearInterval(countdownInterval);
      startFlying();
    } else {
      io.emit('crash_countdown', { countdown: crashState.countdown });
    }
  }, 1000);
}

function startFlying() {
  crashState.status = 'flying';
  io.emit('crash_flying_start', { bets: crashState.bets });

  const startTime = Date.now();
  
  const tickInterval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000;
    
    // Curva exponencial del multiplicador: e^(0.06 * tiempo)
    const currentMult = Math.pow(Math.E, 0.065 * elapsed);
    crashState.multiplier = parseFloat(currentMult.toFixed(2));

    // Si alcanza o supera el punto de crash pre-calculado
    if (crashState.multiplier >= crashState.crashPoint) {
      clearInterval(tickInterval);
      crashState.multiplier = crashState.crashPoint; // Ajustar exactamente al crashPoint
      crashState.status = 'crashed';
      
      // Procesar pérdidas para los que no se retiraron
      for (const bet of crashState.bets) {
        if (!bet.cashedOut) {
          // Registrar apuesta perdida en la DB
          await dbQuery.run(
            `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'crash', ?, 0.0, 0, ?)`,
            [bet.userId, bet.amount, JSON.stringify({ crashPoint: crashState.crashPoint, cashedOut: false })]
          );
        }
      }

      io.emit('crash_crashed', { crashPoint: crashState.crashPoint });
      
      // Esperar 4 segundos antes de la nueva ronda
      setTimeout(() => {
        runCrashLoop();
      }, 4000);
    } else {
      io.emit('crash_tick', { multiplier: crashState.multiplier });
    }
  }, 100);
}

// Websockets Events para Crash
io.on('connection', (socket) => {
  // Enviar estado actual al conectarse
  socket.emit('crash_state', {
    status: crashState.status,
    multiplier: crashState.multiplier,
    countdown: crashState.countdown,
    bets: crashState.bets
  });

  // Evento para realizar apuesta
  socket.on('crash_place_bet', async (data) => {
    // data = { token, amount }
    if (crashState.status !== 'betting') {
      return socket.emit('crash_error', { message: 'Fase de apuestas cerrada' });
    }

    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      const betAmount = parseFloat(data.amount);

      if (betAmount <= 0) return socket.emit('crash_error', { message: 'Monto inválido' });

      // Obtener saldo
      const user = await dbQuery.get(`SELECT balance, username FROM users WHERE id = ?`, [decoded.id]);
      if (!user) return socket.emit('crash_error', { message: 'Usuario no encontrado' });
      
      if (user.balance < betAmount) {
        return socket.emit('crash_error', { message: 'Saldo insuficiente' });
      }

      // Verificar si ya tiene apuesta esta ronda
      if (crashState.bets.find(b => b.userId === decoded.id)) {
        return socket.emit('crash_error', { message: 'Ya tienes una apuesta en esta ronda' });
      }

      // Descontar saldo de la base de datos
      await dbQuery.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [betAmount, decoded.id]);

      // Agregar a las apuestas de la ronda
      const newBet = {
        userId: decoded.id,
        username: user.username,
        amount: betAmount,
        socketId: socket.id,
        cashedOut: false
      };
      
      crashState.bets.push(newBet);
      io.emit('crash_new_bet', newBet);
      socket.emit('crash_bet_success', { amount: betAmount });
    } catch (e) {
      socket.emit('crash_error', { message: 'Error de autenticación' });
    }
  });

  // Evento para retirar (Cashout)
  socket.on('crash_cashout', async (data) => {
    // data = { token }
    if (crashState.status !== 'flying') {
      return socket.emit('crash_error', { message: 'No se puede retirar en esta fase' });
    }

    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      const playerBet = crashState.bets.find(b => b.userId === decoded.id && !b.cashedOut);

      if (!playerBet) {
        return socket.emit('crash_error', { message: 'No hay apuestas activas para retirar' });
      }

      playerBet.cashedOut = true;
      const cashoutMultiplier = crashState.multiplier;
      const payout = parseFloat((playerBet.amount * cashoutMultiplier).toFixed(2));
      playerBet.payout = payout;
      playerBet.multiplier = cashoutMultiplier;

      // Saborizar saldo en la DB
      await dbQuery.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [payout, decoded.id]);

      // Registrar apuesta ganadora en la DB
      await dbQuery.run(
        `INSERT INTO bets (user_id, game_type, bet_amount, payout_amount, win, details) VALUES (?, 'crash', ?, ?, 1, ?)`,
        [decoded.id, playerBet.amount, payout, JSON.stringify({ crashPoint: cashoutMultiplier, cashedOut: true })]
      );

      // Notificar a todos
      io.emit('crash_cashout_success', {
        userId: decoded.id,
        username: playerBet.username,
        multiplier: cashoutMultiplier,
        payout
      });
      
      socket.emit('crash_player_win', { payout, multiplier: cashoutMultiplier });
    } catch (e) {
      socket.emit('crash_error', { message: 'Error al procesar retiro' });
    }
  });
});

// Inicializar Base de Datos y arrancar Servidor
const PORT = process.env.PORT || 3001;
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor de MG Casino Online corriendo en http://localhost:${PORT}`);
    // Arrancar el ciclo del juego Crash
    runCrashLoop();
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos', err);
});
