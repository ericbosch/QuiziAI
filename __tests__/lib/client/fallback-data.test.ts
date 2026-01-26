import { fetchFallbackData } from "@/lib/client/fallback-data";

// Mock fetch globally
global.fetch = jest.fn();

describe("Fallback Data Service", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("should fetch from English Wikipedia successfully", async () => {
    const mockResponse = {
      query: {
        pages: {
          "456": {
            title: "Albert Einstein",
            extract: "Albert Einstein was a theoretical physicist...",
          },
        },
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchFallbackData("Albert Einstein");

    expect(result).toEqual({
      title: "Albert Einstein",
      extract: "Albert Einstein was a theoretical physicist...",
    });
    // Check that fetch was called (may be called multiple times for different APIs)
    expect(fetch).toHaveBeenCalled();
  });

  it("should return null when English Wikipedia fails", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchFallbackData("Albert Einstein");

    expect(result).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should return null when all fallbacks fail", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchFallbackData("Nonexistent Topic");

    expect(result).toBeNull();
  });

  it("should handle network errors gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchFallbackData("Albert Einstein");

    expect(result).toBeNull();
  });

});
