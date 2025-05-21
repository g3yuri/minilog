const URL_ENDPOINT = 'https://minidash-six.vercel.app/api/logs';

interface MiniLogOptions {
  endpoint?: string;
  onError?: (error: Error) => void;
}

export class MiniLog {
  private apiKey: string;
  private endpoint: string;
  private onError: (error: Error) => void;

  constructor(apiKey: string, options: MiniLogOptions = {}) {
    this.apiKey = apiKey;
    this.endpoint = options.endpoint || URL_ENDPOINT;
    this.onError = options.onError || (() => {});
  }

  async log(event: string, data: Record<string, any> = {}): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          event,
          data,
          clientTime: new Date().toISOString(),
        }),
      });
    } catch (e) {
      this.onError(e as Error);
    }
  }
}
