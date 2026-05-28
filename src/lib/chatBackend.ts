/**
 * Chat backend abstraction.
 *
 * Currently runs in mock mode (returns canned answers).
 * When VITE_OLLAMA_ENDPOINT is set, it will POST to the Ollama /api/chat endpoint
 * and stream a real response.
 *
 * Frontend stays the same — only the implementation switches.
 */

export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessage = { role: ChatRole; content: string };

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_ENDPOINT as string | undefined;
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'llama3.2:3b';

export const isLiveBackend = (): boolean =>
  typeof OLLAMA_URL === 'string' && OLLAMA_URL.length > 0;

const SYSTEM_PROMPT_EN = `You are the AI assistant for Andre Zimmermann, founder of ZIAN AI Concepts.
You help website visitors learn about Andre's services: AI-powered web development,
mobile app development, AI integration for companies, and AI courses/workshops.
You are transparent that you are an AI, not Andre himself. Keep replies concise (2–4 sentences).
If asked about pricing, say it depends on scope and recommend contacting Andre at hello@zian-ai.dev.
If asked something outside Andre's services, politely redirect.`;

const SYSTEM_PROMPT_DE = `Du bist der KI-Assistent von Andre Zimmermann, Gründer von ZIAN AI Concepts.
Du hilfst Website-Besuchern, mehr über Andres Leistungen zu erfahren: KI-gestützte Web-Entwicklung,
Mobile-App-Entwicklung, KI-Integration für Unternehmen und KI-Kurse/Workshops.
Du machst transparent, dass du eine KI bist und nicht Andre selbst. Halte Antworten knapp (2–4 Sätze).
Bei Preisfragen sage, dass es vom Umfang abhängt und empfiehl, Andre direkt unter hello@zian-ai.dev zu kontaktieren.
Wird etwas außerhalb seiner Leistungen gefragt, leite freundlich um.`;

/**
 * Send a chat message and get a reply.
 *
 * @param messages    Conversation so far (without system prompt — added internally)
 * @param locale      'de' | 'en' — picks the system prompt language
 * @param onToken     Optional streaming callback. Called with each token chunk.
 * @returns           Full reply text once complete.
 */
export async function sendChat(
  messages: ChatMessage[],
  locale: 'de' | 'en',
  onToken?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!isLiveBackend()) {
    // Mock mode — handled by caller via canned responses.
    throw new Error('mock-mode');
  }

  const system = locale === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;
  const payload = {
    model: OLLAMA_MODEL,
    stream: true,
    messages: [{ role: 'system', content: system }, ...messages],
  };

  const res = await fetch(`${OLLAMA_URL!.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Ollama responded ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Ollama streams newline-delimited JSON objects.
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          const chunk = obj.message?.content ?? '';
          if (chunk) {
            full += chunk;
            onToken?.(chunk);
          }
        } catch {
          /* ignore malformed line */
        }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }

  return full;
}
