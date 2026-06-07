import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Sparkles, Play, Volume2, VolumeX, Flame, Gem, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

// Configuración de los 5 juegos de tragamonedas
const GAME_CONFIGS = {
  gates_mg: {
    title: 'Gates of MGCASINO',
    subtitle: 'SISTEMA SCATTER PAYS - 6x5',
    emoji: '⚡',
    themeColor: '#00ff87',
    bgGradient: 'linear-gradient(180deg, #05160d 0%, #000000 100%)',
    borderColor: '#00ff87',
    glowColor: 'rgba(0, 255, 135, 0.25)',
    symbols: {
      gem_green: { char: '🟢', name: 'Gema Verde', color: '#00e676' },
      gem_blue: { char: '🔵', name: 'Gema Azul', color: '#2979ff' },
      gem_purple: { char: '🟣', name: 'Gema Púrpura', color: '#d500f9' },
      gem_red: { char: '🔴', name: 'Gema Roja', color: '#ff1744' },
      gem_yellow: { char: '🟡', name: 'Gema Amarilla', color: '#ffd600' },
      ring: { char: '💍', name: 'Anillo de Oro', color: '#ffd700' },
      cup: { char: '🏆', name: 'Cáliz Sagrado', color: '#ffea00' },
      hourglass: { char: '⏳', name: 'Reloj de Arena', color: '#00e5ff' },
      crown: { char: '👑', name: 'Corona del Olimpo', color: '#ffd700' }
    }
  },
  masks_fire: {
    title: '12 Masks of Fire: Drum Frenzy',
    subtitle: '9 LÍNEAS DE PAGO - MULTIPLICADOR LADDER',
    emoji: '🔥',
    themeColor: '#ff3d00',
    bgGradient: 'linear-gradient(180deg, #1f0b05 0%, #000000 100%)',
    borderColor: '#ff3d00',
    glowColor: 'rgba(255, 61, 0, 0.25)',
    symbols: {
      cherry: { char: '🍒', name: 'Cereza', color: '#ff1744' },
      bar: { char: '➖', name: 'BAR', color: '#9e9e9e' },
      bell: { char: '🔔', name: 'Campana', color: '#ffd600' },
      single_7: { char: '7️⃣', name: 'Siete', color: '#ff3d00' },
      double_7: { char: '7️⃣7️⃣', name: 'Doble Siete', color: '#ff3d00' },
      triple_7: { char: '7️⃣7️⃣7️⃣', name: 'Triple Siete', color: '#ff3d00' },
      mask: { char: '👺', name: 'Máscara Sagrada', color: '#ff3d00' },
      drum: { char: '🥁', name: 'Tambor de Bonus', color: '#ffd600' }
    }
  },
  monopoly_king: {
    title: 'Monopoly: Cash is King',
    subtitle: '9 LÍNEAS DE PAGO - BONO CAJA COMUNIDAD',
    emoji: '🎩',
    themeColor: '#00b0ff',
    bgGradient: 'linear-gradient(180deg, #05131a 0%, #000000 100%)',
    borderColor: '#00b0ff',
    glowColor: 'rgba(0, 176, 255, 0.25)',
    symbols: {
      shoe: { char: '👞', name: 'Zapato', color: '#8d6e63' },
      thimble: { char: '🧵', name: 'Dedal', color: '#b0bec5' },
      ship: { char: '🚢', name: 'Barco', color: '#4fc3f7' },
      dog: { char: '🐕', name: 'Perro', color: '#a1887f' },
      car: { char: '🚗', name: 'Auto', color: '#e57373' },
      hat: { char: '🎩', name: 'Sombrilla', color: '#e0e0e0' },
      monopoly_guy: { char: '👴', name: 'Mr. Monopoly (WILD)', color: '#ffd600' },
      community_chest: { char: '📦', name: 'Caja de Comunidad', color: '#81c784' }
    }
  },
  dragon_ascension: {
    title: 'Area Link: Dragon Ascension',
    subtitle: '9 LÍNEAS DE PAGO - DRAGON JACKPOT',
    emoji: '🐉',
    themeColor: '#d500f9',
    bgGradient: 'linear-gradient(180deg, #15051a 0%, #000000 100%)',
    borderColor: '#d500f9',
    glowColor: 'rgba(213, 0, 249, 0.25)',
    symbols: {
      card_J: { char: 'J', name: 'J', color: '#9e9e9e' },
      card_Q: { char: 'Q', name: 'Q', color: '#ff4081' },
      card_K: { char: 'K', name: 'K', color: '#ffeb3b' },
      card_A: { char: 'A', name: 'A', color: '#ff3d00' },
      emerald: { char: '💚', name: 'Esmeralda', color: '#00e676' },
      amethyst: { char: '💜', name: 'Amatista', color: '#d500f9' },
      ruby: { char: '❤️', name: 'Rubí', color: '#ff1744' },
      gold_chest: { char: '👑', name: 'Cofre Dorado (WILD)', color: '#ffd700' },
      egg_red: { char: '🔴', name: 'Fuego Rojo', color: '#ff1744' },
      egg_purple: { char: '🟣', name: 'Fuego Púrpura', color: '#d500f9' },
      egg_green: { char: '🟢', name: 'Fuego Verde', color: '#00e676' }
    }
  },
  fishin_pots: {
    title: 'Fishin\' Triple Pots of Gold',
    subtitle: '9 LÍNEAS DE PAGO - COLECCIÓN PESCADOR',
    emoji: '🎣',
    themeColor: '#00ff87',
    bgGradient: 'linear-gradient(180deg, #051610 0%, #000000 100%)',
    borderColor: '#00ff87',
    glowColor: 'rgba(0, 255, 135, 0.25)',
    symbols: {
      card_Q: { char: 'Q', name: 'Q', color: '#ff4081' },
      card_K: { char: 'K', name: 'K', color: '#ffeb3b' },
      card_A: { char: 'A', name: 'A', color: '#ff3d00' },
      float: { char: '🛟', name: 'Boya', color: '#ff3d00' },
      tackle_box: { char: '🧳', name: 'Caja de Pesca', color: '#8d6e63' },
      hat: { char: '👒', name: 'Sombrero Leprechaun', color: '#00e676' },
      pot_gold: { char: '🍯', name: 'Olla de Oro', color: '#ffd700' },
      fisherman: { char: '🎣', name: 'Pescador (COLLECT)', color: '#00b0ff' },
      fish: { char: '🐟', name: 'Pez de Dinero', color: '#00e5ff' }
    }
  }
};

