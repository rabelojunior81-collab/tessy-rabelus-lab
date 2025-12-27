
import React, { useEffect, useState, useMemo } from 'react';
import { RepositoryItem } from '../types';
import { getDocs, deleteDoc, getAllTags } from '../services/storageService';

interface RepositoryBrowserProps {
  onSelectItem: (item: RepositoryItem) => void;
  refreshKey: number;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ onSelectItem, refreshKey }) => {
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const loadItems = () => {
    const localItems = getDocs('prompts') as RepositoryItem[];
    setItems(localItems);
    setAvailableTags(getAllTags());
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDoc('prompts', id);
    loadItems();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) return items;
    return items.filter(item => 
      selectedTags.every(tag => item.tags?.includes(tag.toLowerCase()))
    );
  }, [items, selectedTags]);

  return (
    <div className="h-full flex flex-col p-6 bg-transparent">
      <h2 className="text-xl font-black mb-6 text-white uppercase tracking-widest flex items-center gap-3">
        <div className="w-3 h-3 bg-emerald-500 animate-pulse"></div>
        Biblioteca
      </h2>

      {/* Tag Filters Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filtros</p>
          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              className="text-[9px] text-emerald-400 font-bold uppercase hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
          {availableTags.length === 0 ? (
             <span className="text-[9px] text-slate-600 font-black uppercase italic">Sem tags disponíveis</span>
          ) : (
            availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-[9px] font-black uppercase transition-all border ${
                  selectedTags.includes(tag) 
                    ? 'bg-emerald-500 border-emerald-300 text-white shadow-[2px_2px_0_rgba(16,185,129,0.3)]' 
                    : 'bg-slate-900/40 border-emerald-500/10 text-slate-500 hover:border-emerald-500/30'
                }`}
              >
                {tag}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
         <span className="text-[10px] text-emerald-500/70 font-black uppercase">Resultados: {filteredItems.length}</span>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="border-2 border-dashed border-emerald-500/10 p-8 text-center bg-slate-900/20">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {items.length === 0 ? 'Arquivo Vazio' : 'Nenhum Correspondente'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="relative w-full text-left p-4 bg-slate-900/40 border-2 border-emerald-500/10 hover:border-emerald-500/50 hover:bg-emerald-900/20 transition-all cursor-pointer group shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black text-white uppercase truncate pr-8 tracking-wider group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute top-3 right-3 text-slate-600 hover:text-red-500 transition-colors p-1"
                  title="Apagar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest line-clamp-2 mb-3">
                {item.description || 'Nenhuma Descrição Disponível'}
              </p>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 5).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 5 && (
                    <span className="text-[8px] text-slate-600 font-black self-center">+{item.tags.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-8 pt-6 border-t-2 border-emerald-500/10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/50 font-black">
          RABELUS ASSET CORE
        </p>
      </div>
    </div>
  );
};

export default RepositoryBrowser;
