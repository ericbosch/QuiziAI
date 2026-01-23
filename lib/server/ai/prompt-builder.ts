/**
 * Unified prompt builder for all AI providers
 * Ensures consistent prompt structure across providers
 */

export interface PromptContext {
  previousQuestions: string[];
  previousAnswerIndices: number[];
  questionCount: number;
  content: string;
}

export interface PromptResult {
  systemPrompt?: string; // For providers that support system/user separation
  userPrompt: string; // Main prompt (or full prompt if no system separation)
}

/**
 * Build unified prompt for trivia generation
 */
export function buildTriviaPrompt(context: PromptContext): PromptResult {
  const { previousQuestions, previousAnswerIndices, questionCount, content } = context;
  const isBatch = questionCount > 1;

  const jsonFormat = isBatch 
    ? `{
  "questions": [
    {
      "question": "pregunta en español",
      "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
      "correctAnswerIndex": 0,
      "funFact": "dato curioso breve en español"
    }
  ]
}`
    : `{
  "question": "pregunta en español",
  "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
  "correctAnswerIndex": 0,
  "funFact": "dato curioso breve en español"
}`;

  let systemPrompt = `Eres un generador de preguntas de trivia. Tu tarea es crear ${isBatch ? `${questionCount} preguntas` : 'una pregunta'} educativas y entretenidas basadas en el contenido proporcionado.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El formato JSON debe ser exactamente:
${jsonFormat}

Reglas:
- ${isBatch ? `Debes generar exactamente ${questionCount} preguntas diferentes.` : 'La pregunta debe ser clara y directa'}
- Las 4 opciones deben ser plausibles pero solo una correcta
- correctAnswerIndex debe ser 0, 1, 2 o 3 (índice de la opción correcta)
- El funFact debe ser breve (máximo 100 caracteres) y relacionado con la respuesta correcta
- Todo el contenido debe estar en español
- NO incluyas markdown, NO incluyas código, solo el JSON puro
- IMPORTANTE: Varía la posición de la respuesta correcta (correctAnswerIndex) entre las preguntas. No uses siempre la misma posición.`;

  if (previousQuestions.length > 0) {
    systemPrompt += `\n\nIMPORTANTE: Ya se han hecho las siguientes preguntas sobre este tema. DEBES crear ${isBatch ? 'preguntas' : 'una pregunta'} COMPLETAMENTE DIFERENTE${isBatch ? 'S' : ''} que no ${isBatch ? 'sean' : 'sea'} similar${isBatch ? 'es' : ''} a ninguna de estas:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nLa${isBatch ? 's' : ''} nueva${isBatch ? 's' : ''} pregunta${isBatch ? 's' : ''} debe${isBatch ? 'n' : ''} cubrir un aspecto diferente del tema y no repetir información ya preguntada.`;
  }

  if (previousAnswerIndices.length > 0) {
    const recentIndices = previousAnswerIndices.slice(-3).join(", ");
    systemPrompt += `\n\nIMPORTANTE: Las últimas respuestas correctas estuvieron en las posiciones: ${recentIndices}. Por favor, usa una posición DIFERENTE para la respuesta correcta (0, 1, 2 o 3) para mantener la variedad.`;
  }

  const userPrompt = `${systemPrompt}\n\nContenido sobre el que crear la trivia:\n\n${content}`;

  return {
    systemPrompt: systemPrompt, // For providers that support system/user separation
    userPrompt: userPrompt, // Full prompt for providers that don't
  };
}
