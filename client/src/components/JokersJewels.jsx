import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Sparkles, Play, Volume2, VolumeX, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

// Mapeo de símbolos a emojis y colores
const SYMBOL_MAP = {
  joker: { char: '🃏', color: '#ffd700', name: 'Joker' },
  crown: { char: '👑', color: '#41f1b6', name: 'Corona' },
  lute: { char: '🪕', color: '#ff7782', name: 'Laúd' },
  shoes: { char: '🥿', color: '#8a2be2', name: 'Zapatos' },
  clubs: { char: '🪄', color: '#00e5ff', name: 'Clavas' },
  gem_red: { char: '🔴', color: '#ff1744', name: 'Gema Roja' },
  gem_blue: { char: '🔵', color: '#2979ff', name: 'Gema Azul' },
  gem_cyan: { char: '💎', color: '#00e5ff', name: 'Diamante' }
};

export default function JokersJewels() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cuadrícula de 3x5 (3 filas, 5 columnas)
  const [grid, setGrid] = useState([
    ['gem_cyan', 'gem_blue', 'gem_red', 'clubs', 'shoes'],
    ['joker', 'crown', 'lute', 'joker', 'crown'],
    ['gem_red', 'gem_cyan', 'gem_blue', 'shoes', 'clubs']
  ]);

  const [spinningReels, setSpinningReels] = useState([false, false, false, false, false]);
  const [winAmount, setWinAmount] = useState(0);
  const [winningPaylines, setWinningPaylines] = useState([]);
  const [winningScatters, setWinningScatters] = useState([]);
  const [error, setError] = useState('');

  // Sintetizador de audio retro usando Web Audio API
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'spin') {
        // Sonido de rodillo girando (onda de frecuencia decreciente rápida)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'stop') {
        // Sonido mecánico de parada de rodillo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        // Melodía triunfal de victoria
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Acorde mayor
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.08 + 0.3);
          
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
      } else if (type === 'scatter') {
        // Sonido ascendente de campana para Scatter
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.1, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
          
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.2);
        });
      }
    } catch (e) {
      console.warn("Web Audio API blocked or not supported:", e);
    }
  };

  const handleSpin = async (e) => {
    e.preventDefault();
    if (isPlaying) return;

    setError('');
    setWinAmount(0);
    setWinningPaylines([]);
    setWinningScatters([]);
    setIsPlaying(true);
    
    // Iniciar el giro visual de los 5 rodillos
    setSpinningReels([true, true, true, true, true]);
    playSound('spin');

    // Intervalo de simulación visual durante el spin
    const interval = setInterval(() => {
      setGrid(prev => {
        const symbolKeys = Object.keys(SYMBOL_MAP);
        return prev.map(row => 
          row.map(() => symbolKeys[Math.floor(Math.random() * symbolKeys.length)])
        );
      });
    }, 60);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/jokers-jewels/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ betAmount: parseFloat(betAmount) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el giro.');

      // Detener rodillos secuencialmente (de izquierda a derecha)
      setTimeout(() => {
        clearInterval(interval);
        
        // Detener rodillo por rodillo
        const stopReel = (colIdx) => {
          setSpinningReels(prev => {
            const next = [...prev];
            next[colIdx] = false;
            return next;
          });
          playSound('stop');

          // Cargar las filas del rodillo detenido desde la respuesta del servidor
          setGrid(prev => {
            const nextGrid = [...prev];
            for (let r = 0; r < 3; r++) {
              nextGrid[r][colIdx] = data.grid[r][colIdx];
            }
            return nextGrid;
          });

          if (colIdx < 4) {
            setTimeout(() => stopReel(colIdx + 1), 150);
          } else {
            // Todos los rodillos se han detenido
            processFinalResult(data);
          }
        };

        stopReel(0);

      }, 1000);

    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setSpinningReels([false, false, false, false, false]);
      setIsPlaying(false);
    }
  };

  const processFinalResult = (data) => {
    setWinAmount(data.payoutAmount);
    setIsPlaying(false);
    refreshBalance();

    if (data.winningLines && data.winningLines.length > 0) {
      setWinningPaylines(data.winningLines.map(l => l.lineIndex));
      playSound('win');
    }

    if (data.scatterWins && data.scatterWins.length > 0) {
      setWinningScatters(data.scatterWins.map(s => s.symbol));
      playSound('scatter');
    }

    if (data.payoutAmount >= parseFloat(betAmount) * 5) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#dbbd4e', '#ffffff', '#8a2be2']
      });
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 1.8fr',
      gap: '32px',
      maxWidth: '1000px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out',
      flexWrap: 'wrap'
    }}>
      
      {/* SECCIÓN IZQUIERDA: PANEL DE CONTROL Y TABLA DE PAGOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* PANEL DE CONTROL */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(219, 189, 78, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🃏 Joker's Jewels
            </h2>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn-outline"
              style={{ padding: '6px', minWidth: 'auto', borderRadius: '8px' }}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
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
                disabled={isPlaying}
                min="10"
                step="5"
                required
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {['50', '100', '200', '500', '1000'].map(val => (
                  <button 
                    key={val}
                    type="button" 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }} 
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
              style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 'bold' }} 
              disabled={isPlaying}
            >
              {isPlaying ? 'GIRANDO...' : '¡GIRAR (SPIN)!'}
            </button>
          </form>
        </div>

        {/* TABLA DE PREMIOS (PAYTABLE) */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', fontSize: '0.8rem' }}>
          <h3 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> Tabla de Pagos (Multiplicadores)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>🃏 Joker (Cualquier posición - Scatter)</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>5: 1000x | 4: 200x | 3: 20x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>👑 Corona (Cualquier posición - Scatter)</span>
              <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>5: 250x | 4: 50x | 3: 10x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>🪕 Laúd (Línea de pago)</span>
              <span style={{ color: 'white' }}>5: 200x | 4: 40x | 3: 10x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>🥿 Zapatos de Bufón (Línea)</span>
              <span style={{ color: 'white' }}>5: 200x | 4: 40x | 3: 10x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>🪄 Clavas de Bufón (Línea)</span>
              <span style={{ color: 'white' }}>5: 200x | 4: 40x | 3: 10x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
              <span>Gemas (🔴 🔵 💎) (Línea)</span>
              <span style={{ color: 'white' }}>5: 40x | 4: 10x | 3: 4x</span>
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            * Las ganancias de líneas se multiplican por la apuesta de línea (apuesta total / 5). Las de Scatter se multiplican por la apuesta total.
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA: GABINETE DE CASINO Y RODILLOS */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        borderRadius: '24px', 
        background: 'linear-gradient(180deg, #180d26 0%, #0c0614 100%)',
        border: '3px solid #dbbd4e', // dorado brillante como borde de gabinete físico
        boxShadow: '0 0 30px rgba(219, 189, 78, 0.2), inset 0 0 20px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        {/* Pantalla Superior del Gabinete */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: '1.6rem', 
            fontWeight: '900', 
            color: '#dbbd4e',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(219, 189, 78, 0.4)'
          }}>
            🤡 Joker's Jewels 🤡
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>5 LÍNEAS DE PAGO FIJAS</span>
        </div>

        {/* Rodillos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          width: '100%',
          background: '#09040e',
          padding: '16px',
          borderRadius: '16px',
          border: '2px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9)'
        }}>
          {[0, 1, 2, 3, 4].map(colIdx => {
            const isReelSpinning = spinningReels[colIdx];
            return (
              <div 
                key={colIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: '#120b1e',
                  border: '1px solid rgba(219, 189, 78, 0.1)',
                  borderRadius: '12px',
                  padding: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '240px',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                }}
              >
                {/* Visualizador de símbolos del rodillo */}
                {[0, 1, 2].map(rowIdx => {
                  const symId = grid[rowIdx][colIdx];
                  const symInfo = SYMBOL_MAP[symId] || { char: '❓', color: 'white', name: 'Desconocido' };
                  
                  // Verificar si este símbolo pertenece a un Scatter ganador o una línea ganadora
                  const isScatterWinner = winningScatters.includes(symId);
                  const isWinner = isScatterWinner || winAmount > 0; // resaltamos en victoria por defecto
                  
                  return (
                    <div 
                      key={rowIdx}
                      style={{
                        fontSize: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '64px',
                        width: '64px',
                        borderRadius: '10px',
                        background: isWinner ? 'rgba(219, 189, 78, 0.08)' : 'transparent',
                        border: isWinner ? '1.5px solid #dbbd4e' : '1px solid transparent',
                        boxShadow: isWinner ? '0 0 12px rgba(219, 189, 78, 0.2)' : 'none',
                        transition: 'all 0.15s ease',
                        animation: isReelSpinning ? 'blurSpin 0.1s infinite linear' : isWinner ? 'pulseWin 1.5s infinite alternate' : 'none'
                      }}
                      title={symInfo.name}
                    >
                      {symInfo.char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Marcador de Premios inferior */}
        {winAmount > 0 ? (
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '12px 32px',
            background: 'rgba(65, 241, 182, 0.08)',
            border: '2px solid var(--green)',
            borderRadius: '14px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--green)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
              ¡Victoria!
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esperando lanzamiento</span>
            <h2 style={{ fontSize: '1.25rem', color: 'white', marginTop: '4px', fontWeight: 'bold' }}>
              Gira para ganar
            </h2>
          </div>
        )}
      </div>

      {/* Reglas CSS de Animación */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blurSpin {
          0% { filter: blur(4px); transform: translateY(-5px); }
          50% { filter: blur(6px); transform: translateY(5px); }
          100% { filter: blur(4px); transform: translateY(-5px); }
        }
        @keyframes pulseWin {
          0% { transform: scale(1); border-color: #dbbd4e; box-shadow: 0 0 10px rgba(219, 189, 78, 0.2); }
          100% { transform: scale(1.05); border-color: #ffd700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
        }
      `}} />

    </div>
  );
}
