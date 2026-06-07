import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { HelpCircle, Coins, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const SYMBOL_EMOJIS = {
  cherry: '🍒',
  lemon: '🍋',
  orange: '🍊',
  plum: '🍇',
  grape: '🍇',
  melon: '🍉',
  bell: '🔔',
  star: '⭐',
  seven: '💎' // Súper diamante de oro
};

// Mapa de colores neón por símbolo
const SYMBOL_COLORS = {
  cherry: 'rgba(255, 23, 68, 0.2)',
  lemon: 'rgba(255, 235, 59, 0.2)',
  orange: 'rgba(255, 145, 0, 0.2)',
  plum: 'rgba(156, 39, 176, 0.2)',
  grape: 'rgba(103, 58, 183, 0.2)',
  melon: 'rgba(76, 175, 80, 0.2)',
  bell: 'rgba(255, 215, 0, 0.2)',
  star: 'rgba(0, 229, 255, 0.2)',
  seven: 'rgba(0, 230, 118, 0.3)'
};

// Líneas de pago para mostrar visualmente
const LINE_COORDINATES = [
  [1, 1, 1, 1, 1], // Fila 1 (horizontal media)
  [0, 0, 0, 0, 0], // Fila 0 (horizontal superior)
  [2, 2, 2, 2, 2], // Fila 2 (horizontal inferior)
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // V invertida
  [0, 0, 1, 2, 2], // Diagonal descendiente quebrada
  [2, 2, 1, 0, 0], // Diagonal ascendiente quebrada
  [1, 0, 1, 2, 1], // Zig-zag medio-arriba-abajo
  [1, 2, 1, 0, 1]  // Zig-zag medio-abajo-arriba
];

export default function Slots() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('90'); // 90 / 9 líneas = $10 por línea
  const [isSpinning, setIsSpinning] = useState(false);
  const [grid, setGrid] = useState([
    ['cherry', 'lemon', 'orange', 'seven', 'grape'],
    ['bell', 'orange', 'plum', 'star', 'melon'],
    ['seven', 'grape', 'cherry', 'bell', 'star']
  ]);
  const [winningLines, setWinningLines] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [spinCompleted, setSpinCompleted] = useState(false);
  const [error, setError] = useState('');
  const [activeLineGlow, setActiveLineGlow] = useState(null); // Índice de línea a iluminar

  // Bucle de animación para las líneas ganadoras
  useEffect(() => {
    if (winningLines.length === 0 || isSpinning) {
      setActiveLineGlow(null);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      setActiveLineGlow(winningLines[current].lineIndex);
      current = (current + 1) % winningLines.length;
    }, 1500);

    return () => clearInterval(interval);
  }, [winningLines, isSpinning]);

  const handleSpin = async (e) => {
    e.preventDefault();
    if (isSpinning) return;
    
    setError('');
    setIsSpinning(true);
    setSpinCompleted(false);
    setWinningLines([]);
    setPayoutAmount(0);

    try {
      const betVal = parseFloat(betAmount);
      if (betVal <= 0) throw new Error('Monto de apuesta inválido');

      const res = await fetch(`${BACKEND_URL}/api/games/slots/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ betAmount: betVal })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en el giro');

      // 1. Simular animación del giro (swapping de símbolos de forma aleatoria)
      const symbolKeys = Object.keys(SYMBOL_EMOJIS);
      let spinTime = 0;
      const spinInterval = setInterval(() => {
        setGrid(prevGrid => 
          prevGrid.map(row => 
            row.map(() => symbolKeys[Math.floor(Math.random() * symbolKeys.length)])
          )
        );
        spinTime += 100;
        if (spinTime >= 1500) {
          clearInterval(spinInterval);
          
          // 2. Establecer la grilla final devuelta por el servidor
          setGrid(data.grid);
          setIsSpinning(false);
          setSpinCompleted(true);
          setWinningLines(data.winningLines);
          setPayoutAmount(data.payoutAmount);

          // 3. Fuego de artificio si ganó
          if (data.win && data.payoutAmount > 0) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.75 },
              colors: ['#ffd700', '#ff0055', '#ffffff']
            });
          }

          refreshBalance();
        }
      }, 100);

    } catch (err) {
      setError(err.message);
      setIsSpinning(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.5fr',
      gap: '32px',
      maxWidth: '950px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out',
      flexWrap: 'wrap'
    }}>
      
      {/* PANEL DE APUESTA LATERAL */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins style={{ color: 'var(--gold)' }} /> Slots (Tragamonedas)
        </h2>

        {error && (
          <div style={{ color: '#ff5252', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSpin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Apuesta Total ($)
            </label>
            <input 
              type="number"
              className="input-field"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isSpinning}
              min="9" // Mínimo de 9 para $1 por línea
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Dividido en 9 líneas de pago (${(betAmount / 9).toFixed(2)} por línea)
            </span>
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }} disabled={isSpinning}>
            {isSpinning ? 'Girando...' : 'GIRAR'}
          </button>
        </form>

        {/* Resumen del Giro */}
        {spinCompleted && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            borderRadius: '12px',
            background: payoutAmount > 0 ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255,255,255,0.02)',
            border: payoutAmount > 0 ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255,255,255,0.05)'
          }}>
            {payoutAmount > 0 ? (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>¡FELICIDADES!</span>
                <h3 style={{ color: 'var(--green)', fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Trophy size={20} /> +${payoutAmount.toFixed(2)}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Ganaste en {winningLines.length} líneas
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Suerte en el próximo giro</span>
            )}
          </div>
        )}

        {/* Líneas de Pago */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Líneas de Pago Ganadoras:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {winningLines.map((wl, idx) => (
              <span 
                key={idx} 
                className="badge" 
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  color: 'var(--gold)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  fontSize: '0.75rem'
                }}
              >
                Línea {wl.lineIndex + 1} ({SYMBOL_EMOJIS[wl.symbol]} x{wl.matchCount})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MÁQUINA DE SLOTS */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Marco Neon */}
        <div style={{
          position: 'relative',
          padding: '16px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #101024, #1c1c38)',
          boxShadow: activeLineGlow !== null 
            ? `0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 20px rgba(138, 43, 226, 0.2)`
            : `0 8px 30px rgba(0, 0, 0, 0.6)`,
          border: '4px solid #1a1a3a',
          width: '100%',
          maxWidth: '560px'
        }}>
          {/* Rodillos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            backgroundColor: '#05050f',
            borderRadius: '16px',
            padding: '12px',
            overflow: 'hidden'
          }}>
            {Array(5).fill(0).map((_, colIdx) => (
              <div 
                key={colIdx} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  // Animación de rotación falsa por CSS si está girando
                  transform: isSpinning ? 'translateY(5px)' : 'none',
                  transition: 'transform 0.1s ease'
                }}
              >
                {Array(3).fill(0).map((_, rowIdx) => {
                  const symbol = grid[rowIdx][colIdx];
                  const isWinningCell = winningLines.some(wl => 
                    wl.lineIndex === activeLineGlow && LINE_COORDINATES[wl.lineIndex][colIdx] === rowIdx
                  );

                  return (
                    <div 
                      key={rowIdx}
                      style={{
                        height: '90px',
                        borderRadius: '12px',
                        background: isWinningCell 
                          ? SYMBOL_COLORS[symbol] 
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isWinningCell 
                          ? '2px solid var(--gold)' 
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        transition: 'all 0.3s ease',
                        boxShadow: isWinningCell ? '0 0 15px rgba(255, 215, 0, 0.2)' : 'none',
                        // Animación de rebote al frenar
                        animation: spinCompleted ? 'bounce 0.3s ease-out' : 'none'
                      }}
                    >
                      {SYMBOL_EMOJIS[symbol]}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Superposiciones de Líneas de Pago */}
          {activeLineGlow !== null && (
            <div style={{
              position: 'absolute',
              top: 'calc(16px + 12px)',
              left: 'calc(16px + 12px)',
              right: 'calc(16px + 12px)',
              bottom: 'calc(16px + 12px)',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              {/* Dibujar línea SVG de pago encima */}
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={
                    LINE_COORDINATES[activeLineGlow].map((row, col) => {
                      const x = 10 + col * 20; // 10, 30, 50, 70, 90
                      const y = 16.6 + row * 33.3; // Fila 0 = 16.6, 1 = 50, 2 = 83.3
                      return `${x},${y}`;
                    }).join(' ')
                  }
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  style={{
                    filter: 'drop-shadow(0 0 3px var(--gold-glow))',
                    animation: 'dash 1s linear infinite'
                  }}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Tablas de Premios de Ayuda */}
        <div style={{
          marginTop: '24px',
          width: '100%',
          maxWidth: '560px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div className="glass-panel" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--gold)', display: 'block', marginBottom: '6px' }}>💎 Símbolos Altas Premiaciones</span>
            <p>💎 Siete/Diamante: Paga hasta 1000x</p>
            <p>⭐ Estrella: Paga hasta 500x</p>
            <p>🔔 Campana: Paga hasta 200x</p>
          </div>
          <div className="glass-panel" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--cyan)', display: 'block', marginBottom: '6px' }}>🍒 Frutas (Premios Comunes)</span>
            <p>🍉 Sandía / 🍇 Uva: Paga hasta 100x</p>
            <p>🍊 Naranja / 🍋 Limón: Paga hasta 25x</p>
            <p>🍒 Cereza: Paga hasta 15x</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
        @keyframes bounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}} />

    </div>
  );
}
