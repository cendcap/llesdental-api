const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'tu_clave_secreta'; 
// Registrar nuevo cliente
router.post('/', async (req, res) => {
  const { nombre, cedula, celular, correo } = req.body;

  if (!nombre || !cedula) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  try {
    const [clientes] = await db.query("SELECT * FROM clientes WHERE cedula = ?", [cedula]);

    if (clientes.length === 0) {
      const hashedPassword = await bcrypt.hash(cedula, 10); // Contraseña temporal = cédula
      await db.query(
        "INSERT INTO clientes (nombre, cedula, celular, correo, contraseña) VALUES (?, ?, ?, ?, ?)",
        [nombre, cedula, celular, correo, hashedPassword]
      );
      return res.json({ message: 'Cliente registrado exitosamente' });
    }

    res.json({ message: 'Cliente ya existe' });
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login del cliente
// Login del cliente
router.post('/login', async (req, res) => {
  const { cedula, contraseña } = req.body;

  if (!cedula || !contraseña) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  try {
    const [rows] = await db.query("SELECT * FROM clientes WHERE cedula = ?", [cedula]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = rows[0];
    const validPassword = await bcrypt.compare(contraseña, cliente.contraseña);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 🔐 Generar el token (opcional para clientes)
    const token = jwt.sign({
      id: cliente.id_cliente,
      nombre: cliente.nombre,
      rol: 'cliente'
    }, SECRET_KEY, { expiresIn: '1h' });

    // ✅ Devolver todos los datos necesarios
    res.json({
      message: 'Login exitoso',
      token,
      tipo: 'cliente',
      id_cliente: cliente.id_cliente,
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      celular: cliente.celular,
      correo: cliente.correo,
      id_usuario: cliente.id_usuario
    });

  } catch (error) {
    console.error('Error al autenticar cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


router.get('/cedula/:cedula', async (req, res) => {
  const cedula = req.params.cedula;

  try {
    const [rows] = await db.execute(
      'SELECT nombre FROM clientes WHERE cedula = ?',
      [cedula]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al buscar cliente por cédula:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/registrar-menor', async (req, res) => {
const { nombre, cedula, celular, correo, fechaNacimiento, id_representante } = req.body;

  if (!nombre || !cedula || !fechaNacimiento || !id_representante) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const edad = calcularEdad(fechaNacimiento);
  if (edad >= 18) {
    return res.status(400).json({ message: 'El usuario no es menor de edad' });
  }

  try {
    const connection = await db.getConnection();

    // Insertar al menor
    await connection.query(
      `INSERT INTO clientes (nombre, cedula, celular, correo, fecha_nacimiento, id_representante) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, cedula, celular, correo, fechaNacimiento, id_representante]
    );

    await connection.release();
    return res.status(201).json({ message: 'Menor registrado correctamente' });
  } catch (err) {
    console.error('❌ Error al registrar menor:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
});
// Función para calcular la edad
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

module.exports = router;
