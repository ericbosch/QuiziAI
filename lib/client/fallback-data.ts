"use client";

/**
 * Fallback data source when Spanish Wikipedia is unavailable
 * Uses English Wikipedia only to keep Wikipedia as source of truth
 */
export interface FallbackSummary {
  title: string;
  extract: string;
}

export async function fetchFallbackData(
  topic: string
): Promise<FallbackSummary | null> {
  try {
    const encodedTopic = encodeURIComponent(topic);
    
    // Try English Wikipedia as fallback (sometimes more reliable)
    const enWikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=true&explaintext=true&pithumbsize=300&titles=${encodedTopic}&origin=*`;
    
    const enResponse = await fetch(enWikiUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    
    if (enResponse.ok) {
      const enData = await enResponse.json();
      const pages = enData.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const page = pages?.[pageId];
      
      if (page && !page.missing && page.extract) {
        return {
          title: page.title,
          extract: page.extract,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("💥 [FALLBACK] Exception in fetchFallbackData:", error);
    if (error instanceof Error) {
      console.error("💥 [FALLBACK] Error message:", error.message);
      console.error("💥 [FALLBACK] Error stack:", error.stack);
    }
    return null;
  }
}
