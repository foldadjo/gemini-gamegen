import React, { useState, useCallback } from 'react';
import { CodeBracketIcon, DocumentTextIcon, PaintBrushIcon, BoltIcon, ClipboardDocumentIcon } from './icons/EditorIcons';

interface CodeViewerProps {
  html: string;
  css: string;
  js: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onJsChange: (value: string) => void;
  isLoading: boolean;
}

type TabName = 'HTML' | 'CSS' | 'JavaScript';
type CopyStatus = '' | 'Copied!' | 'Failed!';

export const CodeViewer: React.FC<CodeViewerProps> = ({
  html,
  css,
  js,
  onHtmlChange,
  onCssChange,
  onJsChange,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('HTML');
  const [copyStatus, setCopyStatus] = useState<Record<TabName, CopyStatus>>({ HTML: '', CSS: '', JavaScript: '' });

  const handleCopy = useCallback(async (textToCopy: string, tab: TabName) => {
    if (!navigator.clipboard) {
      setCopyStatus(prev => ({ ...prev, [tab]: 'Failed!' }));
      console.warn('Clipboard API not available.');
      setTimeout(() => setCopyStatus(prev => ({ ...prev, [tab]: '' })), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus(prev => ({ ...prev, [tab]: 'Copied!' }));
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyStatus(prev => ({ ...prev, [tab]: 'Failed!' }));
    }
    setTimeout(() => setCopyStatus(prev => ({ ...prev, [tab]: '' })), 2000);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
          <CodeBracketIcon className="w-16 h-16 text-purple-400 mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Generating Code...</h3>
          <p>The AI is crafting your game. Please wait.</p>
        </div>
      );
    }
    if (!html && !css && !js && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
          <CodeBracketIcon className="w-16 h-16 text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Editable Code Area</h3>
          <p>Generate a game or start typing to see HTML, CSS, and JavaScript here.</p>
          <p className="mt-1 text-sm">Use the tabs to switch between code types.</p>
        </div>
      );
    }

    let value: string;
    let onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    let ariaLabel: string;
    let currentCodeContent: string;

    switch (activeTab) {
      case 'HTML':
        value = html;
        onChange = (e) => onHtmlChange(e.target.value);
        ariaLabel = "HTML code editor";
        currentCodeContent = html;
        break;
      case 'CSS':
        value = css;
        onChange = (e) => onCssChange(e.target.value);
        ariaLabel = "CSS code editor";
        currentCodeContent = css;
        break;
      case 'JavaScript':
        value = js;
        onChange = (e) => onJsChange(e.target.value);
        ariaLabel = "JavaScript code editor";
        currentCodeContent = js;
        break;
      default:
        return <p className="p-4 text-gray-400">Select a tab to view and edit code.</p>;
    }

    return (
      <div className="relative h-full">
        <textarea
          value={value}
          onChange={onChange}
          className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-300 border-0 rounded-b-lg focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          spellCheck="false"
          aria-label={ariaLabel}
          style={{minHeight: 'calc(100% - 0px)'}}
        />
        <button
          onClick={() => handleCopy(currentCodeContent, activeTab)}
          className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-purple-300 rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label={`Copy ${activeTab} code to clipboard`}
          title={`Copy ${activeTab} Code`}
          disabled={!currentCodeContent}
        >
          {copyStatus[activeTab] ? (
            copyStatus[activeTab]
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  const TabButton: React.FC<{ name: TabName; icon: React.ReactNode }> = ({ name, icon }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm rounded-t-lg transition-colors
                  ${activeTab === name 
                    ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-500' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-purple-300'}`}
      role="tab"
      aria-selected={activeTab === name}
      aria-controls={`tabpanel-${name.toLowerCase()}`}
      id={`tab-${name.toLowerCase()}`}
    >
      {icon}
      <span className="ml-2">{name}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-xl">
      <div className="flex border-b border-gray-700 px-2 pt-2" role="tablist" aria-label="Code type">
        <TabButton name="HTML" icon={<DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <TabButton name="CSS" icon={<PaintBrushIcon className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <TabButton name="JavaScript" icon={<BoltIcon className="w-4 h-4 sm:w-5 sm:h-5" />} />
      </div>
      <div 
        className="flex-grow overflow-hidden" 
        role="tabpanel" 
        id={`tabpanel-${activeTab.toLowerCase()}`} 
        aria-labelledby={`tab-${activeTab.toLowerCase()}`}
      >
        {renderContent()}
      </div>
    </div>
  );
};
