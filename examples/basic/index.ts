/**
 * Ejemplo básico de uso de minilog
 */
import { minilog } from '@g3yuri/minilog';

// Inicializar minilog con una API key de ejemplo
minilog.init('api_key_de_ejemplo', {
  // Configurar para enviar logs inmediatamente (sin batching)
  batchInterval: 0,
  // URL del endpoint (normalmente sería el worker de Cloudflare)
  endpoint: 'http://localhost:8787/api/v1/log',
  // Contexto global que se añadirá a todos los logs
  context: {
    source: 'ejemplo-basico',
    environment: 'desarrollo'
  },
  // Función personalizada para manejar errores
  onError: (error: Error) => {
    console.error('Error en minilog:', error.message);
  }
});

// Función auxiliar para simular eventos de usuario
function simularEventosUsuario() {
  // Simular un evento de inicio de sesión
  minilog.log('usuario.login', {
    userId: '123',
    success: true,
    method: 'password'
  });

  // Esperar 2 segundos y simular una acción de usuario
  setTimeout(() => {
    minilog.log('usuario.accion', {
      userId: '123',
      accion: 'crear_proyecto',
      projectId: 'proj_456',
      metadata: {
        nombre: 'Mi Proyecto',
        tipo: 'web'
      }
    });
  }, 2000);

  // Esperar 4 segundos y simular un evento de error
  setTimeout(() => {
    minilog.log('error.api', {
      userId: '123',
      endpoint: '/api/projects',
      statusCode: 500,
      mensaje: 'Error interno del servidor'
    });
  }, 4000);
}

// Función principal de demostración
async function ejecutarDemo() {
  console.log('Iniciando demostración de minilog...');
  
  // Simular eventos de usuario
  simularEventosUsuario();
  
  // Después de 5 segundos, cambiar la configuración
  setTimeout(() => {
    console.log('Cambiando configuración de minilog...');
    minilog.setOptions({
      batchSize: 5,
      batchInterval: 3000 // Configurar para enviar logs cada 3 segundos
    });
    
    // Generar más eventos para demostrar el batching
    for (let i = 1; i <= 10; i++) {
      minilog.log('demo.contador', { 
        contador: i,
        timestamp: Date.now()
      });
      console.log(`Evento ${i} registrado`);
    }
  }, 5000);
  
  // Forzar el envío de logs pendientes después de 15 segundos
  setTimeout(() => {
    console.log('Forzando el envío de logs pendientes...');
    minilog.flush();
    console.log('Demostración finalizada');
  }, 15000);
}

// Ejecutar la demostración
ejecutarDemo().catch(console.error); 