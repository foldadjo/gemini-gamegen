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
import { CustomCursor } from './components/CustomCursor';
import { ParticlesBackground } from './components/ParticlesBackground';
import { 
  SparklesIcon, 
  PlayIcon, 
  ArrowPathIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  ArrowsPointingOutIcon, // Added
  ArrowsPointingInIcon   // Added
} from './components/icons/EditorIcons';
import './styles/animations.css';

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
    <>
      <div className="animated-bg" />
      <ParticlesBackground />
      <CustomCursor />
      <div 
        className={`app-container min-h-screen text-gray-200 flex flex-col items-center p-2 sm:p-4 lg:p-6 ${isGameFullscreen ? 'game-fullscreen-active' : ''}`}
      >
        <header className="w-full max-w-6xl mb-6 text-center">
          <div className="flex items-center justify-center space-x-3 logo-container">
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
          <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-2xl glow">
            <label htmlFor="gamePrompt" className="block text-sm font-medium text-purple-300 mb-2">
              Enter game idea, revision instructions, or a name for saving to history
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <textarea
                id="gamePrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={hasEditableCode ? "e.g., Make player jump higher OR Name for history" : "e.g., A simple Pong game"}
                className="flex-grow p-3 bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow text-gray-200 placeholder-gray-500 min-h-[60px] sm:min-h-[70px] resize-y"
                rows={2}
                aria-label="Game idea, revision prompt, or name for saving to history"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base btn-animate"
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
                  className="flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base btn-animate"
                  aria-label="Apply manual code changes and refresh game preview"
              >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Apply Edits & Refresh
              </button>
              <button
                  onClick={handleSaveToHistory}
                  disabled={isLoading || !hasEditableCode}
                  className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base btn-animate"
                  aria-label="Save current code and prompt to history"
              >
                  <ArchiveBoxArrowDownIcon className="h-5 w-5 mr-2" />
                  Save to History
              </button>
              <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base btn-animate"
                  aria-label="Reset current prompt, code, and preview"
              >
                  <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                  Reset Current State
              </button>
          </div>

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[50vh] sm:min-h-[60vh] lg:min-h-[600px]">
            <div 
              ref={gameDisplayWrapperRef} 
              className={`game-display-wrapper min-h-[400px] lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden p-1 relative card-hover ${isGameFullscreen ? 'game-display-wrapper-fullscreen' : ''}`}
            >
              <div className='h-full w-full z-10 absolute top-0 left-0 p-2'>
                <GameDisplay 
                  gameCode={hasEditableCode ? { 
                    id: currentId || crypto.randomUUID(),
                    name: currentName || 'Untitled Game',
                    html: currentHtml, 
                    css: currentCss, 
                    js: currentJs 
                  } : null} 
                  previewKey={gamePreviewKey}
                />
              </div>

              <button
                onClick={handleToggleFullscreen}
                className={`absolute top-2 left-2 z-20 p-1.5 sm:p-2 w-10 h-10 flex justify-center items-center rounded-full transition-all duration-200 ease-in-out group btn-animate
                            bg-white/30 hover:bg-white/50 text-gray-800`}
                aria-label={isGameFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isGameFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isGameFullscreen ? 
                  <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" /> : 
                  <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />}
              </button>
            </div>
            <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[200px] lg:min-h-0 card-hover">
               <HistoryPanel 
                  history={gameHistory}
                  onLoad={handleLoadFromHistory}
                  onDelete={handleDeleteFromHistory}
                  isLoading={isLoading}
              />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden mt-4 h-[400px] sm:h-[500px] card-hover">
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
      </div>
    </>
  );
};

export default App;