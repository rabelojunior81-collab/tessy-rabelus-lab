import React, { useEffect, useState } from 'react';
import { RepositoryItem } from '../types';
import { getDocs, deleteDoc } from '../services/storageService';

interface RepositoryBrowserProps {
  onSelectItem: (item: RepositoryItem) => void;
  refreshKey: number;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ onSelectItem, refreshKey }) => {
  const [items, setItems] = useState<RepositoryItem[]>([]);

  const loadItems = () => {
    const localItems = getDocs('prompts');
    setItems(localItems);
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDoc('prompts', id);
    loadItems();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-transparent">
      <h2 className="text-xl font-black mb-8 text-white uppercase tracking-widest flex items-center gap-3">
        <div className="w-3 h-3 bg-cyan-500 animate-pulse"></div>
        Biblioteca
      </h2>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="border-2 border-dashed border-white/10 p-8 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Arquivo Vazio</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="relative w-full text-left p-4 bg-slate-900/40 border-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-900/20 transition-all cursor-pointer group shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black text-white uppercase truncate pr-8 tracking-wider group-hover:text-cyan-400 transition-colors">
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
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest line-clamp-2">
                {item.description || 'Nenhuma Descrição Disponível'}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="mt-8 pt-6 border-t-2 border-white/10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-500/50 font-black">
          RABELUS ASSET CORE
        </p>
      </div>
    </div>
  );
};

export default RepositoryBrowser;