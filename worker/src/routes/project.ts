import { Hono } from 'hono';
import { Bindings } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = new Hono<{ Bindings: Bindings }>();

/**
 * Middleware para validar JWT y extraer userId
 */
async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Se requiere autenticación' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Simplificación - Extraer userId del token
    // En producción, verificar firma del JWT
    const userId = token.split('-')[1];
    
    if (!userId) {
      return c.json({ error: 'Token inválido' }, 401);
    }
    
    // Verificar si usuario existe
    const userJson = await c.env.MINILOG_KV.get(`user:${userId}`);
    
    if (!userJson) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    
    c.set('userId', userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Error de autenticación' }, 500);
  }
}

// Importamos Context y Next que faltan en el middleware
import { Context, Next } from 'hono';

// Todas las rutas de proyectos requieren autenticación
router.use('*', authMiddleware);

/**
 * Crear un nuevo proyecto
 * POST /api/v1/projects
 */
router.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const { name, description } = await c.req.json();
    
    // Validar campos requeridos
    if (!name) {
      return c.json({ error: 'El nombre del proyecto es requerido' }, 400);
    }
    
    // Generar ID de proyecto
    const projectId = `project_${uuidv4()}`;
    
    // Crear objeto de proyecto
    const project = {
      id: projectId,
      name,
      description: description || '',
      ownerId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Guardar proyecto en KV
    await c.env.MINILOG_KV.put(`project:${projectId}`, JSON.stringify(project));
    
    // Añadir proyecto a la lista de proyectos del usuario
    const userProjectsKey = `user:${userId}:projects`;
    const userProjectsJson = await c.env.MINILOG_KV.get(userProjectsKey);
    const userProjects = userProjectsJson ? JSON.parse(userProjectsJson) : [];
    
    userProjects.push(projectId);
    await c.env.MINILOG_KV.put(userProjectsKey, JSON.stringify(userProjects));
    
    // Crear una API key para el proyecto
    const apiKey = await createApiKey(c, projectId, userId, `Default API Key for ${name}`);
    
    return c.json({
      success: true,
      project,
      apiKey
    }, 201);
  } catch (error) {
    return c.json({ error: 'Error al crear proyecto' }, 500);
  }
});

/**
 * Obtener todos los proyectos del usuario
 * GET /api/v1/projects
 */
router.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    
    // Obtener IDs de proyectos del usuario
    const userProjectsKey = `user:${userId}:projects`;
    const userProjectsJson = await c.env.MINILOG_KV.get(userProjectsKey);
    
    if (!userProjectsJson) {
      return c.json({ projects: [] });
    }
    
    const projectIds = JSON.parse(userProjectsJson) as string[];
    
    // Obtener detalles de cada proyecto
    const projectPromises = projectIds.map(async (projectId: string) => {
      const projectJson = await c.env.MINILOG_KV.get(`project:${projectId}`);
      return projectJson ? JSON.parse(projectJson) : null;
    });
    
    const projects = (await Promise.all(projectPromises)).filter(Boolean);
    
    return c.json({ projects });
  } catch (error) {
    return c.json({ error: 'Error al obtener proyectos' }, 500);
  }
});

/**
 * Obtener un proyecto específico
 * GET /api/v1/projects/:id
 */
router.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    
    // Verificar si el proyecto existe
    const projectJson = await c.env.MINILOG_KV.get(`project:${projectId}`);
    
    if (!projectJson) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    const project = JSON.parse(projectJson);
    
    // Verificar si el usuario tiene acceso al proyecto
    if (project.ownerId !== userId) {
      return c.json({ error: 'No tienes permisos para acceder a este proyecto' }, 403);
    }
    
    return c.json({ project });
  } catch (error) {
    return c.json({ error: 'Error al obtener proyecto' }, 500);
  }
});

/**
 * Crear una nueva API key para un proyecto
 * POST /api/v1/projects/:id/apikeys
 */
router.post('/:id/apikeys', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const { name } = await c.req.json();
    
    // Verificar si el proyecto existe y pertenece al usuario
    const projectJson = await c.env.MINILOG_KV.get(`project:${projectId}`);
    
    if (!projectJson) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    const project = JSON.parse(projectJson);
    
    if (project.ownerId !== userId) {
      return c.json({ error: 'No tienes permisos para este proyecto' }, 403);
    }
    
    // Crear API key
    const apiKey = await createApiKey(c, projectId, userId, name || 'API Key');
    
    return c.json({
      success: true,
      apiKey
    }, 201);
  } catch (error) {
    return c.json({ error: 'Error al crear API key' }, 500);
  }
});

