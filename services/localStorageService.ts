import type { GeneratedGameCode, SavedGameEntry } from '../types';

const CURRENT_HTML_KEY = 'geminiGameGen_currentHtml';
const CURRENT_CSS_KEY = 'geminiGameGen_currentCss';
const CURRENT_JS_KEY = 'geminiGameGen_currentJs';
const GAME_HISTORY_KEY = 'geminiGameGen_gameHistory';

// --- Current Code ---

export const saveCurrentCode = (html: string, css: string, js: string): void => {
  try {
    localStorage.setItem(CURRENT_HTML_KEY, html);
    localStorage.setItem(CURRENT_CSS_KEY, css);
    localStorage.setItem(CURRENT_JS_KEY, js);
  } catch (error) {
    console.error("Error saving current code to localStorage:", error);
  }
};

export const loadCurrentCode = (): GeneratedGameCode | null => {
  try {
    const html = localStorage.getItem(CURRENT_HTML_KEY);
    const css = localStorage.getItem(CURRENT_CSS_KEY);
    const js = localStorage.getItem(CURRENT_JS_KEY);

    // Ensure all parts are present; otherwise, it's not a complete saved state.
    if (html !== null && css !== null && js !== null) {
      return { html, css, js };
    }
    return null;
  } catch (error) {
    console.error("Error loading current code from localStorage:", error);
    return null;
  }
};

export const clearCurrentCodeFromLS = (): void => {
  try {
    localStorage.removeItem(CURRENT_HTML_KEY);
    localStorage.removeItem(CURRENT_CSS_KEY);
    localStorage.removeItem(CURRENT_JS_KEY);
  } catch (error) {
    console.error("Error clearing current code from localStorage:", error);
  }
};

// --- Game History ---

export const saveGameHistory = (history: SavedGameEntry[]): void => {
  try {
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving game history to localStorage:", error);
    // Potentially handle quota exceeded error
  }
};

export const loadGameHistory = (): SavedGameEntry[] => {
  try {
    const historyJson = localStorage.getItem(GAME_HISTORY_KEY);
    if (historyJson) {
      const history = JSON.parse(historyJson) as SavedGameEntry[];
      // Basic validation for each entry
      return history.filter(entry => 
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.timestamp === 'number' &&
        entry.code &&
        typeof entry.code.html === 'string' &&
        typeof entry.code.css === 'string' &&
        typeof entry.code.js === 'string'
      );
    }
    return [];
  } catch (error) {
    console.error("Error loading game history from localStorage:", error);
    return [];
  }
};
