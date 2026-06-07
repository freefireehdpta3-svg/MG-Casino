import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import io from 'socket.io-client';
import { Rocket, Trophy, Play, Users, UsersRound } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Crash() {
  const { token, refreshBalance, user } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  
  // Estados del juego
  const [status, setStatus] = useState('betting'); // 'betting', 'flying', 'crashed'
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(6);
  const [activeBets, setActiveBets] = useState([]);
  const [myBet, setMyBet] = useState(null); // { amount, cashedOut: boolean, payoutMultiplier?: number }
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [socket, setSocket] = useState(null);

  // Historial de últimos multiplicadores
  const [historyList, setHistoryList] = useState([1.5, 3.2, 1.0, 12.4, 2.1, 5.0, 1.88, 14.5].reverse());

  const canvasRef = useRef(null);

  // Conectar WebSocket
  useEffect(() => {
    const s = io(BACKEND_URL);
    setSocket(s);

    s.on('crash_state', (data) => {
      setStatus(data.status);
      setMultiplier(data.multiplier);
      setCountdown(data.countdown);
      setActiveBets(data.bets || []);

      // Verificar si yo ya tengo apuesta activa en memoria del servidor
      if (user) {
        const found = data.bets.find(b => b.userId === user.id);
        if (found) {
          setMyBet({
            amount: found.amount,
            cashedOut: found.cashedOut,
            payoutMultiplier: found.multiplier
          });
        }
      }
    });

    s.on('crash_betting', (data) => {
      setStatus('betting');
      setCountdown(data.countdown);
      setMultiplier(1.00);
      setActiveBets([]);
      setMyBet(null);
      setError('');
      setSuccessMsg('');
    });

    s.on('crash_countdown', (data) => {
      setCountdown(data.countdown);
    });

    s.on('crash_flying_start', (data) => {
      setStatus('flying');
      setMultiplier(1.00);
      setActiveBets(data.bets || []);
    });

    s.on('crash_tick', (data) => {
      setMultiplier(data.multiplier);
    });

    s.on('crash_crashed', (data) => {
      setStatus('crashed');
      setMultiplier(data.crashPoint);
      setMyBet(null);
      
      // Agregar al historial local de rondas
      setHistoryList(prev => [data.crashPoint, ...prev.slice(0, 7)]);
      
      // Actualizar el saldo
      refreshBalance();
    });

    s.on('crash_new_bet', (newBet) => {
      setActiveBets(prev => [...prev, newBet]);
    });

    s.on('crash_cashout_success', (data) => {
      // Actualizar lista de apuestas
      setActiveBets(prev => prev.map(b => {
        if (b.userId === data.userId) {
          return { ...b, cashedOut: true, multiplier: data.multiplier, payout: data.payout };
        }
        return b;
      }));
    });

    s.on('crash_player_win', (data) => {
      // Yo gané
      setMyBet(prev => prev ? { ...prev, cashedOut: true, payoutMultiplier: data.multiplier } : null);
      setSuccessMsg(`¡Retiraste con éxito a ${data.multiplier}x! Ganaste $${data.payout}`);
      
      // Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#00e5ff', '#ffd700', '#ffffff']
      });

      refreshBalance();
    });

    s.on('crash_bet_success', (data) => {
      setMyBet({ amount: data.amount, cashedOut: false });
      refreshBalance();
    });

    s.on('crash_error', (data) => {
      setError(data.message);
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  // Dibujar curva en canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ajustar dimensiones
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (status === 'crashed') {
      // Pantalla de Crash
      ctx.fillStyle = 'rgba(255, 23, 68, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (status === 'flying') {
      // Dibujar línea de vuelo exponencial
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(0, 229, 255, 0.5)';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(30, canvas.height - 30);
      
      const flightDuration = Math.log(multiplier) / 0.065; // Duración estimada en base a la fórmula
      const maxTime = 12; // Eje X máximo de 12 segundos para la vista
      
      const points = [];
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const t = (flightDuration * i) / steps;
        const mult = Math.pow(Math.E, 0.065 * t);
        
        // Coordenadas en canvas
        const x = 30 + (t / maxTime) * (canvas.width - 80);
        const y = (canvas.height - 30) - ((mult - 1) / 5) * (canvas.height - 80); // Escala Y
        
        // Limitar coordenadas
        if (x < canvas.width && y > 10) {
          points.push({ x, y });
        }
      }

      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Rellenar área debajo de la curva
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.lineTo(points[points.length - 1].x, canvas.height - 30);
        ctx.lineTo(points[0].x, canvas.height - 30);
        ctx.closePath();
        ctx.fill();

        // Dibujar el Cohete en la punta
        const lastPoint = points[points.length - 1];
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [multiplier, status]);

  const placeBet = () => {
    if (!socket || status !== 'betting') return;
    setError('');
    socket.emit('crash_place_bet', { token, amount: parseFloat(betAmount) });
  };

  const cashout = () => {
    if (!socket || status !== 'flying') return;
    socket.emit('crash_cashout', { token });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: '24px',
      maxWidth: '1100px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* SECCIÓN IZQUIERDA: PANTALLA JUEGO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Historial de Multiplicadores */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {historyList.map((h, idx) => (
            <span 
              key={idx} 
              className="badge" 
              style={{
                backgroundColor: h >= 2.0 ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: h >= 2.0 ? 'var(--cyan)' : 'var(--text-secondary)',
                border: h >= 2.0 ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                minWidth: '55px',
                textAlign: 'center'
              }}
            >
              {parseFloat(h).toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Tablero / Canvas */}
        <div className="glass-panel" style={{
          height: '320px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0a0a14',
          border: '1px solid rgba(255,255,255,0.03)'
        }}>
          {/* Canvas de la curva */}
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

          {/* Estado de Cuenta Regresiva (Apostando) */}
          {status === 'betting' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Próxima Ronda En
              </span>
              <h1 style={{ fontSize: '3.5rem', color: 'var(--gold)', fontFamily: 'var(--font-display)', margin: '4px 0' }}>
                {countdown}s
              </h1>
              <div style={{
                width: '100px',
                height: '4px',
                backgroundColor: 'rgba(255,215,0,0.1)',
                margin: '8px auto',
                borderRadius: '2px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(countdown / 6) * 100}%`,
                  backgroundColor: 'var(--gold)',
                  transition: 'width 1s linear'
                }} />
              </div>
            </div>
          )}

          {/* Estado Volando */}
          {status === 'flying' && (
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10
            }}>
              <h1 style={{ 
                fontSize: '4.5rem', 
                color: 'white', 
                fontFamily: 'var(--font-display)',
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))'
              }}>
                {multiplier.toFixed(2)}x
              </h1>
            </div>
          )}

          {/* Estado Crashed */}
          {status === 'crashed' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--red)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                EL AVION SE ESTRELLÓ A
              </span>
              <h1 style={{ fontSize: '4rem', color: 'var(--red)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                {multiplier.toFixed(2)}x
              </h1>
            </div>
          )}
        </div>

        {/* Panel de Apuestas Propio */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}
          {successMsg && <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>{successMsg}</div>}

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Monto de Apuesta ($)
              </label>
              <input 
                type="number"
                className="input-field"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={status !== 'betting' || myBet}
              />
            </div>

            {status === 'betting' && (
              <button 
                onClick={placeBet} 
                className="btn-gold" 
                style={{ flex: 1.2, height: '48px', marginTop: '22px' }}
                disabled={myBet !== null}
              >
                {myBet ? 'Apuesta Realizada' : 'Realizar Apuesta'}
              </button>
            )}

            {status === 'flying' && (
              <button 
                onClick={cashout} 
                className="btn-violet" 
                style={{ 
                  flex: 1.2, 
                  height: '48px', 
                  marginTop: '22px',
                  background: 'linear-gradient(135deg, var(--green), #00a850)', 
                  boxShadow: '0 4px 15px rgba(0, 230, 118, 0.4)' 
                }}
                disabled={!myBet || myBet.cashedOut}
              >
                {!myBet ? (
                  'Esperando Siguiente Ronda'
                ) : myBet.cashedOut ? (
                  'Retirado'
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Retirar ${(myBet.amount * multiplier).toFixed(2)}
                  </span>
                )}
              </button>
            )}

            {status === 'crashed' && (
              <button 
                className="btn-outline" 
                style={{ flex: 1.2, height: '48px', marginTop: '22px', cursor: 'default' }}
                disabled
              >
                Avión Estrellado
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: APUESTAS DE LA RONDA */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '450px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UsersRound size={18} style={{ color: 'var(--cyan)' }} />
          Apuestas en Vivo
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto' }}>
            {activeBets.length} Jugadores
          </span>
        </h3>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeBets.map((bet, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                background: bet.cashedOut ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255,255,255,0.02)',
                border: bet.cashedOut ? '1px solid rgba(0, 230, 118, 0.15)' : '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <span style={{ fontSize: '0.9rem', color: bet.userId === user?.id ? 'var(--gold)' : 'white', fontWeight: bet.userId === user?.id ? 'bold' : 'normal' }}>
                👤 {bet.username} {bet.userId === user?.id && '(Tú)'}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  ${bet.amount}
                </span>
                {bet.cashedOut ? (
                  <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {bet.multiplier.toFixed(2)}x (+${bet.payout.toFixed(0)})
                  </span>
                ) : (
                  <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>Volando</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