export default function CustomSlots({ gameId, setView }) {
  const config = GAME_CONFIGS[gameId] || GAME_CONFIGS.gates_mg;
  const { token, refreshBalance } = useContext(AuthContext);

  const [betAmount, setBetAmount] = useState('100');
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Dimensiones de la grilla
  const rows = gameId === 'gates_mg' ? 5 : 3;
  const cols = gameId === 'gates_mg' ? 6 : 5;

  // Cuadrícula inicial por defecto
  const [grid, setGrid] = useState(
    Array(rows).fill(null).map(() => Array(cols).fill(Object.keys(config.symbols)[0]))
  );

  const [spinningReels, setSpinningReels] = useState(Array(cols).fill(false));
  const [winAmount, setWinAmount] = useState(0);
  const [winningPaylines, setWinningPaylines] = useState([]);
  const [winningScatters, setWinningScatters] = useState([]);
  const [error, setError] = useState('');

  // Estados específicos de Bonus
  const [activeBonus, setActiveBonus] = useState(null); // 'monopoly_card', 'dragon_link', 'gates_mult'
  const [chestCard, setChestCard] = useState(null); // Monopoly Card drawn
  const [dragonLinkBoard, setDragonLinkBoard] = useState(null); // Board for Area Link
  const [gatesMultipliers, setGatesMultipliers] = useState(0); // Sum of Gates multipliers

  // Inicializar grid con símbolos del juego al cambiar de juego
  useEffect(() => {
    const symbolKeys = Object.keys(config.symbols);
    setGrid(
      Array(rows).fill(null).map(() => 
        Array(cols).fill(null).map(() => symbolKeys[Math.floor(Math.random() * symbolKeys.length)])
      )
    );
    setWinAmount(0);
    setWinningPaylines([]);
    setWinningScatters([]);
    setActiveBonus(null);
    setChestCard(null);
    setDragonLinkBoard(null);
    setGatesMultipliers(0);
    setError('');
  }, [gameId]);

  // Audio Synthesizer
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'spin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'stop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'win') {
        const now = ctx.currentTime;
        const notes = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.06, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.08 + 0.25);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.25);
        });
      } else if (type === 'bonus') {
        // Dramatic laser sound for bonus trigger
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(1500, now + 1.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.start();
        osc.stop(now + 1.2);
      } else if (type === 'tumble') {
        // High bubble pop sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSpin = async (e) => {
    e.preventDefault();
    if (isPlaying) return;

    setError('');
    setWinAmount(0);
    setWinningPaylines([]);
    setWinningScatters([]);
    setActiveBonus(null);
    setChestCard(null);
    setDragonLinkBoard(null);
    setGatesMultipliers(0);
    setIsPlaying(true);

    // Activar giro visual
    setSpinningReels(Array(cols).fill(true));
    playSound('spin');

    // Animación de mezcla del Grid
    const symbolKeys = Object.keys(config.symbols);
    const interval = setInterval(() => {
      setGrid(prev => 
        prev.map(row => 
          row.map(() => {
            // Regla especial para simular multiplicador orbe en Gates
            if (gameId === 'gates_mg' && Math.random() < 0.08) {
              return `mult_${[2, 5, 10, 50][Math.floor(Math.random() * 4)]}`;
            }
            if (gameId === 'fishin_pots' && Math.random() < 0.15) {
              return `fish_${[2, 5, 10][Math.floor(Math.random() * 3)]}`;
            }
            return symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
          })
        )
      );
    }, 60);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/custom-slots/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId, betAmount: parseFloat(betAmount) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el tiro.');

      setTimeout(() => {
        clearInterval(interval);
        
        // Detener secuencialmente cada rodillo
        const stopReel = (colIdx) => {
          setSpinningReels(prev => {
            const next = [...prev];
            next[colIdx] = false;
            return next;
          });
          playSound('stop');

          // Fijar los valores en el grid de la columna detenida
          setGrid(prev => {
            const nextGrid = [...prev];
            for (let r = 0; r < rows; r++) {
              nextGrid[r][colIdx] = data.grid[r][colIdx];
            }
            return nextGrid;
          });

          if (colIdx < cols - 1) {
            setTimeout(() => stopReel(colIdx + 1), 120);
          } else {
            // Todos los rodillos se detuvieron. Procesar resultado
            if (gameId === 'gates_mg') {
              processGatesTumbles(data);
            } else {
              processStandardResult(data);
            }
          }
        };

        stopReel(0);
      }, 1000);

    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setSpinningReels(Array(cols).fill(false));
      setIsPlaying(false);
    }
  };

  // Procesamiento visual de Tumbles (Cascadas) de Gates of MGCASINO
  const processGatesTumbles = async (data) => {
    const tumbles = data.winningLines; // en Gates contiene la lista de cascadas
    setGatesMultipliers(data.multipliersSum);

    if (tumbles && tumbles.length > 0) {
      // Ir pasando por cada paso de cascada secuencialmente con delay
      for (let i = 0; i < tumbles.length; i++) {
        const step = tumbles[i];
        
        // 1. Resaltar ganadores
        setWinningScatters(step.winningSymbols.map(ws => ws.symbol));
        playSound('win');
        await new Promise(r => setTimeout(r, 600));

        // 2. Mostrar la grilla con los huecos vacíos
        setGrid(step.stepGrid);
        playSound('tumble');
        await new Promise(r => setTimeout(r, 400));

        // 3. Mostrar la caída de los nuevos símbolos
        setGrid(step.nextGrid);
        await new Promise(r => setTimeout(r, 600));
      }
    }

    // Limpiar luces ganadoras
    setWinningScatters([]);

    // Aplicar relámpagos si hay multiplicador
    if (data.multipliersSum > 0 && data.payoutAmount > 0) {
      setActiveBonus('gates_mult');
      playSound('bonus');
      await new Promise(r => setTimeout(r, 1500));
    }

    setWinAmount(data.payoutAmount);
    setIsPlaying(false);
    refreshBalance();

    if (data.payoutAmount >= parseFloat(betAmount) * 5) {
      triggerConfetti();
    }
  };

  // Procesamiento visual estándar
  const processStandardResult = async (data) => {
    setWinAmount(data.payoutAmount);
    refreshBalance();
    
    // Resaltar líneas ganadoras
    if (data.winningLines && data.winningLines.length > 0) {
      setWinningPaylines(data.winningLines.map(l => l.lineIndex));
      playSound('win');
    }

    // Verificar si hay activadores de Scatter/Bono
    const bonusScatter = data.scatterWins.find(s => s.bonusTrigger);

    if (bonusScatter) {
      playSound('bonus');
      
      if (gameId === 'monopoly_king') {
        // Animación de carta de Caja de Comunidad
        setActiveBonus('monopoly_card');
        setChestCard({ name: bonusScatter.cardName, mult: bonusScatter.cardMult });
      }

      else if (gameId === 'dragon_ascension') {
        // Animación de Area Link Respins
        setActiveBonus('dragon_link');
        // Mostrar tableros secuencialmente
        const anims = bonusScatter.boardAnimations || [];
        for (let idx = 0; idx < anims.length; idx++) {
          setDragonLinkBoard(anims[idx]);
          await new Promise(r => setTimeout(r, 800));
        }
        setDragonLinkBoard(bonusScatter.bonusBoard);
        if (bonusScatter.isFullGrand) {
          triggerConfetti();
        }
      }
    }

    // Si es Fisherman en Fishin' Pots y hay colecta
    const collectTrigger = data.scatterWins.find(s => s.collectTrigger);
    if (collectTrigger) {
      playSound('bonus');
      setWinningScatters(['fisherman', 'fish']);
      await new Promise(r => setTimeout(r, 1200));
      setWinningScatters([]);
    }

    setIsPlaying(false);
    if (data.payoutAmount >= parseFloat(betAmount) * 5) {
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.65 },
      colors: [config.themeColor, '#ffffff', '#ffd700']
    });
  };

  // Traduce el símbolo a su representación gráfica en celdas
  const renderSymbolContent = (cell) => {
    if (!cell) return '';

    // Multiplicador en Gates
    if (cell.startsWith('mult_')) {
      const multVal = cell.split('_')[1];
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #09090b 20%, #ffd700 100%)',
          border: '2px solid #ffffff',
          boxShadow: '0 0 12px #ffd700',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          ⚡<span>{multVal}x</span>
        </div>
      );
    }

    // Pez en Fishin' Pots
    if (cell.startsWith('fish_')) {
      const cash = cell.split('_')[1];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>🐟</span>
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'rgba(0,0,0,0.7)', 
            padding: '2px 6px', 
            borderRadius: '6px', 
            border: '1px solid var(--gold)', 
            color: 'var(--gold)',
            fontWeight: 'bold',
            marginTop: '-6px'
          }}>
            x{cash}
          </span>
        </div>
      );
    }

    const symInfo = config.symbols[cell];
    if (!symInfo) return cell;

    return (
      <span style={{ 
        fontSize: gameId === 'gates_mg' ? '2.2rem' : '2.8rem',
        textShadow: `0 0 8px ${symInfo.color}33`,
        transition: 'transform 0.1s ease'
      }}>
        {symInfo.char}
      </span>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.1fr 1.9fr',
      gap: '32px',
      maxWidth: '1100px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out',
      paddingBottom: '40px'
    }}>
      
      {/* SECCIÓN IZQUIERDA: CONTROLES Y TABLA DE PAGOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* PANEL DE APUESTAS */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          border: `1px solid rgba(0, 255, 135, 0.15)`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif' }}>
              <span style={{ color: config.themeColor }}>{config.emoji}</span> {config.title}
            </h2>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn-outline"
              style={{ padding: '6px', minWidth: 'auto', borderRadius: '8px' }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSpin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Apuesta de Giro ($)
              </label>
              <input 
                type="number"
                className="input-field"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isPlaying}
                min="10"
                step="10"
                required
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {['50', '100', '250', '500', '1000'].map(val => (
                  <button 
                    key={val}
                    type="button" 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '5px 0', fontSize: '0.75rem' }} 
                    onClick={() => setBetAmount(val)}
                    disabled={isPlaying}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-gold" 
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${config.themeColor}, #000000)`,
                color: 'white',
                border: `1.5px solid ${config.themeColor}`,
                boxShadow: `0 0 15px ${config.glowColor}`
              }} 
              disabled={isPlaying}
            >
              {isPlaying ? 'GIRANDO...' : '¡JUGAR REAL (SPIN)!'}
            </button>
          </form>
        </div>

        {/* LADDER DE MÁSCARAS EN 12 MASKS OF FIRE */}
        {gameId === 'masks_fire' && (
          <div className="glass-panel" style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(255, 61, 0, 0.04)',
            border: '1px solid rgba(255, 61, 0, 0.15)'
          }}>
            <h3 style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} /> Ladder de Premios de Máscaras
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', fontSize: '0.8rem' }}>
              {[
                { count: 9, mult: 2000, color: '#ff3d00' },
                { count: 8, mult: 500, color: '#ff5722' },
                { count: 7, mult: 100, color: '#ff7043' },
                { count: 6, mult: 40, color: '#ff8a65' },
                { count: 5, mult: 15, color: '#ffab91' },
                { count: 4, mult: 5, color: '#ffccbc' },
                { count: 3, mult: 1, color: '#ffffff' }
              ].map(item => (
                <div 
                  key={item.count}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.02)',
                    fontWeight: 'bold',
                    color: item.color
                  }}
                >
                  <span>👺 x{item.count} Máscaras</span>
                  <span>{item.mult}x total bet</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGLAS Y TABLA DE PAGOS GENÉRICA */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', fontSize: '0.8rem' }}>
          <h3 style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gem size={14} /> Información del Slot
          </h3>
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gameId === 'gates_mg' ? (
              <>
                <p><strong>SCATTER PAYS:</strong> Los símbolos pagan en cualquier posición de la pantalla. No requieren líneas de pago.</p>
                <p>• 8 a 9 iguales pagan hasta 10x de apuesta total.</p>
                <p>• 10 a 11 iguales pagan hasta 50x.</p>
                <p>• 12 o más iguales pagan hasta 100x.</p>
                <p><strong>CASCADAS:</strong> Los símbolos ganadores se destruyen y caen nuevos símbolos para seguir acumulando premios en el mismo tiro.</p>
                <p><strong>ORBES DE ZEUS:</strong> Multiplican la ganancia acumulada al final de la tirada. ¡Desde 2x hasta 500x!</p>
              </>
            ) : (
              <>
                <p><strong>LÍNEAS DE PAGO:</strong> Cuenta con 9 líneas de pago fijas de izquierda a derecha.</p>
                <p><strong>COMODINES (WILD):</strong> Sustituyen a símbolos regulares para completar líneas ganadoras y duplican su valor (Monopoly / Dragon).</p>
                {gameId === 'fishin_pots' && <p><strong>COLECTOR:</strong> Si el Leprechaun Pescador lands en la columna 5, recolecta de inmediato todos los valores en efectivo de los peces de dinero en pantalla.</p>}
                {gameId === 'dragon_ascension' && <p><strong>JACKPOT DRAGÓN:</strong> 3 huevos místicos en pantalla detonarán 3 respins Hold & Spin con orbes de jackpot bloqueables.</p>}
              </>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>* Retorno regulado bajo algoritmos criptográficos server-side seguros con control de RTP.</span>
          </div>
        </div>

      </div>

      {/* SECCIÓN DERECHA: GABINETE DE CASINO MULTIMEDIA */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '24px',
        background: config.bgGradient,
        border: `3px solid ${config.borderColor}`,
        boxShadow: `0 0 25px ${config.glowColor}, inset 0 0 20px rgba(0,0,0,0.9)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Cabecera del Gabinete */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.6)',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: '1.65rem', 
            fontWeight: '900', 
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            textShadow: `0 0 10px ${config.glowColor}`
          }}>
            {config.title}
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            {config.subtitle}
          </span>
        </div>

        {/* PANEL DE GIROS DE RODILLOS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: gameId === 'gates_mg' ? '8px' : '12px',
          width: '100%',
          background: '#09090b',
          padding: '16px',
          borderRadius: '16px',
          border: '2px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9)',
          position: 'relative'
        }}>
          
          {/* Si se activa Bonus Especial, dibujar overlays temáticos */}
          {activeBonus === 'monopoly_card' && chestCard && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.3s ease-out',
              borderRadius: '16px'
            }}>
              <div className="glass-panel" style={{
                width: '300px',
                padding: '24px',
                border: '3px solid #00b0ff',
                boxShadow: '0 0 20px rgba(0, 176, 255, 0.4)',
                textAlign: 'center',
                borderRadius: '16px',
                background: '#0a1d26'
              }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
                <h3 style={{ color: '#00b0ff', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Caja de Comunidad
                </h3>
                <h2 style={{ fontSize: '1.5rem', color: 'white', margin: '14px 0', fontWeight: 'bold' }}>
                  {chestCard.name}
                </h2>
                <div style={{ 
                  fontSize: '2rem', 
                  color: 'var(--gold)', 
                  fontWeight: 'bold', 
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '10px'
                }}>
                  +{chestCard.mult}x Bet!
                </div>
                <button 
                  onClick={() => setActiveBonus(null)} 
                  className="btn-gold" 
                  style={{ marginTop: '20px', width: '100%', background: '#00b0ff', border: '1px solid white' }}
                >
                  Cobrar Premio
                </button>
              </div>
            </div>
          )}

          {activeBonus === 'dragon_link' && dragonLinkBoard && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.3s ease-out',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <h3 style={{ color: '#d500f9', marginBottom: '10px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🐉 Area Link Dragon Respins 🐉
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                width: '100%',
                maxWidth: '400px'
              }}>
                {dragonLinkBoard.map((cell, idx) => (
                  <div 
                    key={idx}
                    style={{
                      height: '56px',
                      background: cell ? 'radial-gradient(circle, #2b0333 0%, #110014 100%)' : '#05050a',
                      border: cell ? '1.5px solid #d500f9' : '1px dashed rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: cell ? '0 0 8px rgba(213, 0, 249, 0.4)' : 'none'
                    }}
                  >
                    {cell ? (
                      <div style={{ textAlign: 'center' }}>
                        <div>🔥</div>
                        <div style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>{cell.value}x</div>
                      </div>
                    ) : ''}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setActiveBonus(null)} 
                className="btn-gold" 
                style={{ marginTop: '20px', padding: '10px 24px', background: '#d500f9', border: '1px solid white' }}
              >
                Volver al Juego
              </button>
            </div>
          )}

          {activeBonus === 'gates_mult' && gatesMultipliers > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,255,135,0.08)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'flashAnimation 1.5s ease-out',
              borderRadius: '16px'
            }}>
              <div style={{
                padding: '20px 40px',
                background: 'rgba(0,0,0,0.9)',
                border: '3px solid #00ff87',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 0 25px rgba(0, 255, 135, 0.6)'
              }}>
                <span style={{ fontSize: '3rem', display: 'block' }}>⚡ Zeus Multiplier! ⚡</span>
                <h2 style={{ fontSize: '2.5rem', color: '#00ff87', fontWeight: '900', marginTop: '10px' }}>
                  {gatesMultipliers}x multiplicador total!
                </h2>
              </div>
            </div>
          )}

          {/* Renderizado de columnas de rodillos */}
          {Array(cols).fill(null).map((_, colIdx) => {
            const isReelSpinning = spinningReels[colIdx];
            return (
              <div 
                key={colIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: '#0e0e12',
                  border: `1px solid rgba(255,255,255,0.03)`,
                  borderRadius: '12px',
                  padding: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  height: gameId === 'gates_mg' ? '300px' : '230px',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                }}
              >
                {/* Celdas del rodillo */}
                {Array(rows).fill(null).map((_, rowIdx) => {
                  const cell = grid[rowIdx][colIdx];
                  
                  // Verificar si este símbolo es ganador
                  const isScatterWinner = winningScatters.includes(cell) || (cell && cell.startsWith('fish_') && winningScatters.includes('fish'));
                  const isWinner = isScatterWinner || winAmount > 0; // en ganancias iluminar todos de fondo por defecto
                  
                  return (
                    <div 
                      key={rowIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: gameId === 'gates_mg' ? '46px' : '64px',
                        width: gameId === 'gates_mg' ? '46px' : '64px',
                        borderRadius: '10px',
                        background: isWinner ? `${config.themeColor}15` : 'transparent',
                        border: isWinner ? `1.5px solid ${config.themeColor}` : '1px solid transparent',
                        boxShadow: isWinner ? `0 0 12px ${config.glowColor}` : 'none',
                        transition: 'all 0.15s ease',
                        animation: isReelSpinning ? 'blurSpin 0.1s infinite linear' : isWinner ? 'pulseWinCustom 1.5s infinite alternate' : 'none'
                      }}
                    >
                      {isReelSpinning ? '🎰' : renderSymbolContent(cell)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Panel de Victoria Inferior */}
        {winAmount > 0 ? (
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '12px 32px',
            background: `rgba(0, 255, 135, 0.08)`,
            border: `2px solid ${config.themeColor}`,
            borderRadius: '14px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontSize: '0.8rem', color: config.themeColor, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
              ¡GIRADA GANADORA!
            </span>
            <h2 style={{ fontSize: '2rem', color: 'white', marginTop: '2px', fontWeight: '900' }}>
              +${winAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        ) : (
          <div style={{
            marginTop: '24px',
            padding: '12px 32px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esperando lanzamiento...</span>
            <h2 style={{ fontSize: '1.2rem', color: 'white', marginTop: '4px', fontWeight: 'bold' }}>
              Gira para buscar tu premio
            </h2>
          </div>
        )}

      </div>

      {/* Reglas CSS para Animaciones */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blurSpin {
          0% { filter: blur(4px); transform: translateY(-4px); }
          50% { filter: blur(6px); transform: translateY(4px); }
          100% { filter: blur(4px); transform: translateY(-4px); }
        }
        @keyframes pulseWinCustom {
          0% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.1); }
          100% { transform: scale(1.05); box-shadow: 0 0 15px ${config.glowColor}; }
        }
        @keyframes flashAnimation {
          0% { background-color: rgba(0, 255, 135, 0); }
          25% { background-color: rgba(0, 255, 135, 0.35); }
          50% { background-color: rgba(0, 255, 135, 0.1); }
          75% { background-color: rgba(0, 255, 135, 0.25); }
          100% { background-color: rgba(0, 255, 135, 0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

    </div>
  );
}
