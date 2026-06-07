import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { ShieldCheck, Target, Award, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dice() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState('over'); // 'over' o 'under'

  const [isPlaying, setIsPlaying] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [win, setWin] = useState(null);
  const [payout, setPayout] = useState(0);
  const [multiplier, setMultiplier] = useState(1.92);
  const [winChance, setWinChance] = useState(50);
  const [error, setError] = useState('');
  const [animateRoll, setAnimateRoll] = useState(false);

  // Recalcular probabilidad y multiplicador
  useEffect(() => {
    const chance = mode === 'over' ? 100 - target : target;
    setWinChance(chance);
    
    // Asumimos 96% de RTP para el cálculo estimado en el cliente (coincide con el default del backend)
    if (chance <= 0 || chance >= 100) {
      setMultiplier(0);
    } else {
      const mult = (0.96 * (100 / chance));
      setMultiplier(parseFloat(mult.toFixed(4)));
    }
  }, [target, mode]);

  const startRoll = async (e) => {
    e.preventDefault();
    if (isPlaying) return;

    setError('');
    setRollResult(null);
    setWin(null);
    setAnimateRoll(true);
    setIsPlaying(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/dice/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          betAmount: parseFloat(betAmount),
          target: parseFloat(target),
          mode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al lanzar los dados');

      // Animación de conteo aleatorio
      let count = 0;
      const interval = setInterval(() => {
        setRollResult(parseFloat((Math.random() * 100).toFixed(2)));
        count++;
        if (count > 12) {
          clearInterval(interval);
          setRollResult(data.roll);
          setWin(data.win);
          setPayout(data.payoutAmount);
          setAnimateRoll(false);
          setIsPlaying(false);
          refreshBalance();

          if (data.win) {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#dbbd4e', '#ffffff', '#41f1b6']
            });
          }
        }
      }, 80);

    } catch (err) {
      setError(err.message);
      setAnimateRoll(false);
      setIsPlaying(false);
    }
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
      {/* PANEL DE CONTROL */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎲 Dados (Dice)
        </h2>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={startRoll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Modo de Predicción
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={mode === 'over' ? 'btn-gold' : 'btn-outline'}
                onClick={() => setMode('over')}
                disabled={isPlaying}
                style={{ flex: 1, padding: '10px' }}
              >
                Mayor que (Roll Over)
              </button>
              <button
                type="button"
                className={mode === 'under' ? 'btn-gold' : 'btn-outline'}
                onClick={() => setMode('under')}
                disabled={isPlaying}
                style={{ flex: 1, padding: '10px' }}
              >
                Menor que (Roll Under)
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Límite de Predicción: {target}</span>
              <span>Rango (2 - 98)</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="98" 
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value))}
              disabled={isPlaying}
              style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-gold" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 'bold' }} 
            disabled={isPlaying}
          >
            {isPlaying ? 'Lanzando...' : 'Lanzar Dados'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
          <p>✔️ Ajusta el control deslizante para cambiar la probabilidad y el pago.</p>
          <p>✔️ "Mayor que": Ganas si el número obtenido es igual o mayor a tu límite.</p>
          <p>✔️ "Menor que": Ganas si el número obtenido es igual o menor a tu límite.</p>
        </div>
      </div>

      {/* RESULTADO Y ANIMACIÓN */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
        
        {/* PANEL CON VALORES ESTIMADOS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '100%',
          maxWidth: '450px',
          marginBottom: '32px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multiplicador</span>
            <h4 style={{ color: 'var(--gold)', fontSize: '1.25rem', marginTop: '4px' }}>{multiplier}x</h4>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Probabilidad</span>
            <h4 style={{ color: 'white', fontSize: '1.25rem', marginTop: '4px' }}>{winChance.toFixed(2)}%</h4>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pago Estimado</span>
            <h4 style={{ color: 'var(--green)', fontSize: '1.25rem', marginTop: '4px' }}>
              ${winChance > 0 ? (parseFloat(betAmount || 0) * multiplier).toFixed(2) : '0.00'}
            </h4>
          </div>
        </div>

        {/* DIAL DE DADO */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '4px solid rgba(255, 255, 255, 0.05)',
          background: 'radial-gradient(circle, #0e0e1b 40%, #08080f 100%)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: animateRoll ? 'pulse 0.2s infinite alternate' : 'none'
        }}>
          {/* Círculo interior de color según estado */}
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: `2px dashed ${
              win === true ? 'var(--green)' : win === false ? 'var(--red)' : 'rgba(219, 189, 78, 0.15)'
            }`,
            transition: 'border-color 0.3s ease'
          }} />

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', trackingLetter: '1px', zIndex: 10 }}>
            {isPlaying ? 'Girando...' : 'Número'}
          </span>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            color: win === true ? 'var(--green)' : win === false ? 'var(--red)' : 'white',
            margin: '4px 0',
            fontFamily: 'monospace',
            zIndex: 10,
            textShadow: win === true ? '0 0 15px rgba(65, 241, 182, 0.3)' : 'none'
          }}>
            {rollResult !== null ? rollResult.toFixed(2) : '--.--'}
          </h1>
          <span style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '20px',
            background: win === true ? 'rgba(65, 241, 182, 0.1)' : win === false ? 'rgba(255, 119, 130, 0.1)' : 'rgba(255,255,255,0.05)',
            color: win === true ? 'var(--green)' : win === false ? 'var(--red)' : 'var(--text-muted)',
            fontWeight: 'bold',
            zIndex: 10
          }}>
            {win === true ? '¡GANASTE!' : win === false ? 'PERDISTE' : 'ESPERANDO'}
          </span>
        </div>

        {/* NOTIFICACIÓN DE PREMIO */}
        {win === true && (
          <div style={{
            marginTop: '24px',
            color: 'var(--green)',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            🎉 +${payout.toFixed(2)} ({multiplier}x)
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.03); }
        }
      `}} />

    </div>
  );
}
