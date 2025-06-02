const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const usuariosRoutes = require('./routes/usuarios');
const citasRoutes = require('./routes/citas');
const clientesRoutes = require('./routes/clientes');


const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/clientes', clientesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
