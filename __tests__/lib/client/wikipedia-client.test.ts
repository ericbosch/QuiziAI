import { fetchWikipediaSummaryClient } from "@/lib/client/wikipedia-client";

// Mock fetch globally
global.fetch = jest.fn();

describe("Wikipedia Client Service", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("should fetch Wikipedia summary successfully from MediaWiki API", async () => {
    const mockResponse = {
      query: {
        pages: {
          "123": {
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

    const result = await fetchWikipediaSummaryClient("Albert Einstein");

    expect(result).toEqual({
      title: "Albert Einstein",
      extract: "Albert Einstein was a theoretical physicist...",
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("es.wikipedia.org/w/api.php"),
      expect.any(Object)
    );
  });

  it("should fallback to REST API when MediaWiki API fails", async () => {
    // First call fails
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Second call (REST API) succeeds
    const mockRestResponse = {
      title: "Albert Einstein",
      extract: "Albert Einstein was a theoretical physicist...",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRestResponse,
    });

    const result = await fetchWikipediaSummaryClient("Albert Einstein");

    expect(result).toEqual(mockRestResponse);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should return null when all APIs fail", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchWikipediaSummaryClient("Nonexistent Topic");

    expect(result).toBeNull();
  });

  it("should handle network errors gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchWikipediaSummaryClient("Albert Einstein");

    expect(result).toBeNull();
  });

  it("should handle empty extract from MediaWiki API", async () => {
    const mockResponse = {
      query: {
        pages: {
          "123": {
            title: "Test",
            extract: "",
          },
        },
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Should try REST API fallback
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchWikipediaSummaryClient("Test");

    expect(result).toBeNull();
  });
});
