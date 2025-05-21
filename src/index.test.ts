import { minilog, Minilog } from './variant';

// Mock de la función fetch global
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
) as jest.Mock;

describe('Minilog', () => {
  beforeEach(() => {
    // Limpiar mocks entre tests
    jest.clearAllMocks();
  });

  test('debe inicializarse con una API key', () => {
    minilog.init('test-api-key');
    expect(() => minilog.log('test.event')).not.toThrow();
  });

  test('debe lanzar error si se usa log sin inicializar', () => {
    // Crear una nueva instancia para evitar que otros tests afecten
    const newLogger = new Minilog();
    const mockErrorFn = jest.fn();
    
    // Configurar un onError para capturar el error
    newLogger.setOptions({
      onError: mockErrorFn
    });
    
    newLogger.log('test.event');
    expect(mockErrorFn).toHaveBeenCalled();
  });

  test('debe enviar logs inmediatamente cuando batchInterval es 0', async () => {
    minilog.init('test-api-key', { batchInterval: 0 });
    minilog.log('test.event', { value: 'test' });
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('test.event'),
      })
    );
  });

  test('debe acumular logs hasta alcanzar batchSize', () => {
    minilog.init('test-api-key', { batchInterval: 10000, batchSize: 3 });
    
    minilog.log('test.event1');
    minilog.log('test.event2');
    
    // Con solo 2 eventos, no debería haber llamadas a fetch todavía
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Al añadir el tercer evento, debería enviarse el batch
    minilog.log('test.event3');
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).length).toBe(3);
  });

  test('flush debe enviar todos los logs pendientes', async () => {
    minilog.init('test-api-key', { batchInterval: 10000 });
    
    minilog.log('test.event1');
    minilog.log('test.event2');
    
    expect(global.fetch).not.toHaveBeenCalled();
    
    await minilog.flush();
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).length).toBe(2);
  });

  test('debe incluir contexto global en los logs', async () => {
    const globalContext = { app: 'test-app', version: '1.0.0' };
    minilog.init('test-api-key', { 
      batchInterval: 0,
      context: globalContext
    });
    
    minilog.log('test.event');
    
    const sentData = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)[0];
    
    expect(sentData.context).toMatchObject(globalContext);
  });

  test('setOptions debe actualizar la configuración', () => {
    minilog.init('test-api-key');
    
    minilog.setOptions({ enabled: false });
    minilog.log('test.event');
    
    // Como está deshabilitado, no debería enviar nada
    expect(global.fetch).not.toHaveBeenCalled();
    
    minilog.setOptions({ enabled: true, batchInterval: 0 });
    minilog.log('test.event');
    
    // Ahora sí debería enviar
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
}); 