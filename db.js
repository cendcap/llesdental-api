/* TODO FUNCA LOCALMENTE
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'llesdental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


async function verificarConexion() {
  try {
    const connection = await pool.getConnection();
    console.log('🔌 Conectado a MySQL');
    connection.release(); // libera la conexión
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
  }
}

verificarConexion();

module.exports = pool;

*/ 

// db.js
const mysql = require('mysql2/promise');

// Carga variables de entorno desde .env si estás en desarrollo (opcional)
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'cendcap_root',
  password: process.env.DB_PASSWORD || 'devOps.2025*',
  database: process.env.DB_NAME || 'cendcap_llesdental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verifica la conexión inicial
async function verificarConexion() {
  try {
    const connection = await pool.getConnection();
    console.log('🔌 Conectado a MySQL');
    connection.release(); // libera la conexión
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
  }
}

verificarConexion();

module.exports = pool;