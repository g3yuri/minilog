import { minilog } from '@g3yuri/minilog';

// Configuración inicial
minilog.init('api_key_de_ejemplo', {
  endpoint: 'http://localhost:8787/api/v1/log',
  batchInterval: 3000, // Enviar logs cada 3 segundos
  batchSize: 5,        // O cuando acumulemos 5 eventos
  context: {
    source: 'webapp-demo',
    version: '1.0.0'
  }
});

// Generador de IDs para simular usuarios
const generateId = () => Math.random().toString(36).substring(2, 10);

// Simular un ID de usuario
let currentUserId = '';
let isLoggedIn = false;

// Referencia al elemento donde mostraremos los logs
const logDisplay = document.getElementById('log-display') as HTMLDivElement;

// Función para mostrar un log en la interfaz
function displayLog(type: string, message: string) {
  const logItem = document.createElement('div');
  logItem.className = `log-item ${type}`;
  logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logDisplay.appendChild(logItem);
  logDisplay.scrollTop = logDisplay.scrollHeight;
}

// Manejadores de eventos para los botones
document.getElementById('login')?.addEventListener('click', () => {
  if (isLoggedIn) {
    displayLog('warning', 'Ya has iniciado sesión');
    return;
  }
  
  currentUserId = generateId();
  isLoggedIn = true;
  
  // Registrar evento con minilog
  minilog.log('usuario.login', {
    userId: currentUserId,
    method: 'password',
    success: true
  });
  
  displayLog('success', `Sesión iniciada. User ID: ${currentUserId}`);
});

document.getElementById('logout')?.addEventListener('click', () => {
  if (!isLoggedIn) {
    displayLog('warning', 'No has iniciado sesión');
    return;
  }
  
  // Registrar evento con minilog
  minilog.log('usuario.logout', {
    userId: currentUserId
  });
  
  displayLog('info', `Sesión cerrada. User ID: ${currentUserId}`);
  currentUserId = '';
  isLoggedIn = false;
});

document.getElementById('create-project')?.addEventListener('click', () => {
  if (!isLoggedIn) {
    displayLog('error', 'Debes iniciar sesión primero');
    return;
  }
  
  const projectId = generateId();
  const projectName = `Proyecto ${Math.floor(Math.random() * 1000)}`;
  
  // Registrar evento con minilog
  minilog.log('proyecto.crear', {
    userId: currentUserId,
    projectId,
    projectName,
    timestamp: Date.now()
  });
  
  displayLog('success', `Proyecto creado: ${projectName} (${projectId})`);
});

document.getElementById('search')?.addEventListener('click', () => {
  const searchTerms = ['javascript', 'typescript', 'react', 'node.js', 'vue'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  // Registrar evento con minilog
  minilog.log('busqueda', {
    term,
    userId: isLoggedIn ? currentUserId : 'anonimo',
    resultCount: Math.floor(Math.random() * 100)
  });
  
  displayLog('info', `Búsqueda realizada: "${term}"`);
});

document.getElementById('error')?.addEventListener('click', () => {
  const errorTypes = ['api', 'red', 'validacion', 'autorizacion'];
  const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  
  // Registrar evento con minilog
  minilog.log('error', {
    type: errorType,
    userId: isLoggedIn ? currentUserId : 'anonimo',
    message: `Error simulado de tipo ${errorType}`,
    code: Math.floor(Math.random() * 100)
  });
  
  displayLog('error', `Error generado: ${errorType}`);
});

document.getElementById('config')?.addEventListener('click', () => {
  // Alternar entre envío inmediato y en lotes
  const currentConfig = minilog.setOptions({
    batchInterval: Math.random() > 0.5 ? 0 : 5000
  });
  
  const modoEnvio = currentConfig.batchInterval === 0 ? 'inmediato' : 'en lotes';
  
  // Registrar evento con minilog
  minilog.log('configuracion.cambio', {
    userId: isLoggedIn ? currentUserId : 'anonimo',
    modoEnvio,
    batchInterval: currentConfig.batchInterval
  });
  
  displayLog('info', `Configuración cambiada: modo ${modoEnvio}`);
});

document.getElementById('flush')?.addEventListener('click', () => {
  minilog.flush();
  displayLog('info', 'Flush manual: todos los logs pendientes han sido enviados');
});

// Mensaje inicial
displayLog('info', 'Demo de minilog iniciada. Haz clic en los botones para generar eventos.'); 