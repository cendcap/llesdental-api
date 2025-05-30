const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'tu_clave_secreta'; // Usa process.env.SECRET_KEY en producción

// 🔐 LOGIN
exports.loginUsuario = async (req, res) => {
  const { nombre_usuario, password } = req.body;

  try {
    // Buscar usuario por nombre_usuario
    const [results] = await db.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = ?',
      [nombre_usuario]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const usuario = results[0];
    const isMatch = await bcrypt.compare(password, usuario.contrasena);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    let nombre_mostrar = usuario.nombre_usuario; // Por defecto
    let cedula = null;

    // Si es cliente, obtener su nombre real desde la tabla clientes
    if (usuario.rol === 'cliente') {
      const [clienteRes] = await db.query(
        'SELECT nombre,cedula FROM clientes WHERE id_usuario = ?',
        [usuario.id]
      );
      if (clienteRes.length > 0) {
        nombre_mostrar = clienteRes[0].nombre;
        cedula = clienteRes[0].cedula;
      }
    }

    // Generar token
    const token = jwt.sign({
      id: usuario.id,
      rol: usuario.rol,
      nombre_usuario: usuario.nombre_usuario,
      nombre_mostrar: nombre_mostrar
    }, SECRET_KEY, { expiresIn: '8h' });

    // Enviar respuesta con nombre_mostrar separado
    res.json({
      token,
      nombre_usuario: usuario.nombre_usuario,
      nombre_mostrar,
      rol: usuario.rol,
      cedula
    });

  } catch (err) {
    console.error('❌ Error en loginUsuario:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


// 📝 REGISTRO USUARIO Y CLIENTE RELACIONADO
exports.registrarUsuario = async (req, res) => {
  const { nombre_usuario, password, rol, nombre, cedula, celular, correo, fecha_nacimiento, id_representante } = req.body;

  if (!nombre || !cedula || !celular || !correo || !fecha_nacimiento) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let idUsuario = null;

    // Si es un adulto y tiene nombre_usuario y password, se registra en usuarios
    if (nombre_usuario && password) {
      const [existing] = await connection.query(
        'SELECT * FROM usuarios WHERE nombre_usuario = ?',
        [nombre_usuario]
      );

      if (existing.length > 0) {
        await connection.release();
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [usuarioResult] = await connection.query(
        'INSERT INTO usuarios (nombre_usuario, contrasena, rol) VALUES (?, ?, ?)',
        [nombre_usuario, hashedPassword, rol || 'cliente']
      );

      idUsuario = usuarioResult.insertId;
      console.log('✅ Usuario creado con ID:', idUsuario);
    }

    // Verificar si es menor de edad
    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const esMenor = edad < 18 || (edad === 18 && hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate()));

    if (esMenor && !id_representante) {
      await connection.release();
      return res.status(400).json({ message: 'El menor debe tener un representante asignado' });
    }

    // Insertar cliente (adulto o menor)
    const [clienteResult] = await connection.query(
      'INSERT INTO clientes (nombre, cedula, celular, correo, fecha_nacimiento, id_usuario, id_representante) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, cedula, celular, correo, fecha_nacimiento, idUsuario, id_representante || null]
    );

    console.log(`✅ Cliente registrado ${esMenor ? '(MENOR)' : '(ADULTO)'}, ID:`, clienteResult.insertId);

    await connection.commit();
    res.status(201).json({
      message: esMenor ? 'Cliente menor registrado con representante' : 'Cliente/adulto registrado correctamente',
      cliente_id: clienteResult.insertId,
      esMenor,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ Error en registrarUsuario:', err);
    res.status(500).json({ message: 'Error al registrar usuario y cliente', error: err });
  } finally {
    if (connection) await connection.release();
  }
};
