/**
 * minilog - Una librería simple para registrar eventos
 */

export interface MinilogOptions {
  /** URL del endpoint para enviar logs (por defecto a Cloudflare Worker) */
  endpoint?: string;
  /** Intervalo en ms para enviar logs en batch (0 = envío inmediato) */
  batchInterval?: number;
  /** Tamaño máximo del batch antes de enviarlo */
  batchSize?: number;
  /** Información de contexto global que se añadirá a todos los logs */
  context?: Record<string, any>;
  /** Habilitar o deshabilitar el logging */
  enabled?: boolean;
  /** Función de callback para errores */
  onError?: (error: Error) => void;
}

export interface LogData {
  [key: string]: any;
}

export interface LogEvent {
  apiKey: string;
  timestamp: number;
  event: string;
  data: LogData;
  context: Record<string, any>;
}

export class Minilog {
  private apiKey: string = '';
  private options: Required<MinilogOptions>;
  private queue: LogEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isInitialized: boolean = false;

  private defaultOptions: Required<MinilogOptions> = {
    endpoint: 'https://api.minilog.workers.dev/api/v1/log',
    batchInterval: 5000, // 5 segundos por defecto
    batchSize: 10,
    context: {},
    enabled: true,
    onError: (error: Error) => console.error('[Minilog]', error)
  };

  constructor() {
    this.options = { ...this.defaultOptions };
  }

  /**
   * Inicializa la librería con una API key y opciones
   */
  init(apiKey: string, options: MinilogOptions = {}): void {
    if (!apiKey) {
      throw new Error('Se requiere una API key para inicializar minilog');
    }
    
    this.apiKey = apiKey;
    this.setOptions(options);
    this.isInitialized = true;
    
    // Configura el envío de batches si está habilitado
    this.setupBatchProcessing();
    
    // Registrar eventos de cierre para navegadores y Node.js
    this.setupShutdownHandlers();
  }

  /**
   * Actualiza las opciones de configuración
   */
  setOptions(options: MinilogOptions): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Si estamos cambiando el intervalo de batch, reinicia el timer
    if (options.batchInterval !== undefined && this.timer) {
      this.setupBatchProcessing();
    }
  }

  /**
   * Registra un evento con datos asociados
   */
  log(event: string, data: LogData = {}): void {
    if (!this.isInitialized) {
      this.options.onError(new Error('Debes inicializar minilog antes de usar log()'));
      return;
    }
    
    if (!this.options.enabled) {
      return;
    }

    const logEvent: LogEvent = {
      apiKey: this.apiKey,
      timestamp: Date.now(),
      event,
      data,
      context: {
        ...this.getBrowserContext(),
        ...this.options.context
      }
    };

    this.queue.push(logEvent);

    // Si el batch está desactivado o hemos alcanzado el tamaño máximo, enviar inmediatamente
    if (this.options.batchInterval === 0 || this.queue.length >= this.options.batchSize) {
      this.flush();
    }
  }

  /**
   * Envía inmediatamente todos los logs en cola
   */
  async flush(): Promise<void> {
    if (!this.queue.length) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        // Utilizar keepalive para asegurar que la petición se complete incluso si la página se cierra
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Error al enviar logs: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Restaurar los logs a la cola en caso de error
      this.queue = [...events, ...this.queue];
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Configura el procesamiento en batch de los logs
   */
  private setupBatchProcessing(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.options.batchInterval > 0) {
      this.timer = setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, this.options.batchInterval);
    }
  }

  /**
   * Configura handlers para detectar cuando la aplicación se cierra
   */
  private setupShutdownHandlers(): void {
    // Para navegadores
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.queue.length > 0) {
          this.flush();
        }
      });
    }

    // Para Node.js
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        if (this.queue.length > 0) {
          // En Node, necesitamos manejar esto de forma sincrónica
          // Este es un enfoque simple pero con limitaciones
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.options.endpoint, false); // false = síncrono
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(this.queue));
            this.queue = [];
          } catch (error) {
            this.options.onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });
    }
  }

  /**
   * Obtiene información contextual del navegador
   */
  private getBrowserContext(): Record<string, any> {
    const context: Record<string, any> = {};
    
    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.language = navigator.language;
      context.referrer = document.referrer;
      context.screenSize = `${window.screen.width}x${window.screen.height}`;
      context.url = window.location.href;
    } else if (typeof process !== 'undefined') {
      context.nodeVersion = process.version;
      context.platform = process.platform;
    }
    
    return context;
  }
}

// Exportar una instancia singleton
export const minilog = new Minilog(); 