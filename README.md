# Minilog - Sistema de Logging para Aplicaciones

Este repositorio contiene dos componentes principales:

1. **Librería minilog para NPM**: Una librería JavaScript para registrar eventos y acciones de aplicaciones de manera simple.
2. **Worker de Cloudflare con Hono**: Un worker que recibe y procesa los datos enviados por la librería.

## Librería minilog

Una librería JavaScript ligera para enviar logs de eventos a un endpoint centralizado.

```javascript
import { minilog } from 'minilog';

// Inicializar con tu API key
minilog.init('TU_API_KEY');

// Registrar eventos
minilog.log('usuario.login', { userId: '123', success: true });
```

Para más detalles, consulta el [README de la librería](/README.md).

## Worker de Cloudflare

El worker recibe los logs enviados por la librería, los almacena en Cloudflare KV y proporciona APIs para gestionar proyectos, API keys y análisis.

Características principales:
- Sistema de usuarios y proyectos
- Gestión de API keys
- Endpoints para análisis de datos

Para más detalles, consulta el [README del worker](/worker/README.md).

## Estructura del Proyecto

```
minilog/
├── src/                  # Código fuente de la librería
│   ├── index.ts          # Punto de entrada de la librería
│   └── index.test.ts     # Tests unitarios
├── worker/               # Código del worker de Cloudflare
│   ├── src/              # Código fuente del worker
│   │   ├── index.ts      # Punto de entrada del worker
│   │   ├── middlewares/  # Middlewares (auth, etc.)
│   │   ├── routes/       # Rutas de la API
│   │   ├── models/       # Modelos de datos
│   │   └── utils/        # Utilidades
│   ├── wrangler.toml     # Configuración del worker
│   └── package.json      # Dependencias del worker
├── dist/                 # Código compilado de la librería (generado)
├── package.json          # Dependencias de la librería
└── tsconfig.json         # Configuración de TypeScript
```

## Instalación y Uso

### Librería minilog

```bash
npm install minilog
```

### Worker de Cloudflare

1. Clona este repositorio
2. Configura Cloudflare Wrangler
3. Crea tus namespaces KV
4. Despliega el worker

Para instrucciones detalladas, consulta el [README del worker](/worker/README.md).

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/g3yuri/minilog)

## Licencia

CC-BY-NC