import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, Wallet, LogOut, ArrowLeft, ShieldAlert,
  Disc, Play, Landmark, MessageCircle
} from 'lucide-react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Cashier from './components/Cashier';
import Admin from './components/Admin';
import Mines from './components/Mines';
import Crash from './components/Crash';
import Slots from './components/Slots';
import Roulette from './components/Roulette';
import Blackjack from './components/Blackjack';
import Plinko from './components/Plinko';
import Dice from './components/Dice';
import ProviderSlots from './components/ProviderSlots';

export const AuthContext = createContext(null);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mg_token'));
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);

  // Cargar usuario inicial si hay token
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token inválido
        logout();
      }
    } catch (e) {
      console.error('Error al cargar datos del usuario', e);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('mg_token', newToken);
    setToken(newToken);
    setUser(userData);
    setCurrentView('home');
  };

  const logout = () => {
    localStorage.removeItem('mg_token');
    setToken(null);
    setUser(null);
    setCurrentView('home');
  };

  // Función para refrescar el saldo del usuario (llamada tras apostar o ganar)
  const refreshBalance = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, balance: data.balance }));
      }
    } catch (e) {
      console.error('Error al refrescar saldo', e);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#08080f',
        color: '#ffd700',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif'
      }}>
        Cargando MG Casino...
      </div>
    );
  }

  // Router interno basado en estado
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home setView={setCurrentView} />;
      case 'login':
        return <Login setView={setCurrentView} />;
      case 'register':
        return <Register setView={setCurrentView} />;
      case 'cashier':
        return user ? <Cashier setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'admin':
        return user && user.role === 'admin' ? <Admin setView={setCurrentView} /> : <Home setView={setCurrentView} />;
      case 'game-mines':
        return user ? <Mines setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-crash':
        return user ? <Crash setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-slots':
        return user ? <Slots setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-roulette':
        return user ? <Roulette setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-blackjack':
        return user ? <Blackjack setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-plinko':
        return user ? <Plinko setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'game-dice':
        return user ? <Dice setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      case 'provider-slots':
        return user ? <ProviderSlots setView={setCurrentView} /> : <Login setView={setCurrentView} />;
      default:
        return <Home setView={setCurrentView} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshBalance }}>
      <div className="app-container">
        
        {/* ENCABEZADO */}
        <header className="header">
          <div className="logo" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
            MG <span>Casino Online</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <>
                {/* Saldo de billetera */}
                <div className="glass-panel-gold" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontWeight: 'bold',
                  color: 'var(--gold)',
                  borderRadius: '12px'
                }}>
                  <Wallet size={16} />
                  <span>${parseFloat(user.balance).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Acceso rápido a cajero */}
                <button 
                  className="btn-gold" 
                  onClick={() => setCurrentView('cashier')}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Landmark size={14} />
                  Cajero / Recargar
                </button>

                {/* Si es Admin */}
                {user.role === 'admin' && (
                  <button 
                    className="btn-violet" 
                    onClick={() => setCurrentView('admin')}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <ShieldAlert size={14} />
                    Panel Admin
                  </button>
                )}

                {/* Perfil & Salir */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    <User size={16} />
                    <span>{user.username}</span>
                  </div>
                  
                  <button 
                    onClick={logout}
                    className="btn-outline"
                    style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Cerrar Sesión"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-outline" onClick={() => setCurrentView('login')}>
                  Iniciar Sesión
                </button>
                <button className="btn-gold" onClick={() => setCurrentView('register')}>
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="main-content">
          {/* Botón de retroceso si no estamos en la página principal */}
          {currentView !== 'home' && currentView !== 'login' && currentView !== 'register' && (
            <button 
              onClick={() => setCurrentView('home')} 
              className="btn-outline"
              style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Volver al Lobby
            </button>
          )}

          {renderView()}
        </main>

        {/* BOTÓN FLOTANTE DE WHATSAPP (3426983026) */}
        <a 
          href="https://wa.me/5493426983026?text=Hola!%20Quiero%20cargar%20saldo%20en%20MG%20Casino" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="wsp-float animate-float"
          title="Carga de Saldo por WhatsApp"
        >
          <MessageCircle size={32} fill="currentColor" />
        </a>

      </div>
    </AuthContext.Provider>
  );
}
