import React, { useState, useCallback, useEffect, useRef } from 'react'; // Added useRef
import { generateGameFromPrompt } from './services/geminiService';
import {
  saveCurrentCode,
  loadCurrentCode,
  saveGameHistory,
  loadGameHistory,
} from './services/localStorageService';
import type { GeneratedGameCode, SavedGameEntry, View } from './types';
import { GameDisplay } from './components/GameDisplay';
import { CodeViewer } from './components/CodeViewer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { HistoryPanel } from './components/HistoryPanel';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { 
  SparklesIcon, 
  PlayIcon, 
  ArrowPathIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  ArrowsPointingOutIcon, // Added
  ArrowsPointingInIcon   // Added
} from './components/icons/EditorIcons';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [generatedCode, setGeneratedCode] = useState<GeneratedGameCode | null>(null);
  
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [currentCss, setCurrentCss] = useState<string>('');
  const [currentJs, setCurrentJs] = useState<string>('');
  const [currentId, setCurrentId] = useState<string>('');
  const [currentName, setCurrentName] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('');
  const [gamePreviewKey, setGamePreviewKey] = useState<number>(0);

  const [gameHistory, setGameHistory] = useState<SavedGameEntry[]>([]);
  const [currentView, setCurrentView] = useState<View>('main');

  const [isGameFullscreen, setIsGameFullscreen] = useState<boolean>(false); // Added
  const gameDisplayWrapperRef = useRef<HTMLDivElement>(null); // Added

  const hasEditableCode = currentHtml || currentCss || currentJs;

  useEffect(() => {
    const loadedCode = loadCurrentCode();
    if (loadedCode) {
      setCurrentHtml(loadedCode.html);
      setCurrentCss(loadedCode.css);
      setCurrentJs(loadedCode.js);
      setGamePreviewKey(prev => prev + 1); 
    }
    setGameHistory(loadGameHistory());
  }, []); 

  useEffect(() => {
    saveCurrentCode(currentHtml, currentCss, currentJs);
  }, [currentHtml, currentCss, currentJs]);

  useEffect(() => {
    if (gameHistory.length > 0) {
      saveGameHistory(gameHistory);
    }
  }, [gameHistory]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsGameFullscreen(document.fullscreenElement === gameDisplayWrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []); // gameDisplayWrapperRef is stable


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a game description or revision instructions.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiKeyStatus('');

    if (!process.env.API_KEY) {
        const keyError = "API_KEY environment variable is not configured. Please ensure it is set.";
        setError(keyError);
        setApiKeyStatus(keyError);
        setIsLoading(false);
        return;
    }
    setApiKeyStatus('API_KEY is configured.');

    try {
      const codeToRevise = hasEditableCode 
        ? { 
            id: currentId || crypto.randomUUID(), 
            name: currentName, 
            html: currentHtml, 
            css: currentCss, 
            js: currentJs 
          } 
        : null;

      const code = await generateGameFromPrompt(prompt, codeToRevise);
      setGeneratedCode(code); 
      setCurrentId(code.id);
      setCurrentName(code.name);
      setCurrentHtml(code.html);
      setCurrentCss(code.css);
      setCurrentJs(code.js);
      setGamePreviewKey(prev => prev + 1); 
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to generate/revise game: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, currentHtml, currentCss, currentJs, hasEditableCode, currentId, currentName]);

  const handleApplyPreview = useCallback(() => {
    setGamePreviewKey(prev => prev + 1);
  }, []);

  const handleSaveToHistory = useCallback(() => {
    if (!hasEditableCode) {
        setError("There's no code to save to history. Generate or write some code first.");
        return;
    }

    // Check if a game with the same ID already exists
    const existingGameIndex = gameHistory.findIndex(entry => entry.code.id === currentId);
    const name = currentName;
    
    const newEntry: SavedGameEntry = {
      id: crypto.randomUUID(),
      name,
      code: { 
        id: currentId, 
        name: name,
        html: currentHtml, 
        css: currentCss, 
        js: currentJs 
      },
      timestamp: Date.now(),
    };

    if (existingGameIndex !== -1) {
      // Update existing entry
      setGameHistory(prev => {
        const newHistory = [...prev];
        newHistory[existingGameIndex] = newEntry;
        return newHistory;
      });
    } else {
      // Add new entry
      setGameHistory(prev => [newEntry, ...prev]);
    }
    
    setPrompt(''); 
    setError(null); 
  }, [prompt, currentHtml, currentCss, currentJs, hasEditableCode, currentId, gameHistory]);

  const handleLoadFromHistory = useCallback((id: string) => {
    const entry = gameHistory.find(e => e.id === id);
    if (entry) {
      setPrompt(entry.name); 
      setCurrentHtml(entry.code.html);
      setCurrentCss(entry.code.css);
      setCurrentJs(entry.code.js);
      setCurrentId(entry.code.id);
      setCurrentName(entry.code.name);
      setGamePreviewKey(prev => prev + 1);
      setError(null);
    }
  }, [gameHistory]);

  const handleDeleteFromHistory = useCallback((id: string) => {
    setGameHistory(prevHistory => prevHistory.filter(e => e.id !== id));
    saveGameHistory(gameHistory);
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the current prompt and code? This will clear the editors.")) {
      setPrompt('');
      setCurrentHtml('');
      setCurrentCss('');
      setCurrentJs('');
      setGeneratedCode(null);
      setGamePreviewKey(prev => prev + 1); 
      setError(null);
    }
  }, []);
  
  const navigateTo = (view: View) => {
    setCurrentView(view);
    window.scrollTo(0, 0); 
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(async () => {
    if (!gameDisplayWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await gameDisplayWrapperRef.current.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen API error:", err);
      setError("Fullscreen mode could not be activated. Your browser might not support it or it was denied.");
      // Ensure state is correct if request fails or is denied by user
      setIsGameFullscreen(!!document.fullscreenElement);
    }
  }, []);


  if (currentView === 'terms') {
    return <TermsOfService onNavigateBack={() => navigateTo('main')} />;
  }

  if (currentView === 'privacy') {
    return <PrivacyPolicy onNavigateBack={() => navigateTo('main')} />;
  }

  return (
    <div 
      className={`app-container min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 flex flex-col items-center p-2 sm:p-4 lg:p-6 ${isGameFullscreen ? 'game-fullscreen-active' : ''}`}
    >
      <header className="w-full max-w-6xl mb-6 text-center">
        <div className="flex items-center justify-center space-x-3">
          <SparklesIcon className="h-10 w-10 text-purple-400" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Gemini GameGen
          </h1>
        </div>
        <p className="mt-2 text-base sm:text-lg text-gray-400">
          Describe a game, revise existing code, or load a game from your history.
        </p>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl">
          <label htmlFor="gamePrompt" className="block text-sm font-medium text-purple-300 mb-2">
            Enter game idea, revision instructions, or a name for saving to history
          </label>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <textarea
              id="gamePrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasEditableCode ? "e.g., Make player jump higher OR Name for history" : "e.g., A simple Pong game"}
              className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow text-gray-200 placeholder-gray-500 min-h-[60px] sm:min-h-[70px] resize-y"
              rows={2}
              aria-label="Game idea, revision prompt, or name for saving to history"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              aria-live="polite"
            >
              {isLoading ? (
                <LoadingSpinner className="h-5 w-5 mr-2" />
              ) : (
                <PlayIcon className="h-5 w-5 mr-2" />
              )}
              {isLoading ? (hasEditableCode ? 'Revising...' : 'Generating...') : (hasEditableCode ? 'Revise Game' : 'Generate Game')}
            </button>
          </div>
           {apiKeyStatus && (
             <p className={`mt-2 text-xs ${apiKeyStatus.includes('not configured') ? 'text-red-400' : 'text-green-400'}`}>
                {apiKeyStatus}
             </p>
           )}
        </form>

        {error && <ErrorMessage message={error} />}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 my-2 sm:my-4 w-full">
            <button
                onClick={handleApplyPreview}
                disabled={isLoading || !hasEditableCode}
                className="flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                aria-label="Apply manual code changes and refresh game preview"
            >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Apply Edits & Refresh
            </button>
            <button
                onClick={handleSaveToHistory}
                disabled={isLoading || !hasEditableCode}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                aria-label="Save current code and prompt to history"
            >
                <ArchiveBoxArrowDownIcon className="h-5 w-5 mr-2" />
                Save to History
            </button>
            <button
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                aria-label="Reset current prompt, code, and preview"
            >
                <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                Reset Current State
            </button>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[50vh] sm:min-h-[60vh] lg:min-h-[600px]">
          <div 
            ref={gameDisplayWrapperRef} 
            className={`game-display-wrapper min-h-[400px] lg:col-span-2 bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-1 relative ${isGameFullscreen ? 'game-display-wrapper-fullscreen' : ''}`}
          >
            <GameDisplay 
              gameCode={hasEditableCode ? { 
                id: currentId || crypto.randomUUID(),
                name: prompt.trim() || 'Untitled Game',
                html: currentHtml, 
                css: currentCss, 
                js: currentJs 
              } : null} 
              previewKey={gamePreviewKey}
            />
            <button
              onClick={handleToggleFullscreen}
              className={`absolute top-2 right-2 z-20 p-1.5 sm:p-2 rounded-full transition-all duration-200 ease-in-out group
                          ${isGameFullscreen 
                              ? 'bg-white/30 hover:bg-white/50 text-gray-800' 
                              : 'bg-gray-900/60 hover:bg-gray-900/80 text-white'}`}
              aria-label={isGameFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isGameFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isGameFullscreen ? 
                <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" /> : 
                <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />}
            </button>
          </div>
          <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[200px] lg:min-h-0">
             <HistoryPanel 
                history={gameHistory}
                onLoad={handleLoadFromHistory}
                onDelete={handleDeleteFromHistory}
                isLoading={isLoading}
            />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden mt-4 h-[400px] sm:h-[500px]">
            <CodeViewer
              html={currentHtml}
              css={currentCss}
              js={currentJs}
              onHtmlChange={setCurrentHtml}
              onCssChange={setCurrentCss}
              onJsChange={setCurrentJs}
              isLoading={isLoading && !hasEditableCode} 
            />
        </div>
      </main>

      <footer className="w-full max-w-6xl mt-8 sm:mt-12 text-center text-sm text-gray-500">
        <p>
          <button 
            onClick={() => navigateTo('terms')} 
            className="underline hover:text-purple-300 transition-colors mx-1 px-1 focus:outline-none focus:ring-1 focus:ring-purple-400 rounded"
            aria-label="View Terms of Service"
          >
            Terms of Service
          </button>
          <span className="mx-1">|</span>
          <button 
            onClick={() => navigateTo('privacy')} 
            className="underline hover:text-purple-300 transition-colors mx-1 px-1 focus:outline-none focus:ring-1 focus:ring-purple-400 rounded"
            aria-label="View Privacy Policy"
          >
            Privacy Policy
          </button>
        </p>
        <p className="mt-2">
          &copy; {new Date().getFullYear()} 
          <a href="https://game.pesonapath.my.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300 transition-colors mx-1">
            Gemini GameGen
          </a>
           by 
          <a href="https://pesonapath.my.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300 transition-colors ml-1">
            PesonaPath
          </a>. Powered by AI.
        </p>
      </footer>
    </div>
  );
};

export default App;