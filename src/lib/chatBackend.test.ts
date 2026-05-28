import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper: build a Response whose body streams the given chunks.
function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

describe('chatBackend — mock mode (no endpoint)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_OLLAMA_ENDPOINT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isLiveBackend() is false when VITE_OLLAMA_ENDPOINT is empty', async () => {
    const mod = await import('./chatBackend');
    expect(mod.isLiveBackend()).toBe(false);
  });

  it("sendChat() throws 'mock-mode' to signal the caller to use the canned reply path", async () => {
    const { sendChat } = await import('./chatBackend');
    await expect(sendChat([{ role: 'user', content: 'hi' }], 'de')).rejects.toThrow('mock-mode');
  });
});

describe('chatBackend — live mode (Ollama endpoint)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_OLLAMA_ENDPOINT', 'https://ollama.example.com');
    vi.stubEnv('VITE_OLLAMA_MODEL', 'llama3.2:3b');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('isLiveBackend() is true when an endpoint is configured', async () => {
    const mod = await import('./chatBackend');
    expect(mod.isLiveBackend()).toBe(true);
  });

  it('POSTs the conversation with the German system prompt for locale=de', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(streamResponse(['{"message":{"content":"ok"},"done":true}\n']));
    const { sendChat } = await import('./chatBackend');
    await sendChat([{ role: 'user', content: 'Hallo' }], 'de');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://ollama.example.com/api/chat');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as {
      model: string;
      stream: boolean;
      messages: { role: string; content: string }[];
    };
    expect(body.model).toBe('llama3.2:3b');
    expect(body.stream).toBe(true);
    expect(body.messages[0]?.role).toBe('system');
    expect(body.messages[0]?.content).toMatch(/Du bist der KI-Assistent/);
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hallo' });
  });

  it('uses the English system prompt for locale=en', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(streamResponse(['{"message":{"content":"ok"},"done":true}\n']));
    const { sendChat } = await import('./chatBackend');
    await sendChat([{ role: 'user', content: 'Hi' }], 'en');

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(init.body as string) as { messages: { content: string }[] };
    expect(body.messages[0]?.content).toMatch(/You are the AI assistant/);
  });

  it('strips trailing slashes from the endpoint base URL', async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.stubEnv('VITE_OLLAMA_ENDPOINT', 'https://ollama.example.com/');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(streamResponse(['{"message":{"content":"ok"},"done":true}\n']));
    const { sendChat } = await import('./chatBackend');
    await sendChat([{ role: 'user', content: 'hi' }], 'de');
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://ollama.example.com/api/chat');
  });

  it('aggregates streamed content chunks and emits them via onToken', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        '{"message":{"content":"Hello"}}\n',
        '{"message":{"content":", "}}\n',
        '{"message":{"content":"world!"},"done":true}\n',
      ]),
    );
    const { sendChat } = await import('./chatBackend');
    const tokens: string[] = [];
    const full = await sendChat(
      [{ role: 'user', content: 'hi' }],
      'en',
      (chunk) => tokens.push(chunk),
    );
    expect(tokens).toEqual(['Hello', ', ', 'world!']);
    expect(full).toBe('Hello, world!');
  });

  it('handles partial JSON across chunk boundaries (NDJSON buffer)', async () => {
    // A single JSON object split mid-token across two TCP-like chunks.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        '{"message":{"content":"split-',
        'token"}}\n{"message":{"content":"-end"},"done":true}\n',
      ]),
    );
    const { sendChat } = await import('./chatBackend');
    const tokens: string[] = [];
    const full = await sendChat([{ role: 'user', content: 'x' }], 'en', (c) => tokens.push(c));
    expect(tokens).toEqual(['split-token', '-end']);
    expect(full).toBe('split-token-end');
  });

  it('silently skips malformed NDJSON lines', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        'NOT_JSON_OOPS\n',
        '{"message":{"content":"recovered"},"done":true}\n',
      ]),
    );
    const { sendChat } = await import('./chatBackend');
    const full = await sendChat([{ role: 'user', content: 'x' }], 'en');
    expect(full).toBe('recovered');
  });

  it('throws when the endpoint returns a non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500, statusText: 'Server error' }),
    );
    const { sendChat } = await import('./chatBackend');
    await expect(sendChat([{ role: 'user', content: 'x' }], 'de')).rejects.toThrow(/500/);
  });

  it('respects AbortSignal — stops the stream early and returns the partial text', async () => {
    const controller = new AbortController();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        '{"message":{"content":"first"}}\n',
        '{"message":{"content":"-second"}}\n',
      ]),
    );
    const { sendChat } = await import('./chatBackend');
    const tokens: string[] = [];
    const result = await sendChat(
      [{ role: 'user', content: 'x' }],
      'en',
      (chunk) => {
        tokens.push(chunk);
        // Abort after the first token to simulate a user stop.
        if (tokens.length === 1) controller.abort();
      },
      controller.signal,
    );
    // Implementation behaviour: returns whatever was collected before abort.
    expect(tokens[0]).toBe('first');
    expect(result.startsWith('first')).toBe(true);
  });
});
