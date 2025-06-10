export interface GeneratedGameCode {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
}

// Used for parsing the JSON response from Gemini
export interface GeminiGameCodeResponse {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
}

export interface SavedGameEntry {
  id: string;
  name: string; // User-provided name or default, taken from prompt input at time of save
  code: GeneratedGameCode;
  timestamp: number;
}

export type View = 'main' | 'terms' | 'privacy';
