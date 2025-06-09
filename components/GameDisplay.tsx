
import React from 'react';
import type { GeneratedGameCode } from '../types';
import { InfoIcon } from './icons/EditorIcons';

interface GameDisplayProps {
  gameCode: GeneratedGameCode | null;
  previewKey: number; // Added to force iframe re-render
}

export const GameDisplay: React.FC<GameDisplayProps> = ({ gameCode, previewKey }) => {
  if (!gameCode || (!gameCode.html && !gameCode.css && !gameCode.js)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-700 text-gray-400 rounded-lg p-8 text-center">
        <InfoIcon className="w-16 h-16 text-purple-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-200 mb-2">Game Preview Area</h3>
        <p>Your generated game will appear here.</p>
        <p className="mt-2 text-sm">Generate a game or edit the code and click "Apply Edits"!</p>
      </div>
    );
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Generated Game</title>
      <style>
        body { 
          margin: 0; 
          padding: 0;
          overflow: hidden; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          background-color: #1f2937; /* gray-800, ensure iframe bg matches if game doesn't cover all */
          color: #e5e7eb; /* gray-200 */
          font-family: sans-serif;
        }
        /* Ensure game content takes full space if it's designed that way */
        #game-container, .game-canvas, body > div:first-child { /* Common game container IDs/classes and a general selector */
            max-width: 100%;
            max-height: 100%;
            box-sizing: border-box;
        }
        ${gameCode.css}
      </style>
    </head>
    <body>
      ${gameCode.html}
      <script>
        // Basic error handling for script execution
        (function() {
          try {
            ${gameCode.js}
          } catch (e) {
            console.error("Error executing game script:", e);
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '10px';
            errorDiv.style.left = '10px';
            errorDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            errorDiv.style.padding = '10px';
            errorDiv.style.border = '1px solid red';
            errorDiv.style.zIndex = '9999';
            errorDiv.style.fontSize = '14px';
            errorDiv.style.fontFamily = 'monospace';
            errorDiv.textContent = 'Game Script Error: ' + e.message + (e.stack ? '\\n' + e.stack.substring(0,300) : '');
            if (document.body) {
                document.body.appendChild(errorDiv);
            } else {
                // Fallback if body is not ready or script is in head.
                // This is less likely given our structure but good for robustness.
                window.addEventListener('DOMContentLoaded', function() {
                    document.body.appendChild(errorDiv);
                });
            }
          }
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <iframe
      key={previewKey} // This is crucial for forcing re-render
      srcDoc={srcDoc}
      title="Generated Game Preview"
      className="w-full h-full border-0 rounded-lg bg-gray-700" // bg-gray-700 for the iframe itself before content loads
      sandbox="allow-scripts allow-same-origin" // allow-same-origin might be needed for certain JS interactions, e.g., canvas. Be cautious.
                                                // For most simple self-contained games, "allow-scripts" is enough.
                                                // If games need localStorage or other origin-specific features, allow-same-origin would be necessary.
                                                // Let's stick to "allow-scripts" unless issues arise.
      aria-label="Interactive game preview"
    />
  );
};
