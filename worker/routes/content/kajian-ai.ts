import { GoogleGenAI } from "@google/genai";

export interface ParsedKajianMetadata {
  title: string;
  ustadzName: string;
  category: string;
  duration?: string;
  description?: string;
  channelTitle?: string;
  thumbnailUrl: string;
}

/**
 * Parses raw YouTube metadata using YouTube oEmbed and optionally enhances it with Gemini AI.
 */
export async function parseYoutubeKajianMetadata(
  urlOrId: string,
  videoId: string,
  apiKey?: string
): Promise<ParsedKajianMetadata> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  let rawTitle = '';
  let channelTitle = '';

  // 1. Fetch free oEmbed data from YouTube
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
    if (oembedRes.ok) {
      const oembedData: any = await oembedRes.json();
      rawTitle = (oembedData.title || '').trim();
      channelTitle = (oembedData.author_name || '').trim();
    }
  } catch (err) {
    console.warn('[parseYoutubeKajianMetadata] oEmbed fetch failed:', err);
  }

  // Fallback defaults
  let title = rawTitle || `Kajian YouTube (${videoId})`;
  let ustadzName = '';
  let category = 'kajian_tematik';
  let duration = '';
  let description = '';

  // 2. Enhance with Gemini AI if API key is provided
  if (apiKey && rawTitle) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Anda adalah asisten data kajian masjid. Analisis informasi video YouTube berikut:
Judul Asli: "${rawTitle}"
Nama Channel: "${channelTitle}"

Tugas Anda:
1. "cleanTitle": Judul kajian yang rapi (hapus nama penceramah, hashtag, atau embel-embel stasiun TV/channel jika menumpuk di judul).
2. "ustadzName": Nama penceramah/ustadz/narasumber (misal: "Ustadz Adi Hidayat", "Ustadz Dr. Firanda Andirja", dll). Jika tidak ditemukan penceramah yang jelas, kosongkan string "".
3. "category": Pilih SALAH SATU yang paling relevan dari daftar: ["kajian_tematik", "tafsir", "fiqih", "aqidah", "sirah", "tahsin", "kajian_rutin"].
4. "duration": Estimasi durasi (misal: "45:00" atau "1 jam") jika disebutkan pada judul/channel, atau kosongkan string "".
5. "summary": Ringkasan topik 1-2 kalimat singkat tentang tema kajian tersebut.

Format output WAJIB HANYA JSON objek valid:
{
  "cleanTitle": "...",
  "ustadzName": "...",
  "category": "...",
  "duration": "...",
  "summary": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text?.trim();
      if (text) {
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.cleanTitle?.trim()) title = parsed.cleanTitle.trim();
          if (parsed.ustadzName?.trim()) ustadzName = parsed.ustadzName.trim();
          if (parsed.category?.trim()) category = parsed.category.trim();
          if (parsed.duration?.trim()) duration = parsed.duration.trim();
          if (parsed.summary?.trim()) description = parsed.summary.trim();
        }
      }
    } catch (aiErr) {
      console.warn('[parseYoutubeKajianMetadata] Gemini AI enrichment failed, using oEmbed fallback:', aiErr);
    }
  }

  // If ustadzName is still empty, fallback check channel name
  if (!ustadzName && channelTitle) {
    if (/ustadz|habib|syekh|buya|kyai/i.test(channelTitle)) {
      ustadzName = channelTitle;
    }
  }

  return {
    title,
    ustadzName,
    category,
    duration,
    description,
    channelTitle,
    thumbnailUrl,
  };
}
