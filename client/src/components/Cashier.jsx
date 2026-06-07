import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Upload, Landmark, ShieldCheck, CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function Cashier() {
  const { user, token, refreshBalance } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('deposit');
  const [history, setHistory] = useState([]);
  
  // Estados de Depósito
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('transferencia');
  const [file, setFile] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Estados de Retiro
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mercadopago');
  const [destinationDetails, setDestinationDetails] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Datos del Admin para Cargas (Simulado/Configurable)
  const paymentDetails = {
    transferencia: { banco: 'Banco Galicia', cvu: '0070023420000012345678', alias: 'mg.casino.galicia', titular: 'MG Casino S.A.' },
    mercadopago: { banco: 'Mercado Pago', cvu: '0000003100012345678901', alias: 'mg.casino.mp', titular: 'MG Casino S.A.' },
    uala: { banco: 'Ualá', cvu: '2850590940090418135831', alias: 'mg.casino.uala', titular: 'MG Casino S.A.' },
    crypto: { red: 'USDT (TRC20)', wallet: 'TYhP2XNfE69S7dGg7Lz9s8uH1j2K3l4M5n' }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cajero/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Error al cargar historial', e);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');
    
    if (!file) {
      setDepositError('Por favor, sube una captura del comprobante.');
      return;
    }

    setDepositLoading(true);

    try {
      const formData = new FormData();
      formData.append('amount', depositAmount);
      formData.append('method', depositMethod);
      formData.append('receipt', file);

      const res = await fetch(`${BACKEND_URL}/api/cajero/deposit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar depósito');

      setDepositSuccess('¡Solicitud enviada con éxito! Un administrador validará tu recarga en unos minutos.');
      setDepositAmount('');
      setFile(null);
      fetchHistory();
    } catch (err) {
      setDepositError(err.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/cajero/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          destination_details: destinationDetails
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar retiro');

      setWithdrawSuccess('¡Solicitud de retiro enviada! Tu saldo está retenido y se acreditará en tu cuenta en unas horas.');
      setWithdrawAmount('');
      setDestinationDetails('');
      refreshBalance();
      fetchHistory();
    } catch (err) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('deposit')} 
          className={activeTab === 'deposit' ? 'btn-gold' : 'btn-outline'}
          style={{ flex: 1, padding: '14px' }}
        >
          <ArrowDownCircle size={18} />
          Cargar Saldo
        </button>
        <button 
          onClick={() => setActiveTab('withdraw')} 
          className={activeTab === 'withdraw' ? 'btn-gold' : 'btn-outline'}
          style={{ flex: 1, padding: '14px' }}
        >
          <ArrowUpCircle size={18} />
          Retirar Fondos
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={activeTab === 'history' ? 'btn-gold' : 'btn-outline'}
          style={{ flex: 1, padding: '14px' }}
        >
          <Landmark size={18} />
          Historial
        </button>
      </div>

      {/* SECCIÓN DE DEPÓSITO */}
      {activeTab === 'deposit' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark /> Cargar Saldo en MG Casino
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Transfiere desde tu billetera virtual (Mercado Pago, Ualá) o banco, y luego sube la captura de pantalla del comprobante de transferencia para acreditar tus fichas de juego.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', flexWrap: 'wrap' }}>
            
            {/* Formulario */}
            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Medio de Pago
                </label>
                <select 
                  className="input-field"
                  value={depositMethod} 
                  onChange={(e) => setDepositMethod(e.target.value)}
                  style={{ background: '#121224', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="transferencia">Transferencia Bancaria (Cualquier Banco)</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="uala">Ualá</option>
                  <option value="crypto">Criptomonedas (USDT)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Monto Transferido ($)
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="Ej: 5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Subir Comprobante (Captura)
                </label>
                <div style={{
                  border: '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'rgba(0,0,0,0.2)'
                }}>
                  <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {file ? file.name : 'Selecciona o arrastra el archivo de captura'}
                  </p>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {depositError && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{depositError}</div>}
              {depositSuccess && <div style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{depositSuccess}</div>}

              <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px' }} disabled={depositLoading}>
                {depositLoading ? 'Enviando...' : 'Informar Depósito'}
              </button>
            </form>

            {/* Datos para Transferir */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255, 215, 0, 0.03)', border: '1px solid rgba(255, 215, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--gold)' }} />
                Datos para la Transferencia
              </h3>

              {depositMethod !== 'crypto' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Titular</span>
                    <p style={{ fontWeight: '600' }}>{paymentDetails[depositMethod].titular}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CVU</span>
                    <p style={{ fontWeight: '600', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                      {paymentDetails[depositMethod].cvu}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Alias</span>
                    <p style={{ fontWeight: '600', color: 'var(--gold)' }}>{paymentDetails[depositMethod].alias}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Billetera/Banco</span>
                    <p style={{ fontWeight: '600' }}>{paymentDetails[depositMethod].banco}</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Red Recomendada</span>
                    <p style={{ fontWeight: '600', color: 'var(--cyan)' }}>{paymentDetails.crypto.red}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Dirección de Wallet</span>
                    <p style={{ 
                      fontWeight: '600', 
                      fontFamily: 'monospace', 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      wordBreak: 'break-all'
                    }}>
                      {paymentDetails.crypto.wallet}
                    </p>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    * El saldo se acreditará al valor del dólar cripto (USDT) en pesos al momento de la aprobación.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SECCIÓN DE RETIRO */}
      {activeTab === 'withdraw' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard /> Retirar Fondos de tu Cuenta
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Tu dinero se enviará directo a tu alias o cuenta CBU/CVU bancaria. El monto mínimo de retiro es de $1000.
          </p>

          <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Medio de Retiro
                </label>
                <select 
                  className="input-field" 
                  value={withdrawMethod} 
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  style={{ background: '#121224', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="uala">Ualá</option>
                  <option value="transferencia">Transferencia CBU Bancaria</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Monto a Retirar ($)
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="Mínimo $1000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Detalles del Destinatario (CBU, CVU, Alias, Nombre Completo)
              </label>
              <textarea 
                className="input-field"
                placeholder="Ingresa tu Alias o CBU/CVU, seguido del nombre del titular de la cuenta de destino."
                value={destinationDetails}
                onChange={(e) => setDestinationDetails(e.target.value)}
                rows={3}
                required
              />
            </div>

            {withdrawError && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{withdrawError}</div>}
            {withdrawSuccess && <div style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{withdrawSuccess}</div>}

            <button type="submit" className="btn-gold" style={{ padding: '14px' }} disabled={withdrawLoading}>
              {withdrawLoading ? 'Procesando...' : 'Solicitar Retiro'}
            </button>
          </form>
        </div>
      )}

      {/* SECCIÓN DE HISTORIAL */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
          <h2 style={{ color: 'white', marginBottom: '16px' }}>Historial de Transacciones</h2>
          
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
              Aún no tienes movimientos registrados en tu billetera.
            </p>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{new Date(tx.created_at).toLocaleString('es-AR')}</td>
                      <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {tx.type === 'deposito' ? (
                          <span style={{ color: 'var(--green)' }}>Recarga (+)</span>
                        ) : (
                          <span style={{ color: 'var(--red)' }}>Retiro (-)</span>
                        )}
                      </td>
                      <td style={{ textTransform: 'uppercase' }}>{tx.method}</td>
                      <td style={{ fontWeight: 'bold' }}>
                        ${parseFloat(tx.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge badge-${tx.status}`}>
                          {tx.status === 'pending' ? 'Pendiente' : tx.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
