import React, { useState, useMemo } from 'react';
import { Conversation } from '../types';
import { getAllConversations, deleteConversation } from '../services/storageService';

interface HistorySidebarProps {
  activeId: string;
  onLoad: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
  refreshKey: number;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ activeId, onLoad, onDelete, refreshKey }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const conversations = useMemo(() => {
    const all = getAllConversations();
    // Sort by updatedAt descending
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [refreshKey]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(term) || 
      c.turns.some(t => t.userMessage.toLowerCase().includes(term) || t.tessyResponse.toLowerCase().includes(term))
    );
  }, [conversations, searchTerm]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteConversation(confirmDeleteId);
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-transparent animate-fade-in">
      <h2 className="text-xl font-black mb-6 text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
        <div className="w-3 h-3 bg-teal-600 animate-pulse"></div>
        Histórico
      </h2>

      <div className="mb-6">
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="BUSCAR CONVERSAS..."
            className="w-full bg-white/80 dark:bg-slate-900/60 border-2 border-teal-600/25 py-2.5 pl-4 pr-10 text-[10px] font-black text-slate-800 dark:text-white placeholder-teal-900/30 focus:outline-none focus:border-teal-600/50 transition-all !rounded-none uppercase tracking-widest"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-teal-600/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {filteredConversations.length === 0 ? (
          <div className="border-2 border-dashed border-teal-600/25 p-8 text-center bg-white/80 dark:bg-transparent">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-relaxed">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhum registro no histórico'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv, index) => {
            const isActive = conv.id === activeId;
            const firstTurn = conv.turns[0];
            const preview = firstTurn ? firstTurn.tessyResponse.substring(0, 60) + '...' : 'Sem conteúdo';
            
            return (
              <div
                key={conv.id}
                onClick={() => onLoad(conv)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`relative w-full text-left p-4 transition-all cursor-pointer group border-2 animate-slide-in-left stagger-item ${
                  isActive 
                    ? 'bg-emerald-600/15 border-emerald-600 shadow-[4px_4px_0_rgba(16,185,129,0.25)]' 
                    : 'bg-white/80 dark:bg-slate-900/40 border-teal-600/25 hover:border-teal-600/40'
                } shadow-[4px_4px_0_rgba(16,185,129,0.05)]`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-[11px] font-black uppercase truncate pr-6 tracking-wider ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                    {conv.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteClick(e, conv.id)}
                    className="absolute top-3 right-3 text-slate-600 hover:text-red-500 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter mb-2">
                  {formatDate(conv.updatedAt)} • {conv.turns.length} ETAPAS
                </p>
                <p className="text-[10px] text-slate-800 dark:text-slate-400 font-medium line-clamp-2 italic">
                  {preview}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Overlay */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Confirmar exclusão?</p>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-600 transition-transform active:scale-95"
            >
              Não
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 py-2 bg-red-600 text-white text-[9px] font-black uppercase transition-transform active:scale-95"
            >
              Sim
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t-2 border-teal-600/25">
        <p className="text-[9px] uppercase tracking-widest text-teal-600/40 font-black">
          SESSÕES ARQUIVADAS
        </p>
      </div>
    </div>
  );
};

export default HistorySidebar;