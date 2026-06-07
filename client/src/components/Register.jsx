import React, { useState, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';

export default function Register({ setView }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, whatsapp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al registrarse');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{
        maxWidth: '450px',
        margin: '40px auto',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.8rem',
            marginBottom: '16px',
            color: 'var(--gold)',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 'bold'
          }}>
            ¡Solicitud Recibida! 🕒
          </h2>
          <p style={{ color: 'white', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Tu usuario ha sido registrado y está en proceso de revisión por el administrador.
          </p>
          <div style={{
            background: 'rgba(219, 189, 78, 0.08)',
            border: '1px dashed var(--gold)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)'
          }}>
            💬 <strong>Le avisaremos a su WhatsApp ({whatsapp}) cuando esté activo el usuario.</strong>
          </div>
          <button 
            onClick={() => setView('home')} 
            className="btn-gold" 
            style={{ width: '100%', padding: '12px' }}
          >
            Volver al Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '40px auto',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
        <h2 style={{
          fontSize: '1.8rem',
          marginBottom: '8px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffffff, var(--gold))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Registrarse
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>
          Crea tu cuenta VIP en MG Casino
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid var(--red)',
            color: '#ff5252',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Elige tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Número de WhatsApp
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ej: +5493426983026"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Crea una contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-gold"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Creando Cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          ¿Ya tienes una cuenta?{' '}
          <span
            onClick={() => setView('login')}
            style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Inicia sesión aquí
          </span>
        </p>
      </div>
    </div>
  );
}
