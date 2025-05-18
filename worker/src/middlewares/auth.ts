import { Context, Env, Next } from 'hono';
import { Bindings } from '../index';

/**
 * Middleware para verificar la API key en el header de autorización
 */
export async function apiKeyAuth(c: Context<{ Bindings: Bindings }>, next: Next) {
  // Obtener el header de autorización
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '') || 
                 c.req.query('apiKey');

  if (!apiKey) {
    return c.json({ error: 'Se requiere una API key' }, 401);
  }

  try {
    // Validar la API key contra KV
    // Formato de la clave: apikey:{apiKey}
    const apiKeyData = await c.env.MINILOG_KV.get(`apikey:${apiKey}`);
    
    if (!apiKeyData) {
      return c.json({ error: 'API key inválida' }, 401);
    }

    // Parsear los datos de la API key
    const keyInfo = JSON.parse(apiKeyData);
    
    // Verificar si la API key está activa
    if (!keyInfo.active) {
      return c.json({ error: 'API key inactiva o revocada' }, 401);
    }

    // Adjuntar información del proyecto y usuario a la solicitud para uso en rutas posteriores
    c.set('projectId', keyInfo.projectId);
    c.set('userId', keyInfo.userId);
    
    // Continuar con la siguiente función en la cadena
    await next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    return c.json({ error: 'Error de autenticación' }, 500);
  }
} 