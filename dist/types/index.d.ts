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
export declare class Minilog {
    private apiKey;
    private options;
    private queue;
    private timer;
    private isInitialized;
    private defaultOptions;
    constructor();
    /**
     * Inicializa la librería con una API key y opciones
     */
    init(apiKey: string, options?: MinilogOptions): void;
    /**
     * Actualiza las opciones de configuración
     */
    setOptions(options: MinilogOptions): void;
    /**
     * Registra un evento con datos asociados
     */
    log(event: string, data?: LogData): void;
    /**
     * Envía inmediatamente todos los logs en cola
     */
    flush(): Promise<void>;
    /**
     * Configura el procesamiento en batch de los logs
     */
    private setupBatchProcessing;
    /**
     * Configura handlers para detectar cuando la aplicación se cierra
     */
    private setupShutdownHandlers;
    /**
     * Obtiene información contextual del navegador
     */
    private getBrowserContext;
}
export declare const minilog: Minilog;
//# sourceMappingURL=index.d.ts.map