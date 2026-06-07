import React, { useState, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Bomb, Gem, Coins, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Mines() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  const [minesCount, setMinesCount] = useState('3');
  
  // Estados de Partida
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealedCells, setRevealedCells] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [board, setBoard] = useState(null); // Tablero revelado al final de la partida [0 = gema, 1 = mina]
  const [gameStatus, setGameStatus] = useState(''); // 'won', 'lost', ''
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Iniciar Juego
  const startNewGame = async (e) => {
    e.preventDefault();
    setError('');
    setBoard(null);
    setGameStatus('');
    setRevealedCells([]);
    setCurrentMultiplier(1.0);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/mines/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          betAmount: parseFloat(betAmount),
          minesCount: parseInt(minesCount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar partida');

      setIsPlaying(true);
      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Revelar Celda
  const handleCellClick = async (cellIndex) => {
    if (!isPlaying || loading || revealedCells.includes(cellIndex)) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/mines/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cellIndex })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al revelar celda');

      if (data.hitMine) {
        // Explotó una mina (Derrota)
        setIsPlaying(false);
        setGameStatus('lost');
        setBoard(data.board);
        refreshBalance();
      } else if (data.autoCashout) {
        // Completó todas las gemas (Victoria Automática)
        setIsPlaying(false);
        setGameStatus('won');
        setBoard(data.board);
        setCurrentMultiplier(data.multiplier);
        triggerConfetti();
        refreshBalance();
      } else {
        // Gema descubierta (Continúa el juego)
        setRevealedCells(data.revealedCells);
        setCurrentMultiplier(data.currentMultiplier);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Retirar Dinero (Cashout)
  const handleCashout = async () => {
    if (!isPlaying || loading || revealedCells.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/mines/cashout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al retirar ganancias');

      setIsPlaying(false);
      setGameStatus('won');
      setBoard(data.board);
      triggerConfetti();
      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Disparar Animación de Victoria
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#8a2be2', '#00ffff', '#ffffff']
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.5fr',
      gap: '32px',
      maxWidth: '900px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out',
      flexWrap: 'wrap'
    }}>
      
      {/* PANEL DE CONTROL LATERAL */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bomb style={{ color: 'var(--gold)' }} /> Mines (Minas)
        </h2>

        {error && (
          <div style={{ color: '#ff5252', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={startNewGame} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Monto a Apostar ($)
            </label>
            <input 
              type="number"
              className="input-field"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlaying}
              min="10"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Cantidad de Minas (1-24)
            </label>
            <input 
              type="number"
              className="input-field"
              value={minesCount}
              onChange={(e) => setMinesCount(e.target.value)}
              disabled={isPlaying}
              min="1"
              max="24"
              required
            />
          </div>

          {!isPlaying ? (
            <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              Comenzar Partida
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,215,0,0.05)',
                border: '1px solid rgba(255,215,0,0.2)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multiplicador Actual</span>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--gold)' }}>{currentMultiplier}x</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--green)', fontWeight: 'bold' }}>
                  Ganancia: ${(betAmount * currentMultiplier).toFixed(2)}
                </span>
              </div>

              <button 
                type="button" 
                className="btn-violet" 
                onClick={handleCashout} 
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--green), #00a850)', color: 'white' }}
                disabled={revealedCells.length === 0 || loading}
              >
                <Trophy size={16} /> Retirar Ganancias
              </button>
            </div>
          )}
        </form>

        {/* REGLAS RÁPIDAS */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <p style={{ marginBottom: '6px' }}>✔️ Cada gema aumenta tu multiplicador.</p>
          <p style={{ marginBottom: '6px' }}>✔️ Puedes retirar tus ganancias en cualquier momento.</p>
          <p>❌ Si tocas una mina, ¡pierdes toda la apuesta!</p>
        </div>
      </div>

      {/* GRILLA DEL JUEGO */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Cartel de resultado */}
        {gameStatus === 'won' && (
          <div className="glass-panel" style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '2px solid var(--green)',
            color: 'var(--green)',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center',
            fontSize: '1.1rem'
          }}>
            🎉 ¡Ganaste ${(betAmount * currentMultiplier).toFixed(2)}! ({currentMultiplier}x)
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="glass-panel" style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '2px solid var(--red)',
            color: 'var(--red)',
            fontWeight: 'bold',
            marginBottom: '16px',
            textAlign: 'center',
            fontSize: '1.1rem'
          }}>
            💥 ¡Explotaste! Perdiste ${betAmount}
          </div>
        )}

        {/* Tablero de 5x5 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: '10px',
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1',
          padding: '16px',
          borderRadius: '20px',
          backgroundColor: '#0c0c16',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {Array(25).fill(0).map((_, idx) => {
            const isRevealed = revealedCells.includes(idx);
            
            // Determinar contenido visual si el juego terminó
            let cellContent = null;
            let cellBg = 'rgba(255, 255, 255, 0.03)';
            let cursorStyle = isPlaying ? 'pointer' : 'default';
            let borderStyle = '1px solid rgba(255, 255, 255, 0.08)';

            if (isRevealed) {
              cellBg = 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(0,229,255,0.2))';
              borderStyle = '1.5px solid var(--cyan)';
              cellContent = <Gem size={28} style={{ color: 'var(--cyan)', filter: 'drop-shadow(0 0 8px var(--cyan-glow))' }} />;
            } else if (board) {
              // Juego terminado: revelar todo
              const isMine = board[idx] === 1;
              if (isMine) {
                cellBg = 'rgba(255, 23, 68, 0.2)';
                borderStyle = '1.5px solid var(--red)';
                cellContent = <Bomb size={28} style={{ color: 'var(--red)', filter: 'drop-shadow(0 0 8px rgba(255,23,68,0.4))' }} />;
              } else {
                cellBg = 'rgba(255,255,255,0.01)';
                cellContent = <Gem size={20} style={{ color: 'rgba(0, 229, 255, 0.3)' }} />;
              }
            } else if (isPlaying) {
              cellBg = '#14142b';
              // Hover activo por CSS en inline
            }

            return (
              <div 
                key={idx}
                onClick={() => handleCellClick(idx)}
                style={{
                  background: cellBg,
                  border: borderStyle,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: cursorStyle,
                  transition: 'all 0.15s ease',
                  boxShadow: isRevealed ? '0 0 15px rgba(0, 229, 255, 0.2)' : 'none'
                }}
                className={isPlaying && !isRevealed ? 'mines-cell-active' : ''}
              >
                {cellContent}
              </div>
            );
          })}
        </div>

        {/* Regla CSS temporal para el hover del tablero */}
        <style dangerouslySetInnerHTML={{__html: `
          .mines-cell-active:hover {
            background-color: #202046 !important;
            transform: scale(1.05);
            border-color: var(--violet) !important;
            box-shadow: 0 0 10px var(--violet-glow);
          }
        `}} />
      </div>

    </div>
  );
}
