# Prompt: Creación de librería minilog para NPM con worker Cloudflare

## Descripción general
Necesito que crees una librería JavaScript llamada "minilog" para publicar en NPM. Esta librería permitirá a los desarrolladores registrar eventos y acciones de sus aplicaciones de manera simple. Además, quiero un worker de Cloudflare que reciba y procese los datos enviados por la librería.

## Parte 1: Librería minilog para NPM

### Características principales:
1. **Instalación simple**: Debe poder instalarse con `npm install minilog`
2. **API sencilla**: La implementación básica debe ser como esta:
   ```js
   import { minilog } from 'minilog';

   minilog.init('TU_API_KEY');
   minilog.log('usuario.login', { userId: '123', success: true });
   ```

3. **Autenticación con API Keys**: Cada usuario/proyecto tendrá su propia API key.
4. **Estructura de datos coherente**: Debe enviar los logs con un formato uniforme.
5. **Manejo de errores**: Incluir gestión de errores para fallos de red, API keys inválidas, etc.
6. **Compresión y batching**: Debe poder agrupar logs para reducir llamadas a la API.
7. **Configuración opcional**: Permitir personalizar comportamientos como niveles de log, intervalos de envío, etc.

### Funcionalidades específicas:
- `init(apiKey, options)`: Inicializa la librería con la API key del usuario y opciones.
- `log(event, data)`: Registra un evento con datos asociados.
- `setOptions(options)`: Actualiza la configuración.
- `flush()`: Envía inmediatamente los logs en espera (útil antes de cerrar la app).

### Requisitos técnicos:
- Debe ser compatible con ESM y CommonJS.
- Tamaño pequeño (< 10KB si es posible).
- Cero o mínimas dependencias externas.
- Compatible con navegadores modernos y Node.js.
- TypeScript: Incluir tipos para mejor DX.

## Parte 2: Worker Cloudflare con Hono

### Funcionalidades del Worker:
1. **Endpoint para recibir logs**: `/api/v1/log`
2. **Autenticación**: Validar API keys antes de procesar logs.
3. **Almacenamiento en KV**: Guardar eventos usando Cloudflare KV.
4. **Estructura de datos en KV**:
   - Organización por usuario, proyecto y tipo de evento.
   - Formato que facilite consultas para análisis.
5. **Endpoints para análisis**:
   - `/api/v1/analytics/events`: Obtener conteo de eventos.
   - `/api/v1/analytics/users`: Estadísticas de usuarios activos.
   - `/api/v1/analytics/projects/:projectId`: Análisis por proyecto.

### Sistema de usuarios y proyectos:
1. **Registro de usuarios**: Endpoint para crear cuentas.
2. **Gestión de proyectos**: Crear, listar y eliminar proyectos.
3. **Generación de API keys**: Crear y revocar API keys por proyecto.

### Requisitos técnicos del Worker:
- Framework Hono para gestión de rutas y middleware.
- Uso eficiente de Cloudflare KV para almacenamiento.
- Optimización para minimizar el consumo de recursos.
- Seguridad: CORS, rate limiting, validación de entradas.
- Estructura modular para facilitar extensiones futuras.

## Requisitos de código:
- Código limpio y bien documentado.
- Tests unitarios y de integración para ambas partes.
- README detallado con ejemplos de uso.
- Guía de instalación y configuración.
- Ejemplos de casos de uso comunes.

## Ejemplos de estructura de datos:

### Formato de log enviado al worker:
```json
{
  "apiKey": "project_123abc",
  "timestamp": 1621234567890,
  "event": "usuario.login",
  "data": {
    "userId": "123",
    "success": true,
    "ipAddress": "192.168.1.1"
  },
  "context": {
    "userAgent": "Mozilla/5.0...",
    "source": "web-app"
  }
}
```

### Estructura KV sugerida:
- `user:{userId}:info` - Información del usuario
- `user:{userId}:projects` - Lista de proyectos
- `project:{projectId}:apiKeys` - API Keys del proyecto
- `project:{projectId}:events:{date}:{eventType}` - Eventos agrupados por fecha y tipo
- `stats:{projectId}:{period}` - Estadísticas precomputadas

Por favor, implementa la librería minilog para NPM y el worker de Cloudflare con Hono siguiendo estas especificaciones.