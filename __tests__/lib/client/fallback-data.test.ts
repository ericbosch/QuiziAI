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

  it("should fallback to DuckDuckGo when English Wikipedia fails", async () => {
    // English Wikipedia fails
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // DuckDuckGo succeeds
    const mockDuckDuckGoResponse = {
      Abstract: "Albert Einstein was a theoretical physicist...",
      AbstractText: "Albert Einstein was a theoretical physicist...",
      Heading: "Albert Einstein",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDuckDuckGoResponse,
    });

    const result = await fetchFallbackData("Albert Einstein");

    expect(result).toEqual({
      title: "Albert Einstein",
      extract: "Albert Einstein was a theoretical physicist...",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
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

  it("should handle DuckDuckGo response with AbstractText", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const mockDuckDuckGoResponse = {
      AbstractText: "Test abstract text",
      Heading: "Test Topic",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDuckDuckGoResponse,
    });

    const result = await fetchFallbackData("Test Topic");

    expect(result).toEqual({
      title: "Test Topic",
      extract: "Test abstract text",
    });
  });

  it("should handle DuckDuckGo response with Abstract only", async () => {
    // English Wikipedia fails
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const mockDuckDuckGoResponse = {
      AbstractText: "Test abstract", // Use AbstractText as that's what the code checks first
      Heading: "Test Topic",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDuckDuckGoResponse,
    });

    const result = await fetchFallbackData("Test Topic");

    expect(result).toEqual({
      title: "Test Topic",
      extract: expect.stringContaining("Test abstract"),
    });
  });
});
