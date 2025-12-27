
import React, { useState, useRef, useEffect } from 'react';
import SavePromptModal from './SavePromptModal';
import FilePreview from './FilePreview';
import { AttachedFile, ConversationTurn } from '../types';

interface CanvasProps {
  result: string;
  isLoading: boolean;
  isOptimizing: boolean;
  onSavePrompt: (title: string, description: string, tags: string[]) => void;
  onOptimize: () => void;
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
  conversationHistory: ConversationTurn[];
  onNewConversation: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textInputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInterpret: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  pendingUserMessage?: string | null;
  pendingFiles?: AttachedFile[];
}

const Canvas: React.FC<CanvasProps> = ({ 
  result, isLoading, isOptimizing, onSavePrompt, onOptimize, attachedFiles, onRemoveFile,
  conversationHistory, onNewConversation, inputText, setInputText, fileInputRef, textInputRef,
  handleFileUpload, handleInterpret, handleKeyDown, pendingUserMessage, pendingFiles
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [conversationHistory, isLoading, result, pendingUserMessage]);

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
      conversationHistory.forEach(turn => content += `### Usuário\n${turn.userMessage}\n\n### Tessy\n${turn.tessyResponse}\n\n---\n\n`);
      if (result) content += `### Usuário (Atual)\n\n### Tessy\n${result}`;
      filename = 'tessy-chat.md'; mimeType = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify({ timestamp: new Date().toISOString(), history: conversationHistory, currentResult: result }, null, 2);
      filename = 'tessy-chat.json'; mimeType = 'application/json';
    } else {
      content = conversationHistory.map(t => `Usuário: ${t.userMessage}\nTessy: ${t.tessyResponse}`).join("\n\n");
      if (result) content += `\n\nTessy: ${result}`;
      filename = 'tessy-chat.txt'; mimeType = 'text/plain';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url); setShowExportMenu(false);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-transparent overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter glow-text-green">Saída do Canvas</h2>
          {conversationHistory.length > 0 && (
            <button onClick={onNewConversation} className="brutalist-button text-[10px] px-3 py-1.5 bg-red-600/20 text-red-400 font-black uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              Novo Protocolo
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {(result || conversationHistory.length > 0) && !isLoading && (
            <>
              <button onClick={onOptimize} disabled={isOptimizing} className={`brutalist-button text-[10px] px-3 py-2 font-black uppercase tracking-widest flex items-center gap-2 ${isOptimizing ? 'bg-lime-600/50 text-white cursor-not-allowed' : 'bg-lime-600/20 text-lime-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isOptimizing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                Otimizar
              </button>
              <button onClick={handleCopy} className={`brutalist-button text-[10px] px-3 py-2 font-black uppercase tracking-widest flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">{copied ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /> : <><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></>}</svg>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="brutalist-button text-[10px] px-3 py-2 bg-teal-600/20 text-teal-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute top-full mt-2 right-0 glass-panel !shadow-lg py-1 z-20 min-w-[140px] !rounded-none !bg-slate-950/90 !border-emerald-500/40">
                    <button onClick={() => handleExport('markdown')} className="w-full text-left px-4 py-2 text-xs text-white font-bold hover:bg-emerald-500 transition-colors uppercase">Markdown</button>
                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs text-white font-bold hover:bg-emerald-500 transition-colors uppercase">JSON</button>
                    <button onClick={() => handleExport('text')} className="w-full text-left px-4 py-2 text-xs text-white font-bold hover:bg-emerald-500 transition-colors uppercase">Txt</button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsModalOpen(true)} className="brutalist-button text-[10px] px-3 py-2 bg-emerald-600/20 text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" /></svg>
                Salvar
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 w-full glass-panel !rounded-none p-8 overflow-y-auto custom-scrollbar flex flex-col space-y-8 bg-slate-900/30">
        {conversationHistory.length === 0 && !isLoading && !result && !pendingUserMessage && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-center px-12">
            <div className="w-16 h-16 border-4 border-emerald-500/20 mb-4 flex items-center justify-center text-emerald-500/20 font-black text-4xl">?</div>
            <p className="font-black uppercase tracking-widest text-xs">Aguardando entrada de comando...</p>
          </div>
        )}

        {conversationHistory.map((turn) => (
          <div key={turn.id} className="flex flex-col space-y-4">
            <div className="self-end max-w-[90%] bg-emerald-500/10 border-2 border-emerald-500/40 p-4 rounded-none text-sm text-white shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
              <p className="whitespace-pre-wrap font-medium">{turn.userMessage}</p>
              {turn.attachedFiles && turn.attachedFiles.length > 0 && (
                 <div className="mt-3 flex gap-2 flex-wrap">
                    {turn.attachedFiles.map(f => (
                       <div key={f.id} className="text-[9px] bg-emerald-500/30 px-2 py-1 border border-emerald-500/50 font-black uppercase">📎 {f.name}</div>
                    ))}
                 </div>
              )}
            </div>
            <div className="self-start max-w-[90%] bg-slate-800/60 backdrop-blur-xl border-2 border-emerald-500/20 p-5 rounded-none text-sm text-emerald-50 leading-relaxed shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
              <div className="whitespace-pre-wrap">{turn.tessyResponse}</div>
            </div>
          </div>
        ))}

        {pendingUserMessage && (
          <div className="flex flex-col space-y-4 animate-pulse">
            <div className="self-end max-w-[90%] bg-emerald-500/5 border-2 border-emerald-500/20 p-4 text-sm text-slate-400">
              <p className="whitespace-pre-wrap">{pendingUserMessage}</p>
            </div>
            <div className="self-start max-w-[90%] bg-slate-800/40 border-2 border-emerald-500/10 p-5 text-sm text-emerald-400 uppercase font-black tracking-widest flex items-center gap-4">
               <div className="w-1.5 h-1.5 bg-emerald-500 animate-bounce"></div>
               Processando Solicitação...
            </div>
          </div>
        )}

        {result && !isLoading && (
           <div className="self-start max-w-[90%] bg-red-600/20 border-2 border-red-600/40 p-5 text-sm text-red-300 font-bold shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
             <div className="flex items-center gap-2 mb-2 font-black uppercase text-xs">RELATÓRIO DE ERRO</div>
             {result}
           </div>
        )}
      </div>

      <div className="mt-8 flex flex-col space-y-4 shrink-0 z-10">
        {attachedFiles.length > 0 && <div className="px-1"><FilePreview files={attachedFiles} onRemove={onRemoveFile} /></div>}
        <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-2xl p-4 border-2 border-emerald-500/20 shadow-[8px_8px_0_rgba(0,0,0,0.5)] focus-within:border-emerald-500/50 transition-all">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-emerald-400 transition-all border-2 border-transparent hover:border-emerald-500/30" title="Anexar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" />
          <textarea
            ref={textInputRef as any} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Digite sua sequência de comando... (Ctrl+Enter para Executar)"
            className="flex-1 bg-transparent border-none py-2 px-2 focus:outline-none text-base text-white placeholder-emerald-900/50 font-bold resize-none h-[60px] custom-scrollbar"
            disabled={isLoading}
          />
          <button
            onClick={() => handleInterpret()} disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-white text-xs font-black uppercase tracking-[0.2em] px-10 h-[60px] brutalist-button"
          >
            {isLoading ? 'Exec' : 'Transmitir'}
          </button>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] shrink-0 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className={`w-2 h-2 ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>ESTADO: {isLoading ? 'OCUPADO' : 'OCIOSO'}</span>
          <span>PROTOCOLO: {conversationHistory.length} ETAPAS</span>
        </div>
        <span className="text-emerald-500/50">LINK SEGURO ESTABELECIDO</span>
      </div>

      <SavePromptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSavePrompt} />
    </div>
  );
};

export default Canvas;
