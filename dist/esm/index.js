// src/index.ts
var Minilog = class {
  constructor() {
    this.apiKey = "";
    this.queue = [];
    this.timer = null;
    this.isInitialized = false;
    this.defaultOptions = {
      endpoint: "https://api.minilog.workers.dev/api/v1/log",
      batchInterval: 5e3,
      // 5 segundos por defecto
      batchSize: 10,
      context: {},
      enabled: true,
      onError: (error) => console.error("[Minilog]", error)
    };
    this.options = { ...this.defaultOptions };
  }
  /**
   * Inicializa la librería con una API key y opciones
   */
  init(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error("Se requiere una API key para inicializar minilog");
    }
    this.apiKey = apiKey;
    this.setOptions(options);
    this.isInitialized = true;
    this.setupBatchProcessing();
    this.setupShutdownHandlers();
  }
  /**
   * Actualiza las opciones de configuración
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
    if (options.batchInterval !== void 0 && this.timer) {
      this.setupBatchProcessing();
    }
  }
  /**
   * Registra un evento con datos asociados
   */
  log(event, data = {}) {
    if (!this.isInitialized) {
      this.options.onError(new Error("Debes inicializar minilog antes de usar log()"));
      return;
    }
    if (!this.options.enabled) {
      return;
    }
    const logEvent = {
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
    if (this.options.batchInterval === 0 || this.queue.length >= this.options.batchSize) {
      this.flush();
    }
  }
  /**
   * Envía inmediatamente todos los logs en cola
   */
  async flush() {
    if (!this.queue.length) {
      return;
    }
    const events = [...this.queue];
    this.queue = [];
    try {
      const response = await fetch(this.options.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(events),
        // Utilizar keepalive para asegurar que la petición se complete incluso si la página se cierra
        keepalive: true
      });
      if (!response.ok) {
        throw new Error(`Error al enviar logs: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.queue = [...events, ...this.queue];
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * Configura el procesamiento en batch de los logs
   */
  setupBatchProcessing() {
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
  setupShutdownHandlers() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        if (this.queue.length > 0) {
          this.flush();
        }
      });
    }
    if (typeof process !== "undefined") {
      process.on("beforeExit", () => {
        if (this.queue.length > 0) {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", this.options.endpoint, false);
            xhr.setRequestHeader("Content-Type", "application/json");
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
  getBrowserContext() {
    const context = {};
    if (typeof window !== "undefined") {
      context.userAgent = navigator.userAgent;
      context.language = navigator.language;
      context.referrer = document.referrer;
      context.screenSize = `${window.screen.width}x${window.screen.height}`;
      context.url = window.location.href;
    } else if (typeof process !== "undefined") {
      context.nodeVersion = process.version;
      context.platform = process.platform;
    }
    return context;
  }
};
var minilog = new Minilog();
export {
  Minilog,
  minilog
};
