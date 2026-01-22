"use client";

/**
 * Fallback data source when Wikipedia is unavailable
 * Uses DuckDuckGo Instant Answer API as alternative
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
    
    // DuckDuckGo Instant Answer API (no API key required)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodedTopic}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(ddgUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // DuckDuckGo returns AbstractText if available
    if (data.AbstractText) {
      return {
        title: data.Heading || topic,
        extract: data.AbstractText + (data.AbstractURL ? ` (Fuente: ${data.AbstractURL})` : ""),
      };
    }

    // If no abstract, try to get from RelatedTopics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const firstTopic = data.RelatedTopics[0];
      if (firstTopic.Text) {
        return {
          title: data.Heading || topic,
          extract: firstTopic.Text,
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
