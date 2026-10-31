import { describe, it, expect } from "bun:test";
import { parseYoutubeKajianMetadata } from "../worker/routes/content/kajian-ai";
import { extractYoutubeVideoId } from "../shared/youtube";
import { MockAIAdapter } from "../worker/ai/provider";

describe("YouTube Kajian Metadata Extractor", () => {
  it("extracts valid YouTube video ID from various formats", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("https://example.com/not-youtube")).toBeNull();
  });

  it("handles metadata parsing with graceful fallback when no AI provider is provided", async () => {
    const videoId = "dQw4w9WgXcQ";
    const result = await parseYoutubeKajianMetadata(
      videoId,
      undefined // No AI Provider
    );

    expect(result).toBeDefined();
    expect(result.thumbnailUrl).toBeDefined();
    expect(typeof result.title).toBe("string");
    expect(result.category).toBe("kajian_tematik");
  });

  it("enriches metadata seamlessly when MockAIAdapter is provided", async () => {
    const videoId = "dQw4w9WgXcQ";
    const mockAI = new MockAIAdapter({
      'kajian masjid': {
        cleanTitle: 'Tafsir Surat Al-Baqarah Ayat 1-5',
        ustadzName: 'Ustadz Adi Hidayat',
        category: 'tafsir',
        duration: '45:00',
        summary: 'Penjelasan mendalam tafsir surat Al-Baqarah',
      },
    });

    const result = await parseYoutubeKajianMetadata(videoId, mockAI);

    expect(result.cleanTitle || result.title).toBe('Tafsir Surat Al-Baqarah Ayat 1-5');
    expect(result.ustadzName).toBe('Ustadz Adi Hidayat');
    expect(result.category).toBe('tafsir');
    expect(result.duration).toBe('45:00');
    expect(result.summary).toBe('Penjelasan mendalam tafsir surat Al-Baqarah');
  });
});
