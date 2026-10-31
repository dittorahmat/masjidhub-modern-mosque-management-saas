import { getYoutubeThumbnailUrl } from "../../../shared/youtube";
import { ParsedKajianMetadata, KAJIAN_CATEGORIES, KajianCategoryValue } from "../../../shared/types";
import { AIProvider } from "../../ai/provider";

export const ALLOWED_KAJIAN_CATEGORIES = KAJIAN_CATEGORIES.map(c => c.value);

export type KajianCategory = KajianCategoryValue;

const SCHOLAR_HONORIFICS = ['ustadz', 'habib', 'syekh', 'buya', 'kyai', 'ustazah', 'guru'];

/**
 * Checks if a channel name likely represents an Islamic scholar.
 */
function isScholarChannel(channelName: string): boolean {
  const lower = channelName.toLowerCase();
  return SCHOLAR_HONORIFICS.some(h => lower.includes(h));
}

/**
 * Validates whether the suggested category is part of the supported categories.
 */
function sanitizeCategory(rawCategory?: string): string {
  if (!rawCategory) return 'kajian_tematik';
  const trimmed = rawCategory.trim().toLowerCase();
  return ALLOWED_KAJIAN_CATEGORIES.includes(trimmed as KajianCategoryValue)
    ? trimmed
    : 'kajian_tematik';
}

/**
 * Parses raw YouTube metadata using YouTube oEmbed and enhances it with an AIProvider.
 */
export async function parseYoutubeKajianMetadata(
  videoId: string,
  aiProvider?: AIProvider
): Promise<Omit<ParsedKajianMetadata, 'videoId'>> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let thumbnailUrl = getYoutubeThumbnailUrl(videoId);

  let rawTitle = '';
  let channelTitle = '';

  // 1. Fetch free oEmbed data from YouTube
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
      signal: AbortSignal.timeout(2000),
    });
    if (oembedRes.ok) {
      const oembedData: any = await oembedRes.json();
      rawTitle = (oembedData.title || '').trim();
      channelTitle = (oembedData.author_name || '').trim();
      if (oembedData.thumbnail_url) {
        thumbnailUrl = oembedData.thumbnail_url;
      }
    }
  } catch (err) {
    console.warn('[parseYoutubeKajianMetadata] oEmbed fetch failed:', err);
  }

  // Fallback defaults
  let title = rawTitle || `Kajian YouTube (${videoId})`;
  let ustadzName = '';
  let category = 'kajian_tematik';
  let duration = '';
  let summary = '';

  // 2. Enhance with AI via AIProvider port if available
  if (aiProvider) {
    try {
      const prompt = `Anda adalah asisten data kajian masjid. Analisis informasi video YouTube berikut:
Judul Asli: "${rawTitle || `Video ID ${videoId}`}"
Nama Channel: "${channelTitle || 'Channel Kajian'}"

Tugas Anda:
1. "cleanTitle": Judul kajian yang rapi (hapus nama penceramah, hashtag, atau embel-embel stasiun TV/channel jika menumpuk di judul).
2. "ustadzName": Nama penceramah/ustadz/narasumber (misal: "Ustadz Adi Hidayat", "Ustadz Dr. Firanda Andirja", dll). Jika tidak ditemukan penceramah yang jelas, kosongkan string "".
3. "category": Pilih SALAH SATU yang paling relevan dari daftar: ["kajian_tematik", "tafsir", "fiqih", "aqidah", "sirah", "tahsin", "kajian_rutin"].
4. "duration": Estimasi durasi (misal: "45:00" atau "1 jam") jika disebutkan pada judul/channel, atau kosongkan string "".
5. "summary": Ringkasan topik 1-2 kalimat singkat tentang tema kajian tersebut.`;

      const parsed = await aiProvider.extractJson<{
        cleanTitle?: string;
        ustadzName?: string;
        category?: string;
        duration?: string;
        summary?: string;
      }>(prompt, `{
        "cleanTitle": "string",
        "ustadzName": "string",
        "category": "string",
        "duration": "string",
        "summary": "string"
      }`);

      if (parsed) {
        if (parsed.cleanTitle?.trim()) title = parsed.cleanTitle.trim();
        if (parsed.ustadzName?.trim()) ustadzName = parsed.ustadzName.trim();
        category = sanitizeCategory(parsed.category);
        if (parsed.duration?.trim()) duration = parsed.duration.trim();
        if (parsed.summary?.trim()) summary = parsed.summary.trim();
      }
    } catch (aiErr) {
      console.warn('[parseYoutubeKajianMetadata] AIProvider enrichment failed, using oEmbed fallback:', aiErr);
    }
  }

  // Fallback: check if channel title has an Islamic honorific
  if (!ustadzName && channelTitle && isScholarChannel(channelTitle)) {
    ustadzName = channelTitle;
  }

  return {
    title,
    ustadzName,
    category,
    duration,
    summary,
    description: summary, // alias for backward compatibility
    channelTitle,
    thumbnailUrl,
  };
}
