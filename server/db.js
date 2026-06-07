const path = require('path');
const bcrypt = require('bcryptjs');

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Requerido por la mayoría de proveedores de hosting de Postgres gratis (Render, Neon, Supabase)
    }
  });
  isPostgres = true;
  console.log('Base de datos: Conectado a PostgreSQL en la nube.');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log('Base de datos: Conectado a SQLite local.');
}

// Capa de traducción de consultas SQL SQLite -> PostgreSQL
function translateSql(sql) {
  if (!isPostgres) return sql;

  let translated = sql;

  // 1. Reemplazar INSERT OR REPLACE e INSERT OR IGNORE en settings
  if (sql.includes('INSERT OR REPLACE INTO settings')) {
    translated = `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    return translated;
  } else if (sql.includes('INSERT OR IGNORE INTO settings')) {
    translated = `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`;
    return translated;
  }

  // 2. Reemplazar INSERT OR REPLACE genérico para settings en bucles
  translated = translated.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, (match, table, cols, vals) => {
    if (table.toLowerCase() === 'settings') {
      return `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    }
    return match;
  });

  // 3. Reemplazar MAX(0.0, balance - ?) con GREATEST(0.0, balance - ?)
  translated = translated.replace(/MAX\(\s*0\.0\s*,\s*balance\s*-\s*\?\s*\)/gi, 'GREATEST(0.0, balance - ?)');
  translated = translated.replace(/max\(\s*0\.0\s*,\s*balance\s*-\s*\?\s*\)/gi, 'GREATEST(0.0, balance - ?)');

  // 4. Si es un INSERT y no contiene la cláusula RETURNING, añadirla para obtener lastID
  if (translated.trim().toUpperCase().startsWith('INSERT') && !translated.toUpperCase().includes('RETURNING')) {
    translated += ' RETURNING id';
  }

  // 5. Convertir marcadores de parámetros "?" a "$1", "$2", etc.
  let index = 1;
  translated = translated.replace(/\?/g, () => `$${index++}`);

  return translated;
}

// Promisificar las funciones de la base de datos
const dbQuery = {
  run(sql, params = []) {
    if (isPostgres) {
      const translated = translateSql(sql);
      return pgPool.query(translated, params).then(res => {
        const lastID = res.rows && res.rows[0] ? res.rows[0].id : null;
        return { lastID, changes: res.rowCount };
      });
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  },
  get(sql, params = []) {
    if (isPostgres) {
      const translated = translateSql(sql);
      return pgPool.query(translated, params).then(res => res.rows[0] || null);
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },
  all(sql, params = []) {
    if (isPostgres) {
      const translated = translateSql(sql);
      return pgPool.query(translated, params).then(res => res.rows);
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },
  exec(sql) {
    if (isPostgres) {
      return pgPool.query(sql);
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};

// Inicializar tablas
async function initDb() {
  if (isPostgres) {
    // === TABLAS PARA POSTGRESQL (PRODUCCIÓN) ===
    
    // Tabla de Usuarios
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        balance REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Depósitos
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        receipt_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla de Retiros
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        destination_details TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla de Apuestas
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        bet_amount REAL NOT NULL,
        payout_amount REAL DEFAULT 0.0,
        win INTEGER DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla de Ajustes
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

  } else {
    // === TABLAS PARA SQLITE (DESARROLLO LOCAL) ===
    
    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        balance REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        receipt_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        destination_details TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        bet_amount REAL NOT NULL,
        payout_amount REAL DEFAULT 0.0,
        win INTEGER DEFAULT 0,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await dbQuery.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  // Insertar configuraciones por defecto (funciona para ambos mediante translateSql)
  const defaultSettings = [
    { key: 'rtp_mines', value: '95' },
    { key: 'rtp_crash', value: '96' },
    { key: 'rtp_slots', value: '94' },
    { key: 'rtp_roulette', value: '97.3' },
    { key: 'admin_cvu', value: '0000003100012345678901' },
    { key: 'admin_alias', value: 'mg.casino.mp' },
    { key: 'admin_titular', value: 'MG Casino S.A.' }
  ];

  for (const setting of defaultSettings) {
    if (isPostgres) {
      await dbQuery.run(
        `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value]
      );
    } else {
      await dbQuery.run(
        `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
        [setting.key, setting.value]
      );
    }
  }

  // Crear usuario administrador por defecto si no existe
  const adminUser = await dbQuery.get(`SELECT id FROM users WHERE username = 'admin'`);
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await dbQuery.run(
      `INSERT INTO users (username, password_hash, role, balance) VALUES (?, ?, ?, ?)`,
      ['admin', hash, 'admin', 0.0]
    );
    console.log('Usuario administrador por defecto configurado (admin / admin123)');
  }
}

module.exports = {
  dbQuery,
  initDb,
  isPostgres
};
