
import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';

interface CanvasProps {
  result: string;
  isLoading: boolean;
  isOptimizing: boolean;
  onSavePrompt: (title: string, description: string) => void;
  onOptimize: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ result, isLoading, isOptimizing, onSavePrompt, onOptimize }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = (format: 'markdown' | 'json' | 'text') => {
    if (!result) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'markdown') {
      content = `# Resposta da Tessy\n\n${result}`;
      filename = 'tessy-response.md';
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        result: result,
        engine: 'gemini-3-flash-preview'
      };
      content = JSON.stringify(exportData, null, 2);
      filename = 'tessy-response.json';
      mimeType = 'application/json';
    } else {
      content = result;
      filename = 'tessy-response.txt';
      mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Canvas</h2>
        <div className="flex items-center space-x-3">
          {result && !isLoading && (
            <>
              <button
                onClick={onOptimize}
                disabled={isOptimizing}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-2 border ${
                  isOptimizing
                    ? 'bg-purple-600/50 text-white cursor-not-allowed'
                    : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-purple-500/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>{isOptimizing ? 'Otimizando...' : 'Otimizar'}</span>
              </button>

              <button
                onClick={handleCopy}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-2 border ${
                  copied 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  {copied ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <>
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </>
                  )}
                </svg>
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Exportar</span>
                </button>
                
                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-200">
                      <button onClick={() => handleExport('markdown')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                        Markdown (.md)
                      </button>
                      <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                        JSON (.json)
                      </button>
                      <button onClick={() => handleExport('text')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                        Texto (.txt)
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                </svg>
                <span>Salvar</span>
              </button>
            </>
          )}
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300 relative group custom-scrollbar">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-indigo-400 font-medium animate-pulse">Consultando Tessy...</p>
            </div>
          </div>
        ) : null}
        
        {!result && !isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            Aguardando entrada de dados para processamento...
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-medium uppercase tracking-wider">
        <span>ESTADO: {isLoading ? 'PROCESSING' : 'READY'}</span>
        <span>ENGINE: GEMINI-3-FLASH</span>
        <span>SECURE CONNECTION ACTIVE</span>
      </div>

      <SavePromptModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onSavePrompt}
      />
    </div>
  );
};

export default Canvas;
