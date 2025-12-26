
import React, { useState, useRef, useEffect } from 'react';
import SavePromptModal from './SavePromptModal';
import FilePreview from './FilePreview';
import { AttachedFile, ConversationTurn } from '../types';

interface CanvasProps {
  result: string;
  isLoading: boolean;
  isOptimizing: boolean;
  onSavePrompt: (title: string, description: string) => void;
  onOptimize: () => void;
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
  conversationHistory: ConversationTurn[];
  onNewConversation: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  result, 
  isLoading, 
  isOptimizing, 
  onSavePrompt, 
  onOptimize, 
  attachedFiles, 
  onRemoveFile,
  conversationHistory,
  onNewConversation
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [conversationHistory, isLoading, result]);

  const handleCopy = () => {
    const textToCopy = result || (conversationHistory.length > 0 ? conversationHistory[conversationHistory.length-1].tessyResponse : "");
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = (format: 'markdown' | 'json' | 'text') => {
    const lastResponse = result || (conversationHistory.length > 0 ? conversationHistory[conversationHistory.length-1].tessyResponse : "");
    if (!lastResponse) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'markdown') {
      content = `# Histórico de Conversa Tessy\n\n`;
      conversationHistory.forEach(turn => {
        content += `### Usuário\n${turn.userMessage}\n\n### Tessy\n${turn.tessyResponse}\n\n---\n\n`;
      });
      if (result) content += `### Usuário (Atual)\n\n### Tessy\n${result}`;
      filename = 'tessy-chat.md';
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        history: conversationHistory,
        currentResult: result
      };
      content = JSON.stringify(exportData, null, 2);
      filename = 'tessy-chat.json';
      mimeType = 'application/json';
    } else {
      content = conversationHistory.map(t => `Usuário: ${t.userMessage}\nTessy: ${t.tessyResponse}`).join("\n\n");
      if (result) content += `\n\nTessy: ${result}`;
      filename = 'tessy-chat.txt';
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Canvas
          </h2>
          {conversationHistory.length > 0 && (
            <button
              onClick={onNewConversation}
              className="text-[10px] px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg transition-all font-bold flex items-center gap-1.5 uppercase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Nova Conversa
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {(result || conversationHistory.length > 0) && !isLoading && (
            <>
              <button
                onClick={onOptimize}
                disabled={isOptimizing}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg transition-all font-bold flex items-center space-x-1.5 border uppercase tracking-wider ${
                  isOptimizing
                    ? 'bg-purple-600/50 text-white cursor-not-allowed'
                    : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-purple-500/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isOptimizing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Otimizar</span>
              </button>

              <button
                onClick={handleCopy}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg transition-all font-bold flex items-center space-x-1.5 border uppercase tracking-wider ${
                  copied 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  {copied ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <>
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </>
                  )}
                </svg>
                <span>Copiar</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-[10px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1.5 rounded-lg transition-all font-bold flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Exportar</span>
                </button>
                
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-200">
                      <button onClick={() => handleExport('markdown')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">Markdown (.md)</button>
                      <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">JSON (.json)</button>
                      <button onClick={() => handleExport('text')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">Texto (.txt)</button>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-all font-bold flex items-center space-x-1.5 uppercase tracking-wider"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                </svg>
                <span>Salvar</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <FilePreview files={attachedFiles} onRemove={onRemoveFile} />
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4"
      >
        {conversationHistory.length === 0 && !isLoading && !result && (
          <div className="h-full flex items-center justify-center text-slate-600 italic text-center px-12">
            Aguardando entrada de dados para iniciar a conversação inteligente...
          </div>
        )}

        {conversationHistory.map((turn) => (
          <div key={turn.id} className="flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* User Message */}
            <div className="self-end max-w-[85%] bg-indigo-600/20 border border-indigo-500/30 p-3 rounded-2xl rounded-tr-none text-sm text-white shadow-sm">
              <p className="whitespace-pre-wrap">{turn.userMessage}</p>
              {turn.attachedFiles && turn.attachedFiles.length > 0 && (
                 <div className="mt-2 flex gap-1 flex-wrap">
                    {turn.attachedFiles.map(f => (
                       <div key={f.id} className="text-[8px] bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">📎 {f.name}</div>
                    ))}
                 </div>
              )}
            </div>
            
            {/* Tessy Response */}
            <div className="self-start max-w-[85%] bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none text-sm text-slate-300 leading-relaxed shadow-sm font-sans">
              <div className="whitespace-pre-wrap">{turn.tessyResponse}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col space-y-2 animate-pulse">
            <div className="self-start max-w-[85%] bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none text-sm text-slate-500 italic">
              {result || 'Tessy está processando sua solicitação...'}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
        <div className="flex items-center gap-3">
          <span>STATE: {isLoading ? 'BUSY' : 'IDLE'}</span>
          <span>•</span>
          <span>CONTEXT: {conversationHistory.length} TURNS</span>
        </div>
        <span>SECURITY: AES-256 ENCRYPTED</span>
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