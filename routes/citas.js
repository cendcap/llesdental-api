const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear una nueva cita (ahora usando id_usuario)
router.post('/nueva', async (req, res) => {
  const { id_usuario, fecha, hora } = req.body;
  const estado = 'reservado';

  if (!id_usuario || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  try {
    // 1. Buscar el cliente por id_usuario
    const [clienteRows] = await db.query(
      'SELECT id FROM clientes WHERE id_usuario = ?',
      [id_usuario]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado para este usuario' });
    }

    const cliente_id = clienteRows[0].id;

    // 2. Verificar si ya existe una cita en ese horario
    const [existing] = await db.query(
      'SELECT * FROM citas WHERE fecha = ? AND hora = ?',
      [fecha, hora]
    );

    if (existing.length > 0) {
      return res.status(409).json({ mensaje: 'Ya hay una cita en ese horario' });
    }

    // 3. Insertar la cita
    await db.query(
      'INSERT INTO citas (cliente_id, fecha, hora, estado) VALUES (?, ?, ?, ?)',
      [cliente_id, fecha, hora, estado]
    );

    res.status(201).json({ mensaje: 'Cita registrada correctamente' });
  } catch (err) {
    console.error('Error al guardar cita:', err);
    res.status(500).json({ mensaje: 'Error al guardar cita', error: err });
  }
});

// Obtener todas las citas
router.get('/todas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.fecha, c.hora, c.estado, cl.nombre 
      FROM citas c 
      JOIN clientes cl ON c.cliente_id = cl.id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo citas:', err);
    res.status(500).json({ mensaje: 'Error al obtener citas' });
  }
});

// Listar todas las citas ordenadas
router.get('/citas', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT c.id, c.fecha, c.hora, c.estado, cl.id AS cliente_id, cl.nombre
      FROM citas c
      JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha, c.hora
    `);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener citas:', err);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// rutas/citas.js o similar
router.get('/horas-no-disponibles', async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ mensaje: 'Falta fecha' });
    }

    // Obtener horas reservadas
    const [reservadas] = await db.query(
      'SELECT hora FROM citas WHERE fecha = ?', [fecha]
    );
    const horasReservadas = reservadas.map(r => r.hora.slice(0, 5));

    // Obtener horas bloqueadas
    const [bloqueadas] = await db.query(
      'SELECT hora FROM horarios_bloqueados WHERE fecha = ?', [fecha]
    );
    const horasBloqueadas = bloqueadas.map(b => b.hora.slice(0, 5));

    res.json({
      reservadas: horasReservadas,
      bloqueadas: horasBloqueadas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});



module.exports = router;