/**
 * Obtener todas las API keys de un proyecto
 * GET /api/v1/projects/:id/apikeys
 */
router.get('/:id/apikeys', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    
    // Verificar si el proyecto existe y pertenece al usuario
    const projectJson = await c.env.MINILOG_KV.get(`project:${projectId}`);
    
    if (!projectJson) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    const project = JSON.parse(projectJson);
    
    if (project.ownerId !== userId) {
      return c.json({ error: 'No tienes permisos para este proyecto' }, 403);
    }
    
    // Obtener API keys del proyecto
    const apiKeysKey = `project:${projectId}:apiKeys`;
    const apiKeysJson = await c.env.MINILOG_KV.get(apiKeysKey);
    
    if (!apiKeysJson) {
      return c.json({ apiKeys: [] });
    }
    
    const apiKeys = JSON.parse(apiKeysJson);
    
    return c.json({ apiKeys });
  } catch (error) {
    return c.json({ error: 'Error al obtener API keys' }, 500);
  }
});

/**
 * Revocar una API key
 * DELETE /api/v1/projects/:projectId/apikeys/:keyId
 */
router.delete('/:projectId/apikeys/:keyId', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const keyId = c.req.param('keyId');
    
    // Verificar si el proyecto existe y pertenece al usuario
    const projectJson = await c.env.MINILOG_KV.get(`project:${projectId}`);
    
    if (!projectJson) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    const project = JSON.parse(projectJson);
    
    if (project.ownerId !== userId) {
      return c.json({ error: 'No tienes permisos para este proyecto' }, 403);
    }
    
    // Obtener API keys del proyecto
    const apiKeysKey = `project:${projectId}:apiKeys`;
    const apiKeysJson = await c.env.MINILOG_KV.get(apiKeysKey);
    
    if (!apiKeysJson) {
      return c.json({ error: 'API key no encontrada' }, 404);
    }
    
    const apiKeys = JSON.parse(apiKeysJson);
    
    // Encontrar la API key
    const keyIndex = apiKeys.findIndex((k: { id: string }) => k.id === keyId);
    
    if (keyIndex === -1) {
      return c.json({ error: 'API key no encontrada' }, 404);
    }
    
    // Obtener la key value para eliminarla
    const keyValue = apiKeys[keyIndex].key;
    
    // Marcar como inactiva (alternativa a eliminar)
    apiKeys[keyIndex].active = false;
    apiKeys[keyIndex].revokedAt = Date.now();
    
    // Actualizar lista en KV
    await c.env.MINILOG_KV.put(apiKeysKey, JSON.stringify(apiKeys));
    
    // Actualizar o eliminar el índice de la API key
    const apiKeyData = await c.env.MINILOG_KV.get(`apikey:${keyValue}`);
    
    if (apiKeyData) {
      const keyData = JSON.parse(apiKeyData);
      keyData.active = false;
      keyData.revokedAt = Date.now();
      await c.env.MINILOG_KV.put(`apikey:${keyValue}`, JSON.stringify(keyData));
    }
    
    return c.json({
      success: true,
      message: 'API key revocada correctamente'
    });
  } catch (error) {
    return c.json({ error: 'Error al revocar API key' }, 500);
  }
});

// Definir interfaz para las API keys
interface ApiKey {
  id: string;
  key: string;
  name: string;
  projectId: string;
  userId: string;
  active: boolean;
  createdAt: number;
  revokedAt?: number;
}

/**
 * Función auxiliar para crear una API key
 */
async function createApiKey(
  c: Context<{ Bindings: Bindings }>, 
  projectId: string, 
  userId: string, 
  name: string
): Promise<ApiKey> {
  // Generar API key única
  const keyValue = `pk_${uuidv4().replace(/-/g, '')}`;
  const keyId = `key_${uuidv4()}`;
  
  // Crear objeto de API key
  const apiKey: ApiKey = {
    id: keyId,
    key: keyValue,
    name,
    projectId,
    userId,
    active: true,
    createdAt: Date.now()
  };
  
  // Guardar API key en KV con referencia al proyecto y usuario
  await c.env.MINILOG_KV.put(`apikey:${keyValue}`, JSON.stringify(apiKey));
  
  // Añadir key a la lista de keys del proyecto
  const projectKeysKey = `project:${projectId}:apiKeys`;
  const projectKeysJson = await c.env.MINILOG_KV.get(projectKeysKey);
  const projectKeys = projectKeysJson ? JSON.parse(projectKeysJson) : [];
  
  projectKeys.push(apiKey);
  await c.env.MINILOG_KV.put(projectKeysKey, JSON.stringify(projectKeys));
  
  return apiKey;
}

export { router as projectRoutes }; 