// db.js
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