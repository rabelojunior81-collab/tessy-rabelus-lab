
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { RepositoryItem } from '../types';
import { getDocs, deleteDoc, getAllTags } from '../services/storageService';

interface RepositoryBrowserProps {
  onSelectItem: (item: RepositoryItem) => void;
  refreshKey: number;
  onClose?: () => void;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ onSelectItem, refreshKey, onClose }) => {
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadItems = useCallback(() => {
    const localItems = getDocs('prompts') as RepositoryItem[];
    setItems(localItems);
    setAvailableTags(getAllTags());
  }, []);

  useEffect(() => {
    loadItems();
  }, [refreshKey, loadItems]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDoc('prompts', id);
    loadItems();
  }, [loadItems]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredItems = useMemo(() => {
    let results = items;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.content && item.content.toLowerCase().includes(term))
      );
    }

    if (selectedTags.length > 0) {
      results = results.filter(item => 
        selectedTags.every(tag => item.tags?.includes(tag.toLowerCase()))
      );
    }

    return results;
  }, [items, selectedTags, searchTerm]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent animate-fade-in relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-600 animate-pulse"></div>
          Biblioteca
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="BUSCAR PROMPTS..."
          className="w-full bg-white/80 dark:bg-slate-900/60 border-2 border-emerald-600/25 py-2.5 px-4 text-[9px] sm:text-[10px] font-black text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all !rounded-none uppercase tracking-widest"
        />
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-0.5 text-[8px] font-black uppercase border transition-all ${
                selectedTags.includes(tag) 
                  ? 'bg-emerald-600 border-emerald-300 text-white' 
                  : 'bg-white/40 border-emerald-600/10 text-slate-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-10">
        {filteredItems.length === 0 ? (
          <div className="border-2 border-dashed border-emerald-600/20 p-8 text-center bg-white/40">
            <p className="text-[10px] text-slate-500 font-black uppercase italic">Nenhum item na biblioteca</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="relative w-full text-left p-3 sm:p-4 bg-white/60 dark:bg-slate-800/10 border-2 border-emerald-600/10 hover:border-emerald-600/40 transition-all cursor-pointer group shadow-[4px_4px_0_rgba(16,185,129,0.03)]"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-white uppercase truncate pr-6 tracking-wider group-hover:text-emerald-600 transition-colors">
                  {item.title}
                </h3>
                <button onClick={(e) => handleDelete(e, item.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase line-clamp-2">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(RepositoryBrowser);
