import React, { useState, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Dices, Trophy, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const SUIT_SYMBOLS = {
  H: { icon: '♥', color: '#ff1744', name: 'Corazones' },
  D: { icon: '♦', color: '#ff1744', name: 'Diamantes' },
  C: { icon: '♣', color: '#ffffff', name: 'Tréboles' },
  S: { icon: '♠', color: '#ffffff', name: 'Picas' }
};

// Función para parsear cartas como "10D", "AS", etc.
function parseCard(cardString) {
  if (cardString === 'hidden') {
    return { isHidden: true };
  }
  const rank = cardString.substring(0, cardString.length - 1);
  const suit = cardString.charAt(cardString.length - 1);
  return {
    rank,
    suit: SUIT_SYMBOLS[suit] || { icon: '?', color: '#fff' },
    isHidden: false
  };
}

// Tarjeta Gráfica CSS
function Card({ cardString }) {
  const { rank, suit, isHidden } = parseCard(cardString);

  if (isHidden) {
    return (
      <div style={{
        width: '75px',
        height: '110px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1c1c38, #0c0c1b)',
        border: '2px solid var(--gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        transform: 'translateY(0)',
        transition: 'transform 0.2s ease'
      }}>
        <div style={{
          color: 'var(--gold)',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          MG
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '75px',
      height: '110px',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      color: suit.color,
      position: 'relative'
    }}>
      {/* Esquina Superior Izquierda */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{rank}</span>
        <span style={{ fontSize: '0.8rem' }}>{suit.icon}</span>
      </div>

      {/* Símbolo Central Grande */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '2.2rem'
      }}>
        {suit.icon}
      </div>

      {/* Esquina Inferior Derecha Invertida */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{rank}</span>
        <span style={{ fontSize: '0.8rem' }}>{suit.icon}</span>
      </div>
    </div>
  );
}

export default function Blackjack() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  
  // Estado de Partida
  const [game, setGame] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [winStatus, setWinStatus] = useState(null); // true, false, null
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Iniciar Partida (Deal)
  const startNewGame = async (e) => {
    e.preventDefault();
    setError('');
    setResultMessage('');
    setWinStatus(null);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/blackjack/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'start',
          betAmount: parseFloat(betAmount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar partida');

      setGame(data.game);
      
      if (data.game.status === 'finished') {
        setResultMessage(data.resultMessage);
        setWinStatus(data.win);
        if (data.win) triggerConfetti();
      }

      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pedir Carta (Hit)
  const handleHit = async () => {
    if (!game || game.status !== 'playing' || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/blackjack/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'hit' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pedir carta');

      setGame(data.game);
      if (data.game.status === 'finished') {
        setResultMessage(data.resultMessage);
        setWinStatus(data.win);
      }
      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Doblar Apuesta (Double)
  const handleDouble = async () => {
    if (!game || game.status !== 'playing' || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/blackjack/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'double' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al doblar apuesta');

      setGame(data.game);
      if (data.game.status === 'finished') {
        setResultMessage(data.resultMessage);
        setWinStatus(data.win);
        if (data.win) triggerConfetti();
      }
      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Plantarse (Stand)
  const handleStand = async () => {
    if (!game || game.status !== 'playing' || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/blackjack/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'stand' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al plantarse');

      setGame(data.game);
      setResultMessage(data.resultMessage);
      setWinStatus(data.win);
      if (data.win) triggerConfetti();
      refreshBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00ff66', '#ffd700', '#ffffff']
    });
  };

  // Calcular puntaje visual aproximado (sólo del cliente para mostrar)
  const getHandScore = (hand) => {
    if (!hand) return 0;
    // Filtrar cartas ocultas
    const visibleCards = hand.filter(c => c !== 'hidden');
    
    let score = visibleCards.reduce((sum, card) => {
      const rank = card.substring(0, card.length - 1);
      if (['J', 'Q', 'K'].includes(rank)) return sum + 10;
      if (rank === 'A') return sum + 11;
      return sum + parseInt(rank);
    }, 0);

    let aces = visibleCards.filter(c => c.startsWith('A')).length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const playerScore = game ? getHandScore(game.playerHand) : 0;
  const dealerScore = game ? getHandScore(game.dealerHand) : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.8fr',
      gap: '32px',
      maxWidth: '1000px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out',
      flexWrap: 'wrap'
    }}>
      
      {/* PANEL DE CONTROL LATERAL */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Dices style={{ color: 'var(--gold)' }} /> Blackjack (Veintiuno)
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
              disabled={game && game.status === 'playing'}
              min="10"
              required
            />
          </div>

          {!game || game.status === 'finished' ? (
            <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              Repartir Mano
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                textAlign: 'center',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Apuesta en Curso</span>
                <h3 style={{ color: 'var(--gold)', fontSize: '1.4rem' }}>${game.bet}</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-gold" 
                  onClick={handleHit}
                  disabled={loading}
                >
                  Pedir
                </button>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={handleStand}
                  disabled={loading}
                  style={{ border: '1px solid var(--violet)', color: 'white' }}
                >
                  Plantarse
                </button>
              </div>

              <button 
                type="button" 
                className="btn-violet" 
                onClick={handleDouble}
                disabled={loading}
                style={{ width: '100%' }}
              >
                Doblar Apuesta
              </button>
            </div>
          )}
        </form>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <p style={{ marginBottom: '6px' }}>🃏 Blackjack paga 3 a 2 (2.5x tu apuesta).</p>
          <p style={{ marginBottom: '6px' }}>🃏 El crupier saca cartas hasta llegar a 17 o más.</p>
          <p>🃏 Doblar duplica la apuesta pero te da una sola carta.</p>
        </div>
      </div>

      {/* TAPETE DE JUEGO */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* El Tapete Verde */}
        <div style={{
          width: '100%',
          aspectRatio: '1.5',
          borderRadius: '24px',
          background: 'radial-gradient(circle, #0e4f29 0%, #062b14 100%)',
          border: '10px solid #1c1c30',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo y Reglas Impresas en el tapete */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            opacity: 0.08,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '2px' }}>MG CASINO</h1>
            <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Crupier debe plantarse en 17 y pedir en 16</p>
            <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>BLACKJACK PAGA 3 A 2</p>
          </div>

          {/* MANO DEL CRUPIER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#8dfcb8', fontWeight: '600' }}>Crupier (Casa)</span>
              {game && (
                <span className="badge" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}>
                  Puntos: {dealerScore}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', minHeight: '110px', padding: '4px 0' }}>
              {game ? (
                game.dealerHand.map((card, i) => (
                  <Card key={i} cardString={card} />
                ))
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                  Esperando que se reparta la mano...
                </div>
              )}
            </div>
          </div>

          {/* CARTEL DE RESULTADO CENTRAL */}
          {resultMessage && (
            <div className="glass-panel" style={{
              alignSelf: 'center',
              padding: '12px 24px',
              borderRadius: '12px',
              border: winStatus === true 
                ? '2px solid var(--green)' 
                : winStatus === false 
                ? '2px solid var(--red)' 
                : '2px solid var(--warning)',
              color: winStatus === true 
                ? 'var(--green)' 
                : winStatus === false 
                ? 'var(--red)' 
                : 'var(--warning)',
              fontWeight: 'bold',
              textAlign: 'center',
              zIndex: 10,
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              fontSize: '1rem',
              animation: 'bounce 0.3s ease-out'
            }}>
              {resultMessage}
            </div>
          )}

          {/* MANO DEL JUGADOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: '12px', minHeight: '110px', padding: '4px 0', justifyContent: 'flex-end' }}>
              {game && game.playerHand.map((card, i) => (
                <Card key={i} cardString={card} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px' }}>
              {game && (
                <span className="badge" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}>
                  Puntos: {playerScore}
                </span>
              )}
              <span style={{ fontSize: '0.85rem', color: '#8dfcb8', fontWeight: '600' }}>Tus Cartas</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
