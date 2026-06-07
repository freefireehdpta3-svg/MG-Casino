import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { 
  Users, CheckCircle2, XCircle, DollarSign, 
  Settings, UserX, UserCheck, Plus, Minus, UserPlus
} from 'lucide-react';

export default function Admin() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('deposits');
  const [stats, setStats] = useState({ usersCount: 0, depositsSum: 0, withdrawalsSum: 0, netProfit: 0 });
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [rtpSettings, setRtpSettings] = useState({ rtp_mines: '95', rtp_crash: '96', rtp_slots: '94', rtp_roulette: '97.3', rtp_plinko: '96', rtp_dice: '96' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de modales / inputs temporales
  const [previewImage, setPreviewImage] = useState(null);

  // Creación de nuevos usuarios
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchDeposits();
    fetchWithdrawals();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/deposits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const settingsMap = {};
        data.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        setRtpSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Acciones sobre Depósitos
  const handleDepositAction = async (depositId, action) => {
    if (!window.confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este depósito?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/deposits/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ depositId, action })
      });
      if (res.ok) {
        fetchDeposits();
        fetchStats();
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Acciones sobre Retiros
  const handleWithdrawAction = async (withdrawalId, action) => {
    if (!window.confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este retiro?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ withdrawalId, action })
      });
      if (res.ok) {
        fetchWithdrawals();
        fetchStats();
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Modificar Saldo de Usuario
  const handleModifyBalance = async (userId, type) => {
    const input = window.prompt(`Ingresa el monto a ${type === 'add' ? 'cargar' : 'restar'}:`);
    if (!input || isNaN(input) || parseFloat(input) <= 0) return;
    
    const amount = parseFloat(input);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, type, amount })
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Suspender / Activar Usuario
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    if (!window.confirm(`¿Estás seguro de cambiar el estado de este usuario a ${newStatus === 'banned' ? 'SUSPENDIDO' : 'ACTIVO'}?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Crear Usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!newUsername || !newPassword) {
      setCreateError('Por favor complete el nombre de usuario y contraseña.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword, 
          balance: newBalance ? parseFloat(newBalance) : 0.0 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Error al crear el usuario.');
        return;
      }

      setCreateSuccess(`¡Usuario ${newUsername} creado con éxito!`);
      setNewUsername('');
      setNewPassword('');
      setNewBalance('');
      fetchUsers();
      fetchStats();
      
      // Auto-ocultar el formulario tras 2 segundos
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setCreateError('Error de red al intentar crear el usuario.');
    }
  };

  // Guardar Ajustes de RTP
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const settingsList = Object.keys(rtpSettings).map(key => ({
      key,
      value: rtpSettings[key]
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: settingsList })
      });
      if (res.ok) {
        alert('Configuraciones guardadas correctamente.');
        fetchSettings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', padding: '12px', borderRadius: '12px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Depósitos Aprobados</span>
            <h3 style={{ fontSize: '1.5rem', color: 'white', marginTop: '4px' }}>
              ${parseFloat(stats.depositsSum).toLocaleString('es-AR')}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,23,68,0.1)', color: 'var(--red)', padding: '12px', borderRadius: '12px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Retiros Pagados</span>
            <h3 style={{ fontSize: '1.5rem', color: 'white', marginTop: '4px' }}>
              ${parseFloat(stats.withdrawalsSum).toLocaleString('es-AR')}
            </h3>
          </div>
        </div>

        <div className="glass-panel-gold" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', padding: '12px', borderRadius: '12px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Utilidad Neta Casa</span>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--gold)', marginTop: '4px' }}>
              ${parseFloat(stats.netProfit).toLocaleString('es-AR')}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(138,43,226,0.1)', color: 'var(--violet)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Usuarios Registrados</span>
            <h3 style={{ fontSize: '1.5rem', color: 'white', marginTop: '4px' }}>
              {stats.usersCount}
            </h3>
          </div>
        </div>
      </div>

      {/* MENÚ DE SECCIONES */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('deposits')} 
          className={activeTab === 'deposits' ? 'btn-gold' : 'btn-outline'}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Depósitos Pendientes ({deposits.filter(d => d.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')} 
          className={activeTab === 'withdrawals' ? 'btn-gold' : 'btn-outline'}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Retiros Pendientes ({withdrawals.filter(w => w.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={activeTab === 'users' ? 'btn-gold' : 'btn-outline'}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Gestionar Usuarios
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={activeTab === 'settings' ? 'btn-gold' : 'btn-outline'}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Ajustes / RTP
        </button>
      </div>

      {/* COLA DE DEPÓSITOS */}
      {activeTab === 'deposits' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2>Solicitudes de Carga (Depósitos)</h2>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Comprobante</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map(dep => (
                  <tr key={dep.id}>
                    <td style={{ fontWeight: 'bold' }}>{dep.username}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>
                      ${parseFloat(dep.amount).toLocaleString('es-AR')}
                    </td>
                    <td style={{ textTransform: 'uppercase' }}>{dep.method}</td>
                    <td>
                      <button 
                        onClick={() => setPreviewImage(`${BACKEND_URL}/${dep.receipt_path}`)}
                        className="btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Ver Captura
                      </button>
                    </td>
                    <td>{new Date(dep.created_at).toLocaleString('es-AR')}</td>
                    <td>
                      <span className={`badge badge-${dep.status}`}>
                        {dep.status === 'pending' ? 'Pendiente' : dep.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </td>
                    <td>
                      {dep.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleDepositAction(dep.id, 'approve')} 
                            className="btn-gold" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#00e676', boxShadow: 'none' }}
                          >
                            <CheckCircle2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDepositAction(dep.id, 'reject')} 
                            className="btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--red)', color: 'var(--red)' }}
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COLA DE RETIROS */}
      {activeTab === 'withdrawals' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2>Solicitudes de Cobro (Retiros)</h2>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Datos de Cuenta / Destinatario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(wit => (
                  <tr key={wit.id}>
                    <td style={{ fontWeight: 'bold' }}>{wit.username}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 'bold' }}>
                      ${parseFloat(wit.amount).toLocaleString('es-AR')}
                    </td>
                    <td style={{ textTransform: 'uppercase' }}>{wit.method}</td>
                    <td style={{ maxWidth: '280px', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                      {wit.destination_details}
                    </td>
                    <td>{new Date(wit.created_at).toLocaleString('es-AR')}</td>
                    <td>
                      <span className={`badge badge-${wit.status}`}>
                        {wit.status === 'pending' ? 'Pendiente' : wit.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </td>
                    <td>
                      {wit.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleWithdrawAction(wit.id, 'approve')} 
                            className="btn-gold" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#00e676', boxShadow: 'none' }}
                            title="Aprobar tras transferirle manualmente"
                          >
                            Marcar Pagado
                          </button>
                          <button 
                            onClick={() => handleWithdrawAction(wit.id, 'reject')} 
                            className="btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--red)', color: 'var(--red)' }}
                            title="Rechazar (Devuelve el saldo al usuario)"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h2>Listado de Usuarios</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setCreateError('');
                  setCreateSuccess('');
                }}
                className="btn-gold"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
              >
                <UserPlus size={16} />
                {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
              </button>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Buscar por usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '240px', padding: '8px', marginBottom: 0 }}
              />
            </div>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="glass-panel" style={{ 
              padding: '20px', 
              marginBottom: '24px', 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(219, 189, 78, 0.2)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--gold)', fontSize: '1.1rem' }}>Registrar Nuevo Jugador</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Usuario</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej: juan_perez" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Contraseña</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Saldo Inicial ($)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Ej: 1000" 
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    min="0"
                    step="any"
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
              </div>

              {createError && (
                <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ⚠️ {createError}
                </div>
              )}

              {createSuccess && (
                <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✓ {createSuccess}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)} 
                  className="btn-outline"
                  style={{ padding: '8px 16px' }}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="btn-gold"
                  style={{ padding: '8px 20px' }}
                >
                  Crear Jugador
                </button>
              </div>
            </form>
          )}

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th>Modificar Saldo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{u.role}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--gold)' }}>
                      ${parseFloat(u.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.status === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleModifyBalance(u.id, 'add')} 
                            className="btn-outline" 
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--green)' }}
                          >
                            <Plus size={10} /> Cargar
                          </button>
                          <button 
                            onClick={() => handleModifyBalance(u.id, 'subtract')} 
                            className="btn-outline" 
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--red)' }}
                          >
                            <Minus size={10} /> Restar
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className="btn-outline"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            border: u.status === 'active' ? '1px solid var(--red)' : '1px solid var(--green)',
                            color: u.status === 'active' ? 'var(--red)' : 'var(--green)'
                          }}
                        >
                          {u.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                          {u.status === 'active' ? ' Suspender' : ' Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AJUSTES Y RTP */}
      {activeTab === 'settings' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2>Ajustes Globales y Retorno al Jugador (RTP)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Ajusta los porcentajes de probabilidad de ganancia de los juegos. Un RTP menor (ej. 80%) significa más ganancias retenidas por el casino a largo plazo.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Mines (Actual: {rtpSettings.rtp_mines}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="1"
                  value={rtpSettings.rtp_mines}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_mines: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Crash (Actual: {rtpSettings.rtp_crash}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="1"
                  value={rtpSettings.rtp_crash}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_crash: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--violet)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Slots (Actual: {rtpSettings.rtp_slots}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="1"
                  value={rtpSettings.rtp_slots}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_slots: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Ruleta (Actual: {rtpSettings.rtp_roulette}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="0.1"
                  value={rtpSettings.rtp_roulette}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_roulette: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--green)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Plinko (Actual: {rtpSettings.rtp_plinko || '96'}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="1"
                  value={rtpSettings.rtp_plinko || '96'}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_plinko: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  RTP Dados (Actual: {rtpSettings.rtp_dice || '96'}%)
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  step="1"
                  value={rtpSettings.rtp_dice || '96'}
                  onChange={(e) => setRtpSettings({ ...rtpSettings, rtp_dice: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--violet)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '14px', marginTop: '16px' }}>
              <Settings size={16} /> Guardar Parámetros de Casino
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE PREVISUALIZACIÓN DE COMPROBANTE */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{ padding: '16px', maxWidth: '90%', maxHeight: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button className="btn-outline" onClick={() => setPreviewImage(null)} style={{ padding: '4px 8px' }}>
                Cerrar
              </button>
            </div>
            <img 
              src={previewImage} 
              alt="Comprobante" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => { e.target.src = 'https://placehold.co/400?text=Error+al+cargar+comprobante'; }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
