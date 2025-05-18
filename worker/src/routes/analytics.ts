import { Hono } from 'hono';
import { Bindings } from '../index';

const router = new Hono<{ Bindings: Bindings }>();

// Tipos para los objetos
interface EventCount {
  [key: string]: number;
}

interface DailyStats {
  date: string;
  events?: EventCount;
  total: number;
}

interface Event {
  userId?: string;
  [key: string]: any;
}

/**
 * GET /api/v1/analytics/events - Obtener conteo de eventos
 * Parámetros de consulta:
 * - days: Número de días para el análisis (por defecto: 7)
 * - project: ID del proyecto (opcional, si no se proporciona usa el de la API key)
 */
router.get('/events', async (c) => {
  try {
    const projectId = c.req.query('project') || c.get('projectId');
    const days = parseInt(c.req.query('days') || '7', 10);
    
    if (!projectId) {
      return c.json({ error: 'ID de proyecto requerido' }, 400);
    }
    
    // Generar fechas para el rango de días
    const dates = generateDateRange(days);
    
    // Obtener las estadísticas para cada día
    const statsPromises = dates.map(async (date) => {
      const statsKey = `stats:${projectId}:${date}`;
      const statsJson = await c.env.MINILOG_KV.get(statsKey);
      
      if (!statsJson) {
        return { date, events: {}, total: 0 };
      }
      
      return { date, ...JSON.parse(statsJson) };
    });
    
    const stats = await Promise.all(statsPromises);
    
    // Calcular totales
    const eventCounts: EventCount = {};
    let totalEvents = 0;
    
    stats.forEach((dayStat) => {
      if (dayStat.events) {
        Object.entries(dayStat.events).forEach(([eventType, count]) => {
          eventCounts[eventType] = (eventCounts[eventType] || 0) + Number(count);
        });
      }
      totalEvents += dayStat.total || 0;
    });
    
    return c.json({
      success: true,
      timeframe: {
        days,
        from: dates[0],
        to: dates[dates.length - 1]
      },
      total: totalEvents,
      events: eventCounts,
      daily: stats
    });
  } catch (error) {
    return c.json({ error: 'Error al obtener analíticas de eventos' }, 500);
  }
});

/**
 * GET /api/v1/analytics/users - Estadísticas de usuarios activos
 * Parámetros de consulta:
 * - days: Número de días para el análisis (por defecto: 7)
 * - project: ID del proyecto (opcional, si no se proporciona usa el de la API key)
 */
router.get('/users', async (c) => {
  try {
    const projectId = c.req.query('project') || c.get('projectId');
    const days = parseInt(c.req.query('days') || '7', 10);
    
    if (!projectId) {
      return c.json({ error: 'ID de proyecto requerido' }, 400);
    }
    
    // Generar fechas para el rango de días
    const dates = generateDateRange(days);
    
    // Obtener eventos de cada día para analizar usuarios
    const eventsPromises = dates.map(async (date) => {
      const userEvents = new Set<string>();
      
      // Obtener todas las claves de eventos para este proyecto y fecha
      const keys = await c.env.MINILOG_KV.list({ prefix: `project:${projectId}:events:${date}:` });
      
      // Para cada tipo de evento, extraer los usuarios únicos
      for (const key of keys.keys) {
        const eventsJson = await c.env.MINILOG_KV.get(key.name);
        
        if (eventsJson) {
          const events = JSON.parse(eventsJson) as Event[];
          
          // Extraer userIds únicos
          events.forEach((event: Event) => {
            if (event.userId) {
              userEvents.add(event.userId);
            }
          });
        }
      }
      
      return {
        date,
        uniqueUsers: Array.from(userEvents)
      };
    });
    
    const userStats = await Promise.all(eventsPromises);
    
    // Calcular usuarios únicos en todo el período
    const allUsers = new Set<string>();
    userStats.forEach(dayStat => {
      dayStat.uniqueUsers.forEach(userId => {
        allUsers.add(userId);
      });
    });
    
    return c.json({
      success: true,
      timeframe: {
        days,
        from: dates[0],
        to: dates[dates.length - 1]
      },
      totalUniqueUsers: allUsers.size,
      daily: userStats.map(stat => ({
        date: stat.date,
        uniqueUsers: stat.uniqueUsers.length
      }))
    });
  } catch (error) {
    return c.json({ error: 'Error al obtener estadísticas de usuarios' }, 500);
  }
});

/**
 * GET /api/v1/analytics/projects/:projectId - Análisis por proyecto
 * Proporciona una visión general del proyecto
 */
router.get('/projects/:projectId', async (c) => {
  try {
    const requestedProjectId = c.req.param('projectId');
    const authenticatedProjectId = c.get('projectId');
    
    // Verificar si el usuario tiene permisos para ver este proyecto
    // Si la API key es del mismo proyecto, permitir
    if (authenticatedProjectId !== requestedProjectId) {
      // En una implementación más completa, verificaríamos la propiedad del proyecto
      return c.json({ error: 'No tienes permisos para ver este proyecto' }, 403);
    }
    
    // Obtener datos del proyecto
    const projectJson = await c.env.MINILOG_KV.get(`project:${requestedProjectId}`);
    
    if (!projectJson) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    const project = JSON.parse(projectJson);
    
    // Obtener estadísticas de eventos (últimos 30 días)
    const days = 30;
    const dates = generateDateRange(days);
    
    const statsPromises = dates.map(async (date) => {
      const statsKey = `stats:${requestedProjectId}:${date}`;
      const statsJson = await c.env.MINILOG_KV.get(statsKey);
      
      if (!statsJson) {
        return { date, events: {}, total: 0 };
      }
      
      return { date, ...JSON.parse(statsJson) };
    });
    
    const stats = await Promise.all(statsPromises);
    
    // Calcular totales
    let totalEvents = 0;
    const eventsByType: EventCount = {};
    
    stats.forEach((dayStat) => {
      if (dayStat.events) {
        Object.entries(dayStat.events).forEach(([eventType, count]) => {
          eventsByType[eventType] = (eventsByType[eventType] || 0) + Number(count);
        });
      }
      totalEvents += dayStat.total || 0;
    });
    
    // Obtener API keys del proyecto
    const apiKeysKey = `project:${requestedProjectId}:apiKeys`;
    const apiKeysJson = await c.env.MINILOG_KV.get(apiKeysKey);
    const apiKeys = apiKeysJson ? JSON.parse(apiKeysJson) : [];
    
    // Contar API keys activas
    const activeApiKeys = apiKeys.filter((key: { active: boolean }) => key.active).length;
    
    return c.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt
      },
      overview: {
        totalEvents,
        timeframe: {
          days,
          from: dates[0],
          to: dates[dates.length - 1]
        },
        apiKeys: {
          total: apiKeys.length,
          active: activeApiKeys
        }
      },
      eventsByType,
      dailyStats: stats.map(stat => ({
        date: stat.date,
        total: stat.total || 0
      }))
    });
  } catch (error) {
    return c.json({ error: 'Error al obtener análisis del proyecto' }, 500);
  }
});

/**
 * Genera un array de strings de fechas en formato YYYY-MM-DD
 * para un rango de días desde hoy hacia atrás
 */
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Ordenar las fechas de más antigua a más reciente
  return dates.reverse();
}

export { router as analyticsRoutes }; 