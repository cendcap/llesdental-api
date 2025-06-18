// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta de login
router.post('/login', usuarioController.loginUsuario);
router.post('/crear', usuarioController.registrarUsuario);
router.post('/crear-admin', usuarioController.crearAdministrador);


module.exports = router;    