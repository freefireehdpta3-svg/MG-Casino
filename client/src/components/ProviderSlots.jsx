import React, { useState } from 'react';
import { Gamepad2, X, Play, Sparkles } from 'lucide-react';

export default function ProviderSlots({ setView }) {
  const [activeGameUrl, setActiveGameUrl] = useState(null);
  const [activeGameTitle, setActiveGameTitle] = useState('');

  const slotGames = [
    {
      title: 'Gates of Olympus',
      provider: 'Pragmatic Play',
      symbol: 'vs20olympgate',
      cover: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=400&auto=format&fit=crop', // fallback stylized cover
      bgGradient: 'linear-gradient(135deg, #2b1f0d, #ffd700)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate&lang=es&cur=ARS'
    },
    {
      title: 'Sweet Bonanza',
      provider: 'Pragmatic Play',
      symbol: 'vs20sweetbonanza',
      cover: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?q=80&w=400&auto=format&fit=crop',
      bgGradient: 'linear-gradient(135deg, #2e1022, #ff7782)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20sweetbonanza&lang=es&cur=ARS'
    },
    {
      title: 'Sugar Rush',
      provider: 'Pragmatic Play',
      symbol: 'vs20sugarrush',
      cover: 'https://images.unsplash.com/photo-1534080391025-afb109627364?q=80&w=400&auto=format&fit=crop',
      bgGradient: 'linear-gradient(135deg, #102e2a, #00e5ff)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20sugarrush&lang=es&cur=ARS'
    },
    {
      title: 'Starlight Princess',
      provider: 'Pragmatic Play',
      symbol: 'vs20starlight',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop',
      bgGradient: 'linear-gradient(135deg, #1d0f2b, #8a2be2)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20starlight&lang=es&cur=ARS'
    },
    {
      title: 'Big Bass Bonanza',
      provider: 'Pragmatic Play',
      symbol: 'vs10bbbonanza',
      cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=400&auto=format&fit=crop',
      bgGradient: 'linear-gradient(135deg, #0f222b, #41f1b6)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs10bbbonanza&lang=es&cur=ARS'
    },
    {
      title: 'John Hunter & Book of Tut',
      provider: 'Pragmatic Play',
      symbol: 'vs10bookoftut',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
      bgGradient: 'linear-gradient(135deg, #2b1f0d, #dbbd4e)',
      demoUrl: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs10bookoftut&lang=es&cur=ARS'
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Encabezado */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
          <Gamepad2 style={{ color: 'var(--gold)' }} /> Slots de Proveedores (Demo)
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Juega gratis en modo demostración a los títulos más populares de **Pragmatic Play** en Pesos Argentinos (ARS).
        </p>
      </div>

      {/* Rejilla de Juegos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {slotGames.map((game, idx) => (
          <div 
            key={idx}
            className="glass-panel"
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '340px',
              border: '1px solid rgba(255,255,255,0.03)',
              background: 'linear-gradient(135deg, rgba(15, 15, 28, 0.95), rgba(22, 22, 38, 0.95))',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onClick={() => {
              setActiveGameUrl(game.demoUrl);
              setActiveGameTitle(game.title);
            }}
          >
            {/* Imagen de Portada con Gradiente */}
            <div style={{
              height: '180px',
              background: game.bgGradient,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={48} style={{ color: 'var(--gold)', opacity: 0.8 }} />
              </div>
              <img 
                src={game.cover} 
                alt={game.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'blur(1px)' }}
              />
            </div>

            {/* Detalles del Juego */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {game.provider}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'white', marginTop: '4px', marginBottom: '8px' }}>
                  {game.title}
                </h3>
              </div>
              
              <button 
                className="btn-gold" 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px' 
                }}
              >
                <Play size={14} fill="currentColor" /> Jugar Demo (ARS)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PANELES DE EXPLICACIÓN */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(219, 189, 78, 0.1)' }}>
        <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem', marginBottom: '12px' }}>Información Importante</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
          * Estos juegos corren en los servidores oficiales de prueba (Demo) de Pragmatic Play.
          <br />
          * Se cargan con una cantidad fija de fichas de demostración ficticias. Las apuestas que realices no restarán saldo de tu cuenta de MG Casino, ni las ganancias obtenidas se sumarán a tu balance real.
          <br />
          * Para integrar estas tragamonedas con cobros y pagos de saldo real, se requiere contratar una integración de API comercial externa.
        </p>
      </div>

      {/* OVERLAY / MODAL DE JUEGO A PANTALLA COMPLETA */}
      {activeGameUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#08080f',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Header del Modal */}
          <div style={{
            height: '60px',
            backgroundColor: '#0c0c16',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold)' }}>Demo:</span> {activeGameTitle}
            </h3>
            <button 
              onClick={() => {
                setActiveGameUrl(null);
                setActiveGameTitle('');
              }}
              className="btn-outline"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--red)', color: 'var(--red)' }}
            >
              <X size={16} /> Salir del Juego
            </button>
          </div>

          {/* Iframe del Juego */}
          <div style={{ flex: 1, width: '100%', height: 'calc(100% - 60px)', background: '#000' }}>
            <iframe 
              src={activeGameUrl} 
              title={activeGameTitle} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        </div>
      )}

    </div>
  );
}
