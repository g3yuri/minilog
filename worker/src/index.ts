import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logRoutes } from './routes/log';
import { analyticsRoutes } from './routes/analytics';
import { userRoutes } from './routes/user';
import { projectRoutes } from './routes/project';
import { apiKeyAuth } from './middlewares/auth';

// Declaración del tipo KVNamespace para Cloudflare
// interface KVNamespace {
//   get(key: string): Promise<string | null>;
//   put(key: string, value: string): Promise<void>;
//   delete(key: string): Promise<void>;
//   list(options?: { prefix?: string, limit?: number, cursor?: string }): Promise<{ keys: { name: string }[], list_complete: boolean, cursor?: string }>;
// }

// Definir tipos para el entorno del worker
export type Bindings = {
  MINILOG_KV: KVNamespace;
  JWT_SECRET: string;
}

// Tipos para variables en el contexto
declare module 'hono' {
  interface ContextVariableMap {
    projectId: string;
    userId: string;
  }
}

// Crear la aplicación Hono
const app = new Hono<{ Bindings: Bindings }>();

// Configurar CORS
app.use('*', cors({
  origin: ['*'], // En producción, limitar a dominios específicos
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 horas
}));

// Rutas de la API (versión 1)
const api = app.basePath('/api/v1');

// Rutas para logs (requieren autenticación por API key)
api.route('/log', logRoutes);

// Rutas para usuarios (registro, login, etc.)
api.route('/users', userRoutes);

// Rutas para proyectos
api.route('/projects', projectRoutes);

// Rutas para analytics (requieren autenticación)
const analytics = api.basePath('/analytics');
analytics.use('*', apiKeyAuth);
analytics.route('/', analyticsRoutes);

// Ruta para verificar salud del servicio
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Ruta principal para información básica
app.get('/', (c) => {
  return c.json({
    service: 'minilog-worker',
    version: '0.1.0',
    docs: 'https://github.com/yourusername/minilog/tree/main/docs',
  });
});

// Handler para exportar a Cloudflare Worker
export default app; 