import { GoogleGenAI } from "@google/genai";

export interface AIContext {
  mosqueName: string;
  snippets: string[];
  fileUris: string[];
  extraContext?: string;
}

/**
 * Stateless logic for Gemini 2.5 Flash Lite orchestration
 * Matching the exact pattern provided by user for @google/genai
 */
export async function* streamChatResponse(
  apiKey: string,
  userMessage: string,
  context: AIContext,
  history: any[] = []
) {
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const model = 'gemini-2.5-flash-lite';
  
  const systemInstruction = `Anda adalah "Asisten Digital" untuk Masjid ${context.mosqueName}. 
Tugas Anda adalah melayani jamaah dengan adab, keramahan, dan akurasi tinggi.

KONTEKS MASJID:
${context.snippets.join("\n")}

INSTRUKSI:
1. Jawablah menggunakan Bahasa Indonesia yang santun dan lugas.
2. Gunakan data dari KONTEKS MASJID di atas sebagai prioritas utama.
3. Jika ditanya soal agama yang bersifat interpretatif, berikan jawaban umum dan sarankan konsultasi langsung ke ustadz.
4. Jangan pernah mengarang data keuangan; jika tidak ada di konteks, katakan Anda belum memiliki data tersebut.
5. Anda memiliki akses ke file dokumen masjid (PDF) melalui context window.
${context.extraContext || ""}`;

  // Mapping history to contents format for @google/genai
  const contents = [
    ...history,
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const config: any = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    thinkingConfig: {
      thinkingBudget: 0,
    },
    tools: [
      {
        googleSearch: {}
      }
    ],
  };

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
