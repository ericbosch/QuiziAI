"use client";

import type { WikipediaSummary } from "@/lib/types";

export type { WikipediaSummary };

/**
 * Client-side Wikipedia fetch - works better as browser requests are less likely to be blocked
 */
export async function fetchWikipediaSummaryClient(
  topic: string
): Promise<WikipediaSummary | null> {
  try {
    const encodedTopic = encodeURIComponent(topic);
    
    // Try MediaWiki API first (more reliable, supports CORS)
    const mediaWikiUrl = `https://es.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=true&explaintext=true&pithumbsize=300&titles=${encodedTopic}&origin=*`;
    
    const mwResponse = await fetch(mediaWikiUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    
    if (mwResponse.ok) {
      const mwData = await mwResponse.json();
      const pages = mwData.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const page = pages?.[pageId];
      
      if (page && !page.missing && page.extract) {
        return {
          title: page.title,
          extract: page.extract,
          thumbnail: page.thumbnail ? { source: page.thumbnail.source } : undefined,
        };
      }
    }
    
    // Fallback to REST API
    const restUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`;
    
    const response = await fetch(restUrl, {
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

    const data: WikipediaSummary = await response.json();
    return data;
  } catch (error) {
    console.error("💥 [WIKI] Exception in fetchWikipediaSummaryClient:", error);
    if (error instanceof Error) {
      console.error("💥 [WIKI] Error message:", error.message);
      console.error("💥 [WIKI] Error stack:", error.stack);
    }
    return null;
  }
}
