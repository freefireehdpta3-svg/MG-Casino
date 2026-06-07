import React, { useContext } from 'react';
import { AuthContext } from '../App';
// No Lucide icons needed for games since we are using cover images

export default function Home({ setView }) {
  const { user } = useContext(AuthContext);

  const games = [
    {
      id: 'game-mines',
      title: 'Mines (Minas)',
      desc: 'Encuentra las gemas ocultas y evita las minas explosivas. ¡Elige cuántas minas poner para aumentar tus ganancias!',
      cover: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar Ahora',
      rtp: '95'
    },
    {
      id: 'game-crash',
      title: 'Crash (Aviator)',
      desc: 'Apuesta en tiempo real mientras el avión sube. Retírate antes de que se estrelle para asegurar tu multiplicador.',
      cover: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar en Vivo',
      rtp: '96'
    },
    {
      id: 'game-slots',
      title: 'Slots (Tragamonedas)',
      desc: 'Gira los 5 rodillos en busca de los sietes de oro y las combinaciones de frutas. ¡Hasta 9 líneas de pago activas!',
      cover: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop',
      label: 'Girar Rodillos',
      rtp: '94'
    },
    {
      id: 'game-roulette',
      title: 'Ruleta Europea',
      desc: 'Haz tus apuestas al rojo/negro, par/impar, o a tu número de la suerte en nuestra ruleta europea en tiempo real.',
      cover: 'https://images.unsplash.com/photo-1570800073900-344904a115ec?q=80&w=600&auto=format&fit=crop',
      label: 'Apostar',
      rtp: '97.3'
    },
    {
      id: 'game-blackjack',
      title: 'Blackjack (Veintiuno)',
      desc: 'Juega al clásico juego de cartas contra la casa. Consigue 21 o supera al crupier sin pasarte para ganar 2x.',
      cover: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar Blackjack',
      rtp: '99'
    },
    {
      id: 'game-plinko',
      title: 'Plinko',
      desc: 'Suelta la bola desde la cima y mira cómo rebota entre los clavos hasta caer en un multiplicador. ¡Hasta 110x de ganancia!',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
      label: 'Soltar Bola',
      rtp: '96'
    },
    {
      id: 'game-dice',
      title: 'Dados (Dice)',
      desc: 'Elige tu margen y predice si la tirada será mayor o menor. Controla tu propia probabilidad y pagos de forma dinámica.',
      cover: 'https://images.unsplash.com/photo-1580234810907-b40315b76418?q=80&w=600&auto=format&fit=crop',
      label: 'Lanzar Dados',
      rtp: '96'
    },
    {
      id: 'provider-slots',
      title: 'Slots de Proveedores',
      desc: 'Juega a los títulos más conocidos del mercado como Gates of Olympus o Sweet Bonanza de forma gratuita.',
      cover: 'https://images.unsplash.com/photo-1534080391025-afb109627364?q=80&w=600&auto=format&fit=crop',
      label: 'Abrir Catálogo',
      rtp: '96'
    },
    {
      id: 'game-jokers-jewels',
      title: "Joker's Jewels Real ($)",
      desc: 'El clásico y famoso tragamonedas de bufones y joyas. ¡Juega con tu saldo real para conseguir el gran premio de 1000x!',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
      label: 'Apostar Real',
      rtp: '96'
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
            className="glass-panel game-card"
            onClick={() => setView(game.id)}
            style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}
          >
            <div className="game-card-bg" style={{ backgroundImage: `url(${game.cover})` }} />
            
            <div className="game-card-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <span className="badge" style={{
                  backgroundColor: 'rgba(255,215,0,0.08)',
                  color: 'var(--gold)',
                  border: '1px solid rgba(255,215,0,0.2)'
                }}>RTP {game.rtp}%</span>
              </div>

              <h3 className="game-card-title" style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                {game.title}
              </h3>
              <p className="game-card-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '36px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {game.desc}
              </p>
              <button className="btn-gold" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
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
