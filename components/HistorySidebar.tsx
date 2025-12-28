import React, { useState, useMemo, useCallback } from 'react';
import { Conversation } from '../types';
import { getAllConversations, deleteConversation } from '../services/storageService';

interface HistorySidebarProps {
  activeId: string;
  onLoad: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
  refreshKey: number;
  onClose?: () => void;
}

const ITEMS_PER_PAGE = 15;

const HistorySidebar: React.FC<HistorySidebarProps> = ({ activeId, onLoad, onDelete, refreshKey, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const allConversationsSorted = useMemo(() => {
    const all = getAllConversations();
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [refreshKey]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return allConversationsSorted;
    const term = searchTerm.toLowerCase();
    return allConversationsSorted.filter(c => 
      c.title.toLowerCase().includes(term) || 
      c.turns.some(t => t.userMessage.toLowerCase().includes(term) || t.tessyResponse.toLowerCase().includes(term))
    );
  }, [allConversationsSorted, searchTerm]);

  const displayedConversations = useMemo(() => {
    return filteredConversations.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [filteredConversations, currentPage]);

  const hasMore = useMemo(() => {
    return displayedConversations.length < filteredConversations.length;
  }, [displayedConversations.length, filteredConversations.length]);

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteConversation(confirmDeleteId);
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, onDelete]);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent animate-fade-in relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-teal-600 animate-pulse"></div>
          Histórico
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="BUSCAR CONVERSAS..."
            className="w-full bg-white/80 dark:bg-slate-900/60 border-2 border-teal-600/25 py-2.5 pl-4 pr-10 text-[9px] sm:text-[10px] font-black text-slate-800 dark:text-white placeholder-teal-900/30 focus:outline-none focus:border-teal-600 transition-all !rounded-none uppercase tracking-widest"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-teal-600/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 pr-1 pb-10">
        {displayedConversations.length === 0 ? (
          <div className="border-2 border-dashed border-teal-600/25 p-8 text-center bg-white/40">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Nenhum registro localizado</p>
          </div>
        ) : (
          <>
            {displayedConversations.map((conv, index) => {
              const isActive = conv.id === activeId;
              const preview = conv.turns.length > 0 ? conv.turns[0].tessyResponse.substring(0, 50) + '...' : 'Vazio';
              
              return (
                <div
                  key={conv.id}
                  onClick={() => onLoad(conv)}
                  className={`relative w-full text-left p-3 sm:p-4 transition-all cursor-pointer border-2 group animate-slide-in-left ${
                    isActive 
                      ? 'bg-emerald-600/10 border-emerald-600 shadow-[4px_4px_0_rgba(16,185,129,0.15)]' 
                      : 'bg-white/80 dark:bg-slate-800/20 border-teal-600/10 hover:border-teal-600/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-[10px] sm:text-[11px] font-black uppercase truncate pr-6 tracking-wider ${isActive ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                      {conv.title}
                    </h3>
                    <button onClick={(e) => handleDeleteClick(e, conv.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{formatDate(conv.updatedAt)}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium line-clamp-1 italic">{preview}</p>
                </div>
              );
            })}
            
            {hasMore && (
              <button onClick={handleLoadMore} className="w-full py-3 border-2 border-emerald-600/20 text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-500/5 transition-all brutalist-button">
                Ver Mais
              </button>
            )}
          </>
        )}
      </div>

      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Confirmar exclusão?</p>
          <div className="flex gap-4 w-full max-w-[200px]">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-600">Não</button>
            <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white text-[9px] font-black uppercase">Sim</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(HistorySidebar);