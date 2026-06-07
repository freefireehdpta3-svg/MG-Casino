import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Bomb, Rocket, Disc, HelpCircle, Dices } from 'lucide-react';

export default function Home({ setView }) {
  const { user } = useContext(AuthContext);

  const games = [
    {
      id: 'game-mines',
      title: 'Mines (Minas)',
      desc: 'Encuentra las gemas ocultas y evita las minas explosivas. ¡Elige cuántas minas poner para aumentar tus ganancias!',
      icon: <Bomb size={48} className="animate-float" style={{ color: 'var(--gold)' }} />,
      bgGradient: 'linear-gradient(45deg, #1e1e38, #8a2be2)',
      label: 'Jugar Ahora',
    },
    {
      id: 'game-crash',
      title: 'Crash (Aviator)',
      desc: 'Apuesta en tiempo real mientras el avión sube. Retírate antes de que se estrelle para asegurar tu multiplicador.',
      icon: <Rocket size={48} className="animate-float" style={{ color: 'var(--cyan)' }} />,
      bgGradient: 'linear-gradient(45deg, #1e1e38, #00e5ff)',
      label: 'Jugar en Vivo',
    },
    {
      id: 'game-slots',
      title: 'Slots (Tragamonedas)',
      desc: 'Gira los 5 rodillos en busca de los sietes de oro y las combinaciones de frutas. ¡Hasta 9 líneas de pago activas!',
      icon: <HelpCircle size={48} className="animate-float" style={{ color: 'var(--gold)' }} />,
      bgGradient: 'linear-gradient(45deg, #1e1e38, #ffd700)',
      label: 'Girar Rodillos',
    },
    {
      id: 'game-roulette',
      title: 'Ruleta Europea',
      desc: 'Haz tus apuestas al rojo/negro, par/impar, o a tu número de la suerte en nuestra ruleta europea en tiempo real.',
      icon: <Disc size={48} className="animate-float" style={{ color: 'var(--green)' }} />,
      bgGradient: 'linear-gradient(45deg, #1e1e38, #00e676)',
      label: 'Apostar',
    },
    {
      id: 'game-blackjack',
      title: 'Blackjack (Veintiuno)',
      desc: 'Juega al clásico juego de cartas contra la casa. Consigue 21 o supera al crupier sin pasarte para ganar 2x.',
      icon: <Dices size={48} className="animate-float" style={{ color: 'var(--violet)' }} />,
      bgGradient: 'linear-gradient(45deg, #1e1e38, #8a2be2)',
      label: 'Jugar Blackjack',
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Banner de Bienvenida */}
      <div className="glass-panel-gold" style={{
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '40px',
        background: 'radial-gradient(circle at center, rgba(138, 43, 226, 0.15) 0%, rgba(8, 8, 15, 0.4) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #ffffff, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ¡Bienvenido a MG Casino Online!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 24px' }}>
          La plataforma más transparente de juegos online con cargas instantáneas por transferencia y retiros en el día.
        </p>

        {!user && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="btn-gold" onClick={() => setView('register')} style={{ padding: '14px 28px' }}>
              Crear Cuenta Gratis
            </button>
            <button className="btn-outline" onClick={() => setView('login')} style={{ padding: '14px 28px' }}>
              Ingresar
            </button>
          </div>
        )}
      </div>

      {/* Título de Sección */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🎮 Sala de Juegos
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Selecciona tu juego favorito y comienza a ganar saldo real.</p>
      </div>

      {/* Grid de Juegos */}
      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id} 
            className="glass-panel"
            onClick={() => setView(game.id)}
            style={{
              padding: '24px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '320px',
              background: `linear-gradient(135deg, rgba(15, 15, 28, 0.95), rgba(22, 22, 38, 0.95))`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {game.icon}
              </div>
              <span className="badge" style={{
                backgroundColor: 'rgba(255,215,0,0.08)',
                color: 'var(--gold)',
                border: '1px solid rgba(255,215,0,0.2)'
              }}>RTP +95%</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'white' }}>{game.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '16px' }}>
                {game.desc}
              </p>
              <button className="btn-gold" style={{ width: '100%', padding: '10px' }}>
                {game.label}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Banner Informativo */}
      <div className="glass-panel" style={{
        marginTop: '40px',
        padding: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: '24px',
        border: '1px solid rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--gold)', fontSize: '1.8rem' }}>100% Real</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Validación server-side segura</p>
        </div>
        <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--cyan)', fontSize: '1.8rem' }}>Cargas por Whatsapp</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Atención al instante 24/7</p>
        </div>
        <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--green)', fontSize: '1.8rem' }}>Retiros Rápidos</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Directo a tu cuenta bancaria o MP</p>
        </div>
      </div>

    </div>
  );
}
