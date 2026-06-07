import React, { useState, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Disc, Trash2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

// Lista ordenada de la ruleta europea para el giro de la rueda
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const NUMBER_COLORS = {
  0: 'green',
  1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black',
  7: 'red', 8: 'black', 9: 'red', 10: 'black', 11: 'black', 12: 'red',
  13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
  19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black',
  25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
  31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

export default function Roulette() {
  const { token, refreshBalance } = useContext(AuthContext);
  
  // Estado de fichas y apuestas
  const [selectedChip, setSelectedChip] = useState(100); // Ficha activa ($100, $500, etc.)
  const [activeBets, setActiveBets] = useState({}); // clave: 'red', '17', etc., valor: monto apostado
  
  // Estado del giro
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [rolledNumber, setRolledNumber] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [spinCompleted, setSpinCompleted] = useState(false);
  const [error, setError] = useState('');

  // Colocar apuesta en una zona
  const handlePlaceBet = (zone) => {
    if (isSpinning) return;
    setError('');
    setActiveBets(prev => {
      const currentBet = prev[zone] || 0;
      return {
        ...prev,
        [zone]: currentBet + selectedChip
      };
    });
  };

  // Limpiar apuestas
  const clearBets = () => {
    if (isSpinning) return;
    setActiveBets({});
    setError('');
    setSpinCompleted(false);
  };

  // Realizar Giro
  const handleSpin = async () => {
    if (isSpinning) return;
    
    const betKeys = Object.keys(activeBets);
    if (betKeys.length === 0) {
      setError('Debes colocar al menos una ficha en el paño.');
      return;
    }

    setIsSpinning(true);
    setSpinCompleted(false);
    setError('');

    // Estructurar apuestas para la API
    const formattedBets = betKeys.map(key => {
      const amount = activeBets[key];
      if (['red', 'black', 'even', 'odd', 'dozen1', 'dozen2', 'dozen3'].includes(key)) {
        return { type: key, amount };
      } else {
        return { type: 'number', value: parseInt(key), amount };
      }
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/roulette/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bets: formattedBets })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar apuestas');

      // Animación de la Ruleta
      const targetNumber = data.rolledNumber;
      const numberIndex = WHEEL_NUMBERS.indexOf(targetNumber);
      const degreePerNumber = 360 / 37;
      
      // Calcular rotación para detenerse en el número (en sentido antihorario de la rueda)
      const baseSpins = 5 * 360; // 5 giros completos
      const targetRotation = baseSpins + (360 - (numberIndex * degreePerNumber));
      
      setWheelRotation(targetRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setSpinCompleted(true);
        setRolledNumber(targetNumber);
        setPayoutAmount(data.payoutAmount);

        if (data.win && data.payoutAmount > 0) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#00e676', '#ffd700', '#ffffff']
          });
        }
        
        refreshBalance();
      }, 4000); // 4 segundos de giro

    } catch (err) {
      setError(err.message);
      setIsSpinning(false);
    }
  };

  const totalBet = Object.values(activeBets).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.5fr',
      gap: '32px',
      maxWidth: '1100px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out',
      flexWrap: 'wrap'
    }}>
      
      {/* SECCIÓN IZQUIERDA: RULETA FÍSICA Y CONTROLES */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        
        {/* Ruleta Animada */}
        <div style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '10px solid #1c1c30',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(138,43,226,0.15)',
          overflow: 'hidden',
          background: '#0c0c16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Rueda interna que gira */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #0e0e0e 0%, #1a1a1a 100%)',
            position: 'absolute',
            transform: `rotate(-${wheelRotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.25, 1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Divisiones y números */}
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              {WHEEL_NUMBERS.map((num, i) => {
                const angle = (i * 360) / 37;
                const rad = (angle * Math.PI) / 180;
                const x = 50 + 40 * Math.sin(rad);
                const y = 50 - 40 * Math.cos(rad);
                
                const color = NUMBER_COLORS[num] === 'red' ? '#ff1744' : NUMBER_COLORS[num] === 'black' ? '#121212' : '#00e676';

                return (
                  <g key={num} transform={`rotate(${angle}, 50, 50)`}>
                    <line x1="50" y1="50" x2="50" y2="8" stroke="#3a3a55" strokeWidth="0.5" />
                    <text 
                      x="50" 
                      y="15" 
                      fontSize="4.5" 
                      fontWeight="bold"
                      fill={color} 
                      textAnchor="middle" 
                      transform={`rotate(180, 50, 15)`}
                    >
                      {num}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: '#121224',
              border: '4px solid #1e1e38',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
              position: 'absolute',
              zIndex: 2
            }} />
          </div>

          {/* Flecha indicadora de bola en el tope */}
          <div style={{
            position: 'absolute',
            top: '8px',
            zIndex: 10,
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '16px solid var(--gold)',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))'
          }} />

          {/* Bola de la Ruleta (Aparece girando) */}
          {isSpinning && (
            <div style={{
              position: 'absolute',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 8px #ffffff',
              top: '24px',
              left: '50%',
              marginLeft: '-7px',
              transformOrigin: '7px 116px',
              animation: 'spinBall 2s linear infinite',
              zIndex: 5
            }} />
          )}

          {/* Centro / Número Ganador */}
          <div style={{
            position: 'absolute',
            zIndex: 12,
            textAlign: 'center'
          }}>
            {spinCompleted && rolledNumber !== null ? (
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: NUMBER_COLORS[rolledNumber] === 'red' ? 'var(--red)' : NUMBER_COLORS[rolledNumber] === 'black' ? '#1a1a2e' : 'var(--green)',
                color: 'white',
                fontSize: '1.6rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                border: '2px solid var(--gold)'
              }}>
                {rolledNumber}
              </div>
            ) : (
              <Disc size={36} className={isSpinning ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
        </div>

        {/* FICHAS PARA APUESTA */}
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
          {[10, 50, 100, 500, 1000].map(val => (
            <button 
              key={val} 
              onClick={() => setSelectedChip(val)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: selectedChip === val ? '3px solid var(--gold)' : '2px dashed rgba(255,255,255,0.2)',
                background: val === 10 ? '#ff1744' : val === 50 ? '#00e5ff' : val === 100 ? '#8a2be2' : val === 500 ? '#ff9100' : '#00e676',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                transform: selectedChip === val ? 'scale(1.1)' : 'none',
                boxShadow: selectedChip === val ? '0 0 10px rgba(255,215,0,0.4)' : 'none'
              }}
            >
              ${val}
            </button>
          ))}
        </div>

        {/* CONTROLES DE GIRO */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Apuesta Total: <strong style={{ color: 'var(--gold)' }}>${totalBet}</strong></span>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-outline" onClick={clearBets} style={{ flex: 1, padding: '10px' }} disabled={isSpinning}>
              <Trash2 size={14} /> Limpiar
            </button>
            <button className="btn-gold" onClick={handleSpin} style={{ flex: 1.5, padding: '10px' }} disabled={isSpinning || totalBet === 0}>
              Girar Ruleta
            </button>
          </div>

          {spinCompleted && (
            <div style={{
              textAlign: 'center',
              padding: '10px',
              borderRadius: '8px',
              background: payoutAmount > 0 ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255,255,255,0.02)',
              border: payoutAmount > 0 ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255,255,255,0.05)',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {payoutAmount > 0 ? (
                <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Trophy size={14} /> ¡Ganaste +${payoutAmount.toFixed(2)}!
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Suerte en el próximo giro</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: EL PAÑO DE APUESTAS */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'white' }}>El Paño de Apuestas</h3>
        
        {/* Grilla de Números 0 a 36 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px' }}>
          
          {/* Cero */}
          <div 
            onClick={() => handlePlaceBet('0')}
            style={{
              background: 'var(--green)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              border: activeBets['0'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
              position: 'relative'
            }}
          >
            0
            {activeBets['0'] && (
              <span className="badge" style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: 'var(--gold)',
                color: 'black',
                fontSize: '0.65rem',
                padding: '3px 6px'
              }}>${activeBets['0']}</span>
            )}
          </div>

          {/* Grilla 1-36 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '6px'
          }}>
            {Array(36).fill(0).map((_, idx) => {
              const num = idx + 1;
              const color = NUMBER_COLORS[num] === 'red' ? 'var(--red)' : '#1a1a2e';
              const isBetPlaced = activeBets[num.toString()];

              return (
                <div 
                  key={num}
                  onClick={() => handlePlaceBet(num.toString())}
                  style={{
                    background: color,
                    height: '42px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    border: isBetPlaced ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    transition: 'var(--transition)'
                  }}
                  className="paño-cell"
                >
                  {num}
                  {isBetPlaced && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      backgroundColor: 'var(--gold)',
                      color: 'black',
                      fontSize: '0.55rem',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      padding: '1px 3px'
                    }}>${isBetPlaced}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Apuestas Externas / Especiales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {/* Docenas */}
          <div 
            onClick={() => handlePlaceBet('dozen1')}
            className="glass-panel paño-special"
            style={{ border: activeBets['dozen1'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            1ra Doz (1-12)
            {activeBets['dozen1'] && <span className="chip-indicator">${activeBets['dozen1']}</span>}
          </div>
          <div 
            onClick={() => handlePlaceBet('dozen2')}
            className="glass-panel paño-special"
            style={{ border: activeBets['dozen2'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            2da Doz (13-24)
            {activeBets['dozen2'] && <span className="chip-indicator">${activeBets['dozen2']}</span>}
          </div>
          <div 
            onClick={() => handlePlaceBet('dozen3')}
            className="glass-panel paño-special"
            style={{ border: activeBets['dozen3'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            3ra Doz (25-36)
            {activeBets['dozen3'] && <span className="chip-indicator">${activeBets['dozen3']}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {/* Rojo/Negro Par/Impar */}
          <div 
            onClick={() => handlePlaceBet('even')}
            className="glass-panel paño-special"
            style={{ border: activeBets['even'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            Par
            {activeBets['even'] && <span className="chip-indicator">${activeBets['even']}</span>}
          </div>
          <div 
            onClick={() => handlePlaceBet('red')}
            className="glass-panel paño-special"
            style={{ 
              background: 'rgba(255, 23, 68, 0.15)', 
              color: 'var(--red)', 
              fontWeight: 'bold',
              border: activeBets['red'] ? '2px solid var(--gold)' : '1px solid rgba(255,23,68,0.3)'
            }}
          >
            Rojo
            {activeBets['red'] && <span className="chip-indicator">${activeBets['red']}</span>}
          </div>
          <div 
            onClick={() => handlePlaceBet('black')}
            className="glass-panel paño-special"
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              color: 'white', 
              fontWeight: 'bold',
              border: activeBets['black'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Negro
            {activeBets['black'] && <span className="chip-indicator">${activeBets['black']}</span>}
          </div>
          <div 
            onClick={() => handlePlaceBet('odd')}
            className="glass-panel paño-special"
            style={{ border: activeBets['odd'] ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            Impar
            {activeBets['odd'] && <span className="chip-indicator">${activeBets['odd']}</span>}
          </div>
        </div>

        {/* Reglas CSS locales */}
        <style dangerouslySetInnerHTML={{__html: `
          .paño-cell:hover {
            transform: scale(1.05);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
          }
          .paño-special {
            padding: 12px;
            text-align: center;
            cursor: pointer;
            font-size: 0.85rem;
            position: relative;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .paño-special:hover {
            background-color: rgba(255,255,255,0.03);
          }
          .chip-indicator {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: var(--gold);
            color: black;
            font-size: 0.6rem;
            padding: 2px 4px;
            border-radius: 4px;
            font-weight: bold;
          }
          @keyframes spinBall {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>

    </div>
  );
}
