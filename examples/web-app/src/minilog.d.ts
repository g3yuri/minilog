declare module '@g3yuri/minilog' {
  interface LogData {
    [key: string]: any;
  }

  interface MinilogOptions {
    endpoint?: string;
    batchInterval?: number;
    batchSize?: number;
    context?: Record<string, any>;
    enabled?: boolean;
    onError?: (error: Error) => void;
  }

  class Minilog {
    init(apiKey: string, options?: MinilogOptions): void;
    log(event: string, data?: LogData): void;
    setOptions(options: MinilogOptions): MinilogOptions;
    flush(): Promise<void>;
  }

  export const minilog: Minilog;
  export { Minilog };
} 