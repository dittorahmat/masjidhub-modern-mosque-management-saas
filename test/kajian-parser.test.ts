import { describe, it, expect } from "bun:test";
import { parseYoutubeKajianMetadata } from "../worker/routes/content/kajian-ai";
import { extractYoutubeVideoId } from "../shared/youtube";

describe("YouTube Kajian Metadata Extractor", () => {
  it("extracts valid YouTube video ID from various formats", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeVideoId("https://example.com/not-youtube")).toBeNull();
  });

  it("handles metadata parsing with graceful fallback when no AI key is provided", async () => {
    const videoId = "dQw4w9WgXcQ";
    const result = await parseYoutubeKajianMetadata(
      videoId,
      undefined // No AI Key
    );

    expect(result).toBeDefined();
    expect(result.thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    expect(typeof result.title).toBe("string");
    expect(result.category).toBe("kajian_tematik");
  });
});
