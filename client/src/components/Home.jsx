import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
// No Lucide icons needed for games since we are using cover images

export default function Home({ setView }) {
  const { user } = useContext(AuthContext);
  const [activeBanner, setActiveBanner] = useState(0);

  const banners = [
    {
      title: "SOLO POR HOY",
      subtitle: "VIVÍ TU DÍA AL MÁXIMO",
      highlight: "100% EN BONO",
      detail: "Dep. min.: $15.000",
      cta: "¡JUGÁ AHORA!",
      image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop",
      gradient: "linear-gradient(135deg, #09090b 0%, #008e47 100%)"
    },
    {
      title: "CARGAS Y RETIROS",
      subtitle: "LAS 24 HORAS DEL DÍA",
      highlight: "AL INSTANTE",
      detail: "Soporte de WhatsApp 24/7",
      cta: "CARGAR SALDO",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
      gradient: "linear-gradient(135deg, #09090b 0%, #00b0ff 100%)",
      action: "cashier"
    },
    {
      title: "SALA EXCLUSIVA",
      subtitle: "JUEGOS ORIGINALES Y SEGUROS",
      highlight: "MGCASINO SF",
      detail: "Validación server-side segura",
      cta: "PROBAR MINAS",
      image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=600&auto=format&fit=crop",
      gradient: "linear-gradient(135deg, #09090b 0%, #8a2be2 100%)",
      action: "game-mines"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const exclusives = [
    {
      id: 'game-mines',
      title: 'Mines (Minas)',
      desc: 'Encuentra las gemas ocultas y evita las minas explosivas. ¡Apuestas seguras!',
      cover: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar Ahora',
      rtp: '95'
    },
    {
      id: 'game-crash',
      title: 'Crash (Aviator)',
      desc: 'Apuesta en tiempo real y retírate antes de que el cohete se estrelle. ¡En vivo!',
      cover: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar en Vivo',
      rtp: '96'
    },
    {
      id: 'game-roulette',
      title: 'Ruleta Europea',
      desc: 'Haz tus apuestas al rojo/negro, par/impar, o a tu número de la suerte.',
      cover: 'https://images.unsplash.com/photo-1570800073900-344904a115ec?q=80&w=600&auto=format&fit=crop',
      label: 'Apostar',
      rtp: '97.3'
    },
    {
      id: 'game-blackjack',
      title: 'Blackjack',
      desc: 'Juega al clásico juego de cartas contra la casa. Consigue 21 y gana.',
      cover: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=600&auto=format&fit=crop',
      label: 'Jugar Blackjack',
      rtp: '99'
    },
    {
      id: 'game-plinko',
      title: 'Plinko',
      desc: 'Suelta la bola desde la cima y mira cómo rebota hasta los multiplicadores.',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
      label: 'Soltar Bola',
      rtp: '96'
    },
    {
      id: 'game-dice',
      title: 'Dados (Dice)',
      desc: 'Elige tu margen y predice si la tirada será mayor o menor. Controla tu pago.',
      cover: 'https://images.unsplash.com/photo-1580234810907-b40315b76418?q=80&w=600&auto=format&fit=crop',
      label: 'Lanzar Dados',
      rtp: '96'
    }
  ];

  const featuredSlots = [
    {
      id: 'game-jokers-jewels',
      title: "Joker's Jewels Real ($)",
      desc: 'El clásico slot de bufones y joyas. ¡Juega con tu saldo real para conseguir 1000x!',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
      label: 'Apostar Real',
      rtp: '96'
    },
    {
      id: 'provider-slots',
      title: "Link King: Striker's Fortune",
      desc: 'El famosísimo juego de rodillos de Zitro Games en modo demo gratuito.',
      cover: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop',
      label: 'Girar Rodillos',
      rtp: '96'
    },
    {
      id: 'provider-slots',
      title: 'Sweet Powernudge',
      desc: '¡Acumula multiplicadores dulces en este slot clásico de Pragmatic Play!',
      cover: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?q=80&w=600&auto=format&fit=crop',
      label: 'Girar Rodillos',
      rtp: '96'
    },
    {
      id: 'provider-slots',
      title: 'Gates of Olympus',
      desc: 'Entra al reino de Zeus y busca los multiplicadores de rayos de hasta 500x.',
      cover: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=600&auto=format&fit=crop',
      label: 'Girar Rodillos',
      rtp: '96.5'
    },
    {
      id: 'provider-slots',
      title: 'Big Bass Bonanza',
      desc: 'Pesca los premios más grandes junto al pescador en este slot icónico.',
      cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop',
      label: 'Girar Rodillos',
      rtp: '96.7'
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Banner Promocional Deslizable Estilo bplay */}
      <div className="glass-panel" style={{
        position: 'relative',
        height: '280px',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '16px',
        border: '1px solid rgba(0, 255, 135, 0.15)',
        boxShadow: '0 4px 30px rgba(0, 255, 135, 0.05)',
        display: 'flex',
        alignItems: 'center'
      }}>
        {banners.map((banner, index) => (
          <div 
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: activeBanner === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              display: 'flex',
              background: banner.gradient,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '40px',
              zIndex: activeBanner === index ? 2 : 1
            }}
          >
            {/* Detalles de la Promo */}
            <div style={{ zIndex: 10, maxWidth: '60%' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                color: 'var(--gold)', 
                letterSpacing: '2px', 
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px'
              }}>
                {banner.title}
              </span>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '900', 
                color: 'white', 
                marginBottom: '8px', 
                lineHeight: '1.2',
                fontFamily: 'Outfit, sans-serif'
              }}>
                {banner.subtitle} <br />
                <span style={{ color: 'var(--gold)', WebkitTextFillColor: 'initial' }}>{banner.highlight}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                {banner.detail}
              </p>
              <button 
                onClick={() => {
                  if (banner.action) setView(banner.action);
                  else setView('provider-slots');
                }}
                className="btn-gold" 
                style={{ padding: '12px 24px', fontWeight: 'bold' }}
              >
                {banner.cta}
              </button>
            </div>
            
            {/* Imagen Decorativa */}
            <div style={{
              width: '300px',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <img 
                src={banner.image} 
                alt="Promo" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.65,
                  filter: 'blur(0.5px)'
                }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda Juego Responsable */}
      <div style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        marginBottom: '32px',
        fontWeight: '500',
        letterSpacing: '0.5px'
      }}>
        🔞 El juego compulsivo es perjudicial para vos y tu familia. Solo mayores de 18 años.
      </div>

      {/* 1. SECCIÓN: EXCLUSIVOS MGCASINO */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            🟢 Exclusivos MGCASINO
          </h2>
        </div>
        <div className="games-grid">
          {exclusives.map(game => (
            <div 
              key={game.id} 
              className="glass-panel game-card"
              onClick={() => setView(game.id)}
              style={{ border: '1px solid rgba(0, 255, 135, 0.05)' }}
            >
              <div className="game-card-bg" style={{ backgroundImage: `url(${game.cover})` }} />
              
              <div className="game-card-content" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <span className="badge" style={{
                    backgroundColor: 'rgba(0, 255, 135, 0.08)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(0, 255, 135, 0.2)'
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
      </div>

      {/* 2. SECCIÓN: SLOTS DESTACADOS */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            🎰 Slots Destacados
          </h2>
          <button 
            onClick={() => setView('provider-slots')} 
            className="btn-outline" 
            style={{ padding: '6px 16px', fontSize: '0.8rem', color: 'var(--gold)', borderColor: 'rgba(0, 255, 135, 0.2)' }}
          >
            Ver Todos
          </button>
        </div>
        <div className="games-grid">
          {featuredSlots.map(game => (
            <div 
              key={game.title} 
              className="glass-panel game-card"
              onClick={() => setView(game.id)}
              style={{ border: '1px solid rgba(0, 255, 135, 0.05)' }}
            >
              <div className="game-card-bg" style={{ backgroundImage: `url(${game.cover})` }} />
              
              <div className="game-card-content" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <span className="badge" style={{
                    backgroundColor: 'rgba(0, 255, 135, 0.08)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(0, 255, 135, 0.2)'
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
