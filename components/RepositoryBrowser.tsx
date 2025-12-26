
import React from 'react';
import { RepositoryItem } from '../types';

interface RepositoryBrowserProps {
  onSelectItem: (item: RepositoryItem) => void;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ onSelectItem }) => {
  const staticItems: RepositoryItem[] = [
    { id: '1', title: 'Análise de Sentimento', description: 'Detecta tons emocionais em textos.' },
    { id: '2', title: 'Resumo Executivo', description: 'Cria resumos concisos para reuniões.' },
    { id: '3', title: 'Geração de Ideias', description: 'Brainstorming para novos projetos.' },
    { id: '4', title: 'Tradução Criativa', description: 'Adapta gírias e contextos culturais.' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 p-4">
      <h2 className="text-xl font-bold mb-6 text-indigo-400">Repositório</h2>
      <div className="space-y-3 overflow-y-auto">
        {staticItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 group"
          >
            <h3 className="font-semibold text-slate-200 group-hover:text-white">{item.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
          </button>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-800">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rabelus Lab Assets</p>
      </div>
    </div>
  );
};

export default RepositoryBrowser;
