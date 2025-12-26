
import React, { useEffect, useState } from 'react';
import { RepositoryItem } from '../types';
import { getDocs, deleteDoc } from '../services/storageService';

interface RepositoryBrowserProps {
  onSelectItem: (item: RepositoryItem) => void;
  refreshKey: number;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ onSelectItem, refreshKey }) => {
  const [items, setItems] = useState<RepositoryItem[]>([]);

  const staticItems: RepositoryItem[] = [
    { id: 's1', title: 'Análise de Sentimento', description: 'Detecta tons emocionais em textos.', timestamp: 0 },
    { id: 's2', title: 'Resumo Executivo', description: 'Cria resumos concisos para reuniões.', timestamp: 0 },
  ];

  const loadItems = () => {
    const localItems = getDocs('prompts');
    setItems([...localItems, ...staticItems]);
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id.startsWith('s')) return; // Don't delete static items
    deleteDoc('prompts', id);
    loadItems();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 p-4">
      <h2 className="text-xl font-bold mb-6 text-indigo-400">Repositório</h2>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">Nenhum prompt salvo.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="relative w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 group cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-200 group-hover:text-white truncate pr-6">{item.title}</h3>
                {!item.id.startsWith('s') && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Excluir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.description || 'Sem descrição'}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-800">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rabelus Lab Assets</p>
      </div>
    </div>
  );
};

export default RepositoryBrowser;
