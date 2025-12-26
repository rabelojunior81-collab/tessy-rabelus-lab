
import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';

interface CanvasProps {
  result: string;
  isLoading: boolean;
  onSavePrompt: (title: string, description: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({ result, isLoading, onSavePrompt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Canvas</h2>
        <div className="flex items-center space-x-3">
          {result && !isLoading && (
            <>
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
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                </svg>
                <span>Salvar no Repositório</span>
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
        <span>ESTADO: READY</span>
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
