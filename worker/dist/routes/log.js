import { Hono } from 'hono';
import { apiKeyAuth } from '../middlewares/auth';
// Crear el router para logs
const router = new Hono();
// Todas las rutas de logs requieren autenticación
router.use('*', apiKeyAuth);
/**
 * POST /api/v1/log - Recibir y almacenar logs
 */
router.post('/', async (c) => {
    try {
        // Obtener el cuerpo de la solicitud
        const body = await c.req.json();
        // Validar el formato del log
        if (!Array.isArray(body)) {
            // Si no es un array, convertirlo en uno (para manejar logs individuales)
            const logs = [body];
            return await processLogs(c, logs);
        }
        // Procesar los logs
        return await processLogs(c, body);
    }
    catch (error) {
        return c.json({ error: 'Error al procesar logs' }, 400);
    }
});
/**
 * Procesa y almacena un array de logs en KV
 */
async function processLogs(c, logs) {
    // Obtener el ID del proyecto y usuario desde el middleware de autenticación
    const projectId = c.get('projectId');
    const userId = c.get('userId');
    if (!projectId || !userId) {
        return c.json({ error: 'Información de proyecto o usuario no disponible' }, 400);
    }
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
    const promises = logs.map(async (log) => {
        try {
            // Validar el log
            if (!log.event) {
                return { success: false, error: 'Evento requerido', log };
            }
            // Crear clave para KV con formato: project:{projectId}:events:{date}:{eventType}
            const kvKey = `project:${projectId}:events:${dateKey}:${log.event}`;
            // Verificar si ya existe una entrada para este evento y fecha
            const existingLogsJson = await c.env.MINILOG_KV.get(kvKey);
            const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
            // Agregar el nuevo log con timestamp del servidor
            const newLog = {
                ...log,
                timestamp: log.timestamp || Date.now(),
                userId,
                projectId,
                serverTime: Date.now()
            };
            // Agregar el log a la lista existente
            existingLogs.push(newLog);
            // Guardar en KV
            await c.env.MINILOG_KV.put(kvKey, JSON.stringify(existingLogs));
            // Actualizar estadísticas (opcional - puede causar límites de KV)
            await updateStats(c, projectId, log.event);
            return { success: true, log: newLog };
        }
        catch (error) {
            return { success: false, error: 'Error al procesar log', log };
        }
    });
    const results = await Promise.all(promises);
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
        return c.json({
            success: false,
            message: 'Algunos logs no pudieron ser procesados',
            processed: results.length - failures.length,
            failed: failures.length,
            failures
        }, 207); // 207 Multi-Status
    }
    return c.json({
        success: true,
        message: 'Logs procesados correctamente',
        count: results.length
    });
}
/**
 * Actualiza las estadísticas para un proyecto y evento
 */
async function updateStats(c, projectId, eventType) {
    try {
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0];
        const statsKey = `stats:${projectId}:${dateKey}`;
        // Obtener estadísticas actuales
        const statsJson = await c.env.MINILOG_KV.get(statsKey);
        const stats = statsJson ? JSON.parse(statsJson) : { events: {} };
        // Incrementar contador para este tipo de evento
        if (!stats.events[eventType]) {
            stats.events[eventType] = 0;
        }
        stats.events[eventType]++;
        // Incrementar contador total
        if (!stats.total) {
            stats.total = 0;
        }
        stats.total++;
        // Guardar estadísticas actualizadas
        await c.env.MINILOG_KV.put(statsKey, JSON.stringify(stats));
    }
    catch (error) {
        // No fallar si las estadísticas no se pueden actualizar
        // Esto asegura que los logs aún se guarden
    }
}
export { router as logRoutes };
