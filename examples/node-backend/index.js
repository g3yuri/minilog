/**
 * Ejemplo de uso de minilog en un backend de Node.js con Express
 */

import express from 'express';
import { minilog } from '@g3yuri/minilog';

// Inicializar minilog
minilog.init('api_key_de_ejemplo', {
  endpoint: 'http://localhost:8787/api/v1/log',
  batchInterval: 10000, // Enviar logs cada 10 segundos (más adecuado para backend)
  context: {
    service: 'api-backend',
    environment: 'development'
  }
});

const app = express();
app.use(express.json());

// Middleware para logging de solicitudes
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Cuando finalice la solicitud
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Registrar evento con minilog
    minilog.log('api.request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Rutas de ejemplo
app.get('/', (req, res) => {
  minilog.log('api.home', { message: 'Página principal visitada' });
  res.json({ message: 'API de ejemplo funcionando correctamente' });
});

app.post('/users', (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Validar datos
    if (!username || !email) {
      minilog.log('api.error', { 
        type: 'validation',
        message: 'Datos incompletos'
      });
      
      return res.status(400).json({ error: 'Se requiere username y email' });
    }
    
    // Simular creación de usuario
    const userId = Math.random().toString(36).substring(2, 15);
    
    // Registrar evento exitoso
    minilog.log('usuario.crear', {
      userId,
      username,
      email
    });
    
    res.status(201).json({ 
      message: 'Usuario creado con éxito',
      userId 
    });
  } catch (error) {
    // Registrar error
    minilog.log('api.error', {
      type: 'server',
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta que simula un error
app.get('/error', (req, res) => {
  minilog.log('api.error_simulado', {
    message: 'Error simulado para demostración'
  });
  
  res.status(500).json({ error: 'Error simulado para demostración' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  minilog.log('api.error', {
    type: 'server',
    message: err.message,
    stack: err.stack
  });
  
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  
  // Registrar evento de inicio
  minilog.log('servidor.inicio', {
    port: PORT,
    timestamp: new Date().toISOString()
  });
  
  console.log('minilog configurado y listo para registrar eventos');
  
  // Asegurar que los logs pendientes se envíen al cerrar
  process.on('SIGINT', () => {
    console.log('Cerrando servidor y enviando logs pendientes...');
    minilog.flush().then(() => {
      process.exit(0);
    });
  });
}); 