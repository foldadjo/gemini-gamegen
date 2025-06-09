
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GeneratedGameCode, GeminiGameCodeResponse } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const generateGameFromPrompt = async (
  userPrompt: string,
  existingCode?: GeneratedGameCode | null
): Promise<GeneratedGameCode> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY environment variable is not set.");
    throw new Error("API_KEY environment variable is not configured. This application cannot function without it.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let instruction: string;

  if (existingCode && (existingCode.html || existingCode.css || existingCode.js)) {
    // Instruction for revising existing code
    instruction = `You are an expert game development assistant.
Your task is to revise and improve the provided HTML, CSS, and JavaScript code based on the user's new instructions.
The user wants to modify their existing game. Apply the requested changes and ensure the game remains functional and self-contained.
All necessary HTML structure, CSS styling, and JavaScript logic should be provided.
The JavaScript should directly manipulate DOM elements defined in the HTML.
The CSS should provide basic but appealing styling.
The HTML should be the core structure for the game elements.

Return your response as a single JSON object with the following exact structure:
{
  "html": "<!DOCTYPE html><html><head>...</head><body>...</body></html> or just the body content like <div>...</div>",
  "css": "body { ... } .game-element { ... }",
  "js": "(function() { ... })(); // All game logic here"
}

User's revision request: "${userPrompt}"

Current HTML:
\`\`\`html
${existingCode.html}
\`\`\`

Current CSS:
\`\`\`css
${existingCode.css}
\`\`\`

Current JavaScript:
\`\`\`javascript
${existingCode.js}
\`\`\`

Generate the revised game code. Ensure the JavaScript is functional and incorporates the user's requested changes.
The HTML should be the content that goes inside the <body> tag of the game iframe.
The CSS rules should target elements within that HTML.
The JavaScript should be immediately executable and set up the game.
Focus on accurately implementing the user's revisions while maintaining playability and simplicity.
`;
  } else {
    // Instruction for generating a new game
    instruction = `You are an expert game development assistant. Your task is to generate the complete HTML, CSS, and JavaScript code for a simple, playable web-based game based on the user's prompt.
The game must be self-contained: all necessary HTML structure, CSS styling, and JavaScript logic should be provided.
The JavaScript should directly manipulate DOM elements defined in the HTML. Avoid external libraries unless absolutely essential and simple to include (e.g. a font).
The CSS should provide basic but appealing styling to make the game look good.
The HTML should be the core structure for the game elements.

Return your response as a single JSON object with the following exact structure:
{
  "html": "<!DOCTYPE html><html><head>...</head><body>...</body></html> or just the body content like <div>...</div>",
  "css": "body { ... } .game-element { ... }",
  "js": "(function() { ... })(); // All game logic here"
}

User Prompt: "${userPrompt}"

Generate the game code. Ensure the JavaScript is functional and creates an interactive experience.
For complex game requests like "Chess" or "Pacman", generate a very simplified version appropriate for a 'mini-game'.
The HTML should be the content that goes inside the <body> tag of the game iframe.
The CSS rules should target elements within that HTML.
The JavaScript should be immediately executable and set up the game.
Focus on playability and simplicity.
`;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: instruction }] }],
        config: {
            responseMimeType: "application/json",
            temperature: 0.6, // Slightly less creative for revisions, 0.7 for new generation.
        },
    });

    const rawJson = response.text;
    let cleanJson = rawJson.trim();

    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanJson.match(fenceRegex);
    if (match && match[1]) {
        cleanJson = match[1].trim();
    }
    
    try {
        const parsedData = JSON.parse(cleanJson) as GeminiGameCodeResponse;
        if (typeof parsedData.html === 'string' && typeof parsedData.css === 'string' && typeof parsedData.js === 'string') {
            return parsedData;
        } else {
            console.error("Parsed JSON does not match expected structure:", parsedData);
            throw new Error("AI response did not provide game code in the expected format. Missing html, css, or js properties.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", e);
        console.error("Raw AI response text:", rawJson);
        throw new Error(`AI response was not valid JSON or did not match the expected structure. Raw response: ${rawJson.substring(0,1000)}`);
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
        throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the Gemini API.');
  }
};
