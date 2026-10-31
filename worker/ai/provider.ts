/**
 * AI Provider Seam and Adapter interfaces for MasjidHub.
 * Enables deterministic testing without calling live Google GenAI APIs.
 */

export interface AIProvider {
  generateText(prompt: string, options?: { systemInstruction?: string }): Promise<string>;
  extractJson<T = any>(prompt: string, schemaDescription?: string): Promise<T>;
}

export class GeminiAIAdapter implements AIProvider {
  constructor(private apiKey: string, private modelName = 'gemini-flash-lite-latest') {}

  async generateText(prompt: string, options?: { systemInstruction?: string }): Promise<string> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: options?.systemInstruction ? { systemInstruction: options.systemInstruction } : undefined,
    });
    return response.text || '';
  }

  async extractJson<T = any>(prompt: string, schemaDescription?: string): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${schemaDescription || 'JSON'}`
    );
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  }
}

export class MockAIAdapter implements AIProvider {
  constructor(private mockResponses: Record<string, any> = {}) {}

  setMockResponse(key: string, value: any) {
    this.mockResponses[key] = value;
  }

  async generateText(prompt: string): Promise<string> {
    for (const [key, val] of Object.entries(this.mockResponses)) {
      if (prompt.includes(key)) return typeof val === 'string' ? val : JSON.stringify(val);
    }
    return 'Mock AI Text Output';
  }

  async extractJson<T = any>(prompt: string): Promise<T> {
    for (const [key, val] of Object.entries(this.mockResponses)) {
      if (prompt.includes(key)) return val as T;
    }
    return {} as T;
  }
}

export function getAIProvider(env: any): AIProvider {
  const apiKey = env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (apiKey) {
    return new GeminiAIAdapter(apiKey);
  }
  return new MockAIAdapter();
}
