# Ejemplos de Minilog

Este directorio contiene varios ejemplos que muestran cómo usar la librería Minilog en diferentes contextos.

## Requisitos

Para ejecutar estos ejemplos, necesitas:

1. Node.js (versión 14 o superior)
2. npm o yarn

## Estructura

- **basic**: Ejemplo básico en Node.js que muestra el uso fundamental de la API de Minilog
- **web-app**: Una aplicación web con una interfaz que demuestra el uso de Minilog en el navegador
- **node-backend**: Un servidor Express que muestra cómo integrar Minilog en un backend

## Configuración

Cada ejemplo está vinculado al proyecto principal a través de enlaces locales de npm. Para configurar:

1. Construye el proyecto principal:
   ```bash
   # En la raíz del proyecto
   npm install
   npm run build
   ```

2. Instala las dependencias de cada ejemplo:
   ```bash
   # Por ejemplo, para el ejemplo básico
   cd examples/basic
   npm install
   ```

## Ejecutando los ejemplos

### Ejemplo básico

```bash
cd examples/basic
npm start
```

Este ejemplo muestra el uso básico de la API, registrando varios tipos de eventos.

### Aplicación web

```bash
cd examples/web-app
npm start
```

Abre tu navegador en `http://localhost:5173` para ver la demostración interactiva.

### Backend con Node.js

```bash
cd examples/node-backend
npm start
```

El servidor se iniciará en `http://localhost:3000`. Puedes probar las siguientes rutas:
- `GET /`: Página principal
- `POST /users`: Crear un usuario (envía un JSON con `username` y `email`)
- `GET /error`: Ruta que simula un error

## Notas

Para que estos ejemplos funcionen correctamente:

1. Asegúrate de que el worker de Cloudflare esté en ejecución en `http://localhost:8787` o actualiza la URL del endpoint en cada ejemplo.
2. Si no tienes el worker en ejecución, los logs se intentarán enviar pero fallarán (esto es normal y parte de la demostración del manejo de errores).

## Depuración

Puedes ver los logs que se envían a través de las herramientas de desarrollo del navegador (en la pestaña Red/Network) para los ejemplos web, o en la consola para los ejemplos de Node.js. 