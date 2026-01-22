import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuiziAI - Trivia Infinita",
  description: "AI-powered trivia experience. Genera preguntas infinitas sobre cualquier tema usando inteligencia artificial.",
  keywords: ["trivia", "quiz", "AI", "inteligencia artificial", "preguntas", "conocimiento"],
  authors: [{ name: "QuiziAI" }],
  creator: "QuiziAI",
  openGraph: {
    title: "QuiziAI - Trivia Infinita",
    description: "AI-powered trivia experience",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
