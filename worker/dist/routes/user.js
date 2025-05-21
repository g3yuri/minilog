import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
const router = new Hono();
/**
 * Registrar un nuevo usuario
 * POST /api/v1/users
 */
router.post('/', async (c) => {
    try {
        const { email, password, name } = await c.req.json();
        // Validar campos requeridos
        if (!email || !password || !name) {
            return c.json({ error: 'Email, password y name son requeridos' }, 400);
        }
        // Verificar si el usuario ya existe
        const existingUserKey = `email:${email}`;
        const existingUser = await c.env.MINILOG_KV.get(existingUserKey);
        if (existingUser) {
            return c.json({ error: 'El email ya está registrado' }, 409);
        }
        // Generar ID y token de usuario
        const userId = `user_${uuidv4()}`;
        // En producción, debes hacer hash del password
        // Aquí simplificamos por brevedad
        const passwordHash = password; // En realidad, usar bcrypt u otra biblioteca
        // Crear objeto de usuario
        const user = {
            id: userId,
            email,
            name,
            passwordHash,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        // Guardar usuario en KV
        await c.env.MINILOG_KV.put(`user:${userId}`, JSON.stringify(user));
        // Crear índice por email para facilitar la búsqueda
        await c.env.MINILOG_KV.put(existingUserKey, userId);
        // Retornar respuesta exitosa (sin incluir el hash del password)
        const { passwordHash: _, ...safeUser } = user;
        return c.json({
            success: true,
            user: safeUser
        }, 201);
    }
    catch (error) {
        return c.json({ error: 'Error al registrar usuario' }, 500);
    }
});
/**
 * Iniciar sesión
 * POST /api/v1/users/login
 */
router.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        // Validar campos requeridos
        if (!email || !password) {
            return c.json({ error: 'Email y password son requeridos' }, 400);
        }
        // Buscar usuario por email
        const userIdKey = `email:${email}`;
        const userId = await c.env.MINILOG_KV.get(userIdKey);
        if (!userId) {
            return c.json({ error: 'Credenciales inválidas' }, 401);
        }
        // Obtener datos del usuario
        const userJson = await c.env.MINILOG_KV.get(`user:${userId}`);
        if (!userJson) {
            return c.json({ error: 'Usuario no encontrado' }, 404);
        }
        const user = JSON.parse(userJson);
        // Verificar password (en producción, usar comparación de hash)
        if (user.passwordHash !== password) {
            return c.json({ error: 'Credenciales inválidas' }, 401);
        }
        // Generar un JWT para el usuario (simplificado)
        // En producción, usar jwt.sign o similar
        const token = `jwt-${userId}-${Date.now()}`;
        // Retornar token y datos del usuario (sin el hash del password)
        const { passwordHash: _, ...safeUser } = user;
        return c.json({
            success: true,
            token,
            user: safeUser
        });
    }
    catch (error) {
        return c.json({ error: 'Error al iniciar sesión' }, 500);
    }
});
/**
 * Obtener perfil del usuario actual
 * GET /api/v1/users/me
 */
router.get('/me', async (c) => {
    try {
        // En una implementación real, validar el JWT del header
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
        // Obtener datos del usuario
        const userJson = await c.env.MINILOG_KV.get(`user:${userId}`);
        if (!userJson) {
            return c.json({ error: 'Usuario no encontrado' }, 404);
        }
        const user = JSON.parse(userJson);
        // Retornar datos del usuario (sin el hash del password)
        const { passwordHash: _, ...safeUser } = user;
        return c.json({
            success: true,
            user: safeUser
        });
    }
    catch (error) {
        return c.json({ error: 'Error al obtener perfil de usuario' }, 500);
    }
});
export { router as userRoutes };
