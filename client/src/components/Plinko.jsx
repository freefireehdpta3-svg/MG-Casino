import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext, BACKEND_URL } from '../App';
import { Play, Disc, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Plinko() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [betAmount, setBetAmount] = useState('100');
  const [rows, setRows] = useState(12);

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  
  const [multiplier, setMultiplier] = useState(null);
  const [payout, setPayout] = useState(0);

  // Multiplicadores por fila (para pintar los buckets)
  const multipliersList = {
    8: [5.6, 1.6, 1.1, 0.6, 0.3, 0.6, 1.1, 1.6, 5.6],
    12: [33, 11, 4, 1.5, 0.8, 0.4, 0.2, 0.4, 0.8, 1.5, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  };

  useEffect(() => {
    drawStaticBoard();
  }, [rows]);

  // Dibujar tablero estático inicial
  const drawStaticBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Pintar fondo del paño
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, width, height);

    // Dibujar clavos (Pegs)
    const startY = 40;
    const rowSpacing = (height - 100) / rows;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let r = 0; r <= rows; r++) {
      const pinsInRow = r + 3;
      const rowWidth = (pinsInRow - 1) * 26;
      const startX = (width - rowWidth) / 2;

      // No dibujar clavos en la última fila porque ahí van los buckets
      if (r === rows) continue;

      for (let p = 0; p < pinsInRow; p++) {
        const x = startX + p * 26;
        const y = startY + r * rowSpacing;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dibujar los Buckets de abajo
    drawBuckets(ctx, width, height, rowSpacing, startY);
  };

  // Pintar cajones de multiplicadores
  const drawBuckets = (ctx, width, height, rowSpacing, startY) => {
    const list = multipliersList[rows];
    const pinsInLastRow = rows + 3;
    const rowWidth = (pinsInLastRow - 1) * 26;
    const startX = (width - rowWidth) / 2;
    const y = startY + rows * rowSpacing - 10;
    const bucketWidth = 24;

    list.forEach((val, idx) => {
      const x = startX + idx * 26 - bucketWidth / 2;
      
      // Color según multiplicador
      let color = '#ff7782'; // Rojo (Pérdida)
      if (val >= 1.5) color = '#dbbd4e'; // Oro (Ganancia)
      if (val >= 10) color = '#41f1b6'; // Verde (Gran Ganancia)
      if (val < 1.0 && val >= 0.5) color = '#7f7f9c'; // Gris

      ctx.fillStyle = color;
      ctx.beginPath();
      // Dibujar caja redonda
      ctx.roundRect(x, y, bucketWidth, 18, 4);
      ctx.fill();

      // Texto
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val + 'x', x + bucketWidth / 2, y + 9);
    });
  };

  const playPlinko = async (e) => {
    e.preventDefault();
    if (isPlaying) return;

    setError('');
    setMultiplier(null);
    setIsPlaying(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/games/plinko/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          betAmount: parseFloat(betAmount),
          rows: parseInt(rows)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al jugar Plinko');

      // Iniciar animación de la bola
      animateBallDrop(data.path, data.multiplier, data.payoutAmount);
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
    }
  };

  const animateBallDrop = (path, finalMultiplier, payoutAmount) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const startY = 40;
    const rowSpacing = (height - 100) / rows;
    
    // Coordenadas iniciales de la bola (Cae desde arriba al centro)
    let ballX = width / 2;
    let ballY = 15;
    
    // Generar coordenadas clave basadas en los rebotes definidos por el servidor
    // Para cada fila, sabemos si la bola rebota a la izquierda (0) o derecha (1)
    const points = [{ x: ballX, y: ballY }];
    
    let currentPinIdx = 1; // Fila 0 empieza con 3 pins (índice central es 1)
    for (let r = 0; r < rows; r++) {
      const nextPinsCount = r + 4;
      const rowWidth = (nextPinsCount - 1) * 26;
      const startX = (width - rowWidth) / 2;

      // El rebote decide a qué pin de la siguiente fila va la bola
      const choice = path[r]; // 0 para ir a la izquierda, 1 para ir a la derecha
      if (choice === 1) {
        currentPinIdx += 1;
      }
      
      const targetX = startX + currentPinIdx * 26;
      const targetY = startY + (r + 1) * rowSpacing;

      // Añadimos un punto intermedio curvo para simular el rebote parabólico
      const prev = points[points.length - 1];
      const midX = (prev.x + targetX) / 2 + (choice === 1 ? -4 : 4); // Desvío leve
      const midY = (prev.y + targetY) / 2 - 6;

      points.push({ x: midX, y: midY });
      points.push({ x: targetX, y: targetY });
    }

    // Último punto: entrar al bucket de forma vertical
    const last = points[points.length - 1];
    points.push({ x: last.x, y: last.y + 12 });

    let currentFrame = 0;
    const totalFramesPerStep = 6; // velocidad de animación
    const totalPoints = points.length;

    const runAnimation = () => {
      // Dibujar fondo estático primero
      drawStaticBoard();

      // Calcular la posición interpolada de la bola
      const pointIndex = Math.floor(currentFrame / totalFramesPerStep);
      const subFrame = currentFrame % totalFramesPerStep;

      if (pointIndex < totalPoints - 1) {
        const pA = points[pointIndex];
        const pB = points[pointIndex + 1];
        const t = subFrame / totalFramesPerStep;

        // Interpolación lineal
        ballX = pA.x + (pB.x - pA.x) * t;
        ballY = pA.y + (pB.y - pA.y) * t;

        // Dibujar bola roja
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff7782'; // Bola roja
        ctx.shadowColor = 'rgba(255, 119, 130, 0.4)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        currentFrame++;
        requestAnimationFrame(runAnimation);
      } else {
        // La bola llegó al bucket final
        setMultiplier(finalMultiplier);
        setPayout(payoutAmount);
        setIsPlaying(false);
        refreshBalance();

        if (finalMultiplier >= 1.5) {
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.75 },
            colors: ['#dbbd4e', '#ffffff']
          });
        }
      }
    };

    runAnimation();
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
      {/* PANEL DE OPERACIÓN */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc style={{ color: 'var(--gold)' }} /> Plinko
        </h2>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '0.85rem', background: 'rgba(255,23,68,0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={playPlinko} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Filas de Clavos (Rows)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[8, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={rows === num ? 'btn-gold' : 'btn-outline'}
                  onClick={() => setRows(num)}
                  disabled={isPlaying}
                  style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem' }}
                >
                  {num} Filas
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-gold" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 'bold' }} 
            disabled={isPlaying}
          >
            {isPlaying ? 'Cayendo bola...' : 'Soltar Bola'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
          <p>✔️ Selecciona el número de filas (más filas aumentan el multiplicador máximo en los bordes).</p>
          <p>✔️ Presiona "Soltar Bola" para lanzar una bola roja desde el centro superior.</p>
        </div>
      </div>

      {/* CANVAS DEL TABLERO */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <canvas 
          ref={canvasRef} 
          width={450} 
          height={480} 
          style={{ 
            width: '100%', 
            maxWidth: '450px', 
            borderRadius: '12px', 
            background: '#08080f', 
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' 
          }}
        />

        {/* Banner de Resultado */}
        {multiplier !== null && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resultado del lanzamiento</span>
            <h3 style={{ 
              fontSize: '1.75rem', 
              color: multiplier >= 1.0 ? 'var(--green)' : 'var(--text-muted)',
              fontWeight: 'bold',
              marginTop: '4px'
            }}>
              {multiplier}x {multiplier >= 1.0 ? `(+$${payout.toFixed(2)})` : ''}
            </h3>
          </div>
        )}
      </div>

    </div>
  );
}
