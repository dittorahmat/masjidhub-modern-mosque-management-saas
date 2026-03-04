import { GoogleGenAI } from "@google/genai";
import { AIPersona, ParsedTransaction } from "@shared/types";

export interface AIContext {
  mosqueName: string;
  snippets: string[];
  fileUris: string[];
  persona: AIPersona;
  trustedDomains?: string[];
  extraContext?: string;
}

/**
 * Returns specific system instructions based on the selected persona
 */
function getSystemInstruction(context: AIContext): string {
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const commonHeader = `Anda adalah asisten digital resmi untuk Masjid ${context.mosqueName}. Hari ini adalah ${currentDate}.
Gunakan Bahasa Indonesia yang santun, lugas, dan ramah. Gunakan kata ganti "Saya" untuk diri Anda dan "Anda" atau "Bapak/Ibu/Akhi/Ukhti" untuk jamaah.

KONTEKS DATA MASJID:
${context.snippets.join("\n")}

KEBIJAKAN UTAMA:
1. Prioritaskan data dari KONTEKS DATA MASJID di atas sebagai kebenaran utama.
2. JANGAN HALUSINASI. Jika data tidak ada, katakan jujur "Saya belum memiliki informasi tersebut".
3. Aktif gunakan Google Search jika pertanyaan bersifat umum atau membutuhkan referensi keislaman yang tidak ada di data masjid.
${context.trustedDomains && context.trustedDomains.length > 0 ? `4. PRIORITAS SUMBER: Gunakan referensi dari situs berikut jika memungkinkan: ${context.trustedDomains.join(", ")}` : ""}
`;

  const personaInstructions: Record<AIPersona, string> = {
    marbot_muda: `
ROLE: MARBOT MUDA (The Executor)
- Fokus Anda adalah operasional, logistik, dan pelayanan teknis masjid.
- Gaya bahasa: Enerjik, solutif, langsung ke poin (straight-to-the-point).
`,
    ustadz_muda: `
ROLE: USTADZ MUDA (The Mentor)
- Fokus Anda adalah keilmuan, bimbingan rohani, dan menjawab pertanyaan agama.
- Gaya bahasa: Halus, bijak, menginspirasi, dan memiliki wibawa akademis.
- ATURAN KHUSUS: Setiap jawaban terkait agama WAJIB menyertakan Dalil (Ayat Al-Quran atau Hadits) beserta nomor referensinya.
- Jika harus Google Search, carikan referensi dari situs otoritatif keislaman.
`,
    sekretaris_digital: `
ROLE: SEKRETARIS DIGITAL (The Administrator)
- Fokus Anda adalah administrasi, surat-menyurat, transparansi keuangan, dan SOP masjid.
- Gaya bahasa: Formal, sangat terstruktur, dan rapi.
`,
    kakak_risma: `
ROLE: KAKAK RISMA (The Youth Mentor)
- Fokus Anda adalah kegiatan pemuda, komunitas Remaja Masjid, dan memotivasi anak muda untuk aktif ke masjid.
- Gaya bahasa: Gaul, enerjik, santun, dan modern.
`
  };

  return commonHeader + (personaInstructions[context.persona] || personaInstructions.marbot_muda) + (context.extraContext || "");
}

/**
 * Stateless logic for Gemini 2.5 Flash Lite orchestration
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
  const systemInstruction = getSystemInstruction(context);

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

/**
 * Helper to convert ArrayBuffer to Base64 (Worker-safe)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Extracts transaction data from a bank statement PDF using Gemini Vision
 * Enhanced for BSI and BCA formats.
 */
export async function parseBankStatement(
  apiKey: string,
  fileData: ArrayBuffer,
  mimeType: string,
  mosqueName: string
): Promise<ParsedTransaction[]> {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analisis file mutasi bank ini untuk Masjid ${mosqueName}. 
Ekstrak seluruh baris transaksi menjadi format JSON array.

ATURAN PARSING KHUSUS BANK INDONESIA:
1. "date": Tanggal (Format: DD/MM/YYYY). Ubah format 01-02-2026 atau 28/02 menjadi format standar.
2. "description": Gabungkan info pengirim/penerima dan keterangan transaksi menjadi satu teks yang bermakna.
3. "amount": Angka nominal murni (Hanya angka, hapus titik/koma ribuan).
   - Jika ada tanda minus di belakang (e.g. 1.000,00-) itu adalah uang KELUAR.
   - Jika ada kode DB di belakang nominal itu adalah uang KELUAR.
   - Jika ada kode CR di belakang nominal itu adalah uang MASUK.
4. "type": "income" untuk uang masuk atau "expense" untuk uang keluar.
5. "suggestedCategory": Tebak kategori (e.g., Infaq, Operasional, Zakat, Listrik, Gaji, dll).
6. "rationale": Alasan singkat pemilihan kategori.

HASIL HARUS BERUPA JSON ARRAY SAJA. JANGAN ADA TEKS LAIN. JANGAN ADA BLOCK MARKDOWN.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: arrayBufferToBase64(fileData),
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      }
    ]
  });

  const text = response.text;
  if (!text) throw new Error("AI tidak mengembalikan data.");

  // Clean JSON from potential markdown/extra text
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gagal mengekstrak format JSON dari mutasi.");
  
  return JSON.parse(jsonMatch[0]);
}
