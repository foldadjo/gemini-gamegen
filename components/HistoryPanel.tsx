import React from 'react';
import type { SavedGameEntry } from '../types';
import { PlayIcon, TrashIcon, InfoIcon } from './icons/EditorIcons';

interface HistoryPanelProps {
  history: SavedGameEntry[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onDelete, isLoading }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-800 rounded-lg h-full flex flex-col justify-center items-center">
        <InfoIcon className="w-12 h-12 text-purple-400 mb-3" />
        <p className="font-semibold text-gray-300">No Saved Games Yet</p>
        <p className="text-sm">Games you save will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-purple-300 p-4 border-b border-gray-700">
        Game History
      </h3>
      <ul className="divide-y turncate divide-gray-700 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-2">
        {history.map((entry) => (
          <li key={entry.id} className="p-3 hover:bg-gray-700/50 transition-colors duration-150 rounded-md">
            <div className="flex justify-between items-center">
              <div className="max-w-100 truncate">
                <p className="font-medium truncate max-w-100 text-gray-200 truncate" title={entry.name}>
                  {entry.name || 'Untitled Game'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                <button
                  onClick={() => onLoad(entry.id)}
                  disabled={isLoading}
                  className="p-2 text-green-400 hover:text-green-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Load game: ${entry.name}`}
                  title="Load Game"
                >
                  <PlayIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  disabled={isLoading}
                  className="p-2 text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Delete game: ${entry.name}`}
                  title="Delete Game"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
