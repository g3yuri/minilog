# Minilog Worker

Worker de Cloudflare para recibir y procesar logs enviados por la librería minilog.

## Características

- Recibe y almacena eventos de logging de aplicaciones
- Sistema de usuarios y proyectos
- Gestión de API keys
- Endpoints para análisis y estadísticas
- Almacenamiento eficiente en Cloudflare KV

## Estructura KV

Este worker utiliza Cloudflare KV para almacenar datos. La estructura de las claves es la siguiente:

- `user:{userId}:info` - Información del usuario
- `user:{userId}:projects` - Lista de proyectos del usuario
- `project:{projectId}:info` - Información del proyecto
- `project:{projectId}:apiKeys` - API Keys del proyecto
- `project:{projectId}:events:{date}:{eventType}` - Eventos agrupados por fecha y tipo
- `stats:{projectId}:{period}` - Estadísticas precomputadas
- `apikey:{value}` - Información de la API key

## Endpoints de la API

### Logs

- `POST /api/v1/log` - Enviar eventos de log (requiere API key)

### Usuarios

- `POST /api/v1/users` - Registrar un nuevo usuario
- `POST /api/v1/users/login` - Iniciar sesión
- `GET /api/v1/users/me` - Obtener información del usuario actual (requiere autenticación)

### Proyectos

- `POST /api/v1/projects` - Crear un nuevo proyecto (requiere autenticación)
- `GET /api/v1/projects` - Listar proyectos del usuario (requiere autenticación)
- `GET /api/v1/projects/:id` - Obtener detalles de un proyecto (requiere autenticación)
- `POST /api/v1/projects/:id/apikeys` - Crear una nueva API key (requiere autenticación)
- `GET /api/v1/projects/:id/apikeys` - Listar API keys de un proyecto (requiere autenticación)
- `DELETE /api/v1/projects/:projectId/apikeys/:keyId` - Revocar una API key (requiere autenticación)

### Analytics

- `GET /api/v1/analytics/events` - Obtener conteo de eventos (requiere API key)
- `GET /api/v1/analytics/users` - Estadísticas de usuarios activos (requiere API key)
- `GET /api/v1/analytics/projects/:projectId` - Análisis por proyecto (requiere API key)

## Despliegue

1. Configura tus namespaces KV en Cloudflare:

```bash
wrangler kv:namespace create "MINILOG_KV"
```

2. Actualiza el archivo `wrangler.toml` con tus IDs de namespace KV

3. Despliega el worker:

```bash
npm run deploy
```

## Desarrollo local

```bash
npm run dev
```

Esto iniciará un servidor local en `http://localhost:8787` 