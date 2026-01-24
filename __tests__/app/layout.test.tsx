import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata, viewport } from "@/app/layout";

describe("RootLayout", () => {
  it("renders html lang, manifest link, and children", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="child">Contenido</div>
      </RootLayout>
    );

    expect(html).toContain('lang="es"');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('href="/manifest.json"');
    expect(html).toContain('class="antialiased"');
    expect(html).toContain("Contenido");
  });

  it("exports metadata and viewport configuration", () => {
    expect(metadata.title).toBe("QuiziAI - Trivia Infinita");
    expect(metadata.description).toContain("AI-powered trivia");
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(["trivia", "quiz", "AI", "preguntas"])
    );
    expect(metadata.openGraph?.type).toBe("website");

    expect(viewport).toMatchObject({
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
    });
  });
});
