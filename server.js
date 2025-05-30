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


app.listen(3000, () => {
  console.log('🚀 Servidor backend corriendo en http://localhost:3000');
});
