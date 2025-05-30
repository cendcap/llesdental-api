const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const citasRoutes = require('./routes/citas');

const app = express();


app.use(cors());
app.use(express.json());
app.use('/api/citas', citasRoutes);

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Si le pusiste contraseña al root, colócala aquí
  database: 'llesdental'
});

db.connect(err => {
  if (err) {
    console.error('❌ Error al conectar a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos llesdental');
  }
});

// Ruta para registrar una nueva reserva
app.post('/reservas', (req, res) => {
  const { nombre, cedula, celular, correo, fecha, hora } = req.body;

  const sql = `
    INSERT INTO reservas (nombre, cedula, celular, correo, fecha, hora)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, cedula, celular, correo, fecha, hora], (err, result) => {
    if (err) {
      console.error('❌ Error al insertar reserva:', err.message);
      res.status(500).send('Error al guardar la reserva');
    } else {
      console.log('✅ Reserva registrada con ID:', result.insertId);
      res.send({ success: true, id: result.insertId });
    }
  });
});

// Puerto del servidor
app.listen(3000, () => {
  console.log('🚀 Backend corriendo en http://localhost:3000');
});
