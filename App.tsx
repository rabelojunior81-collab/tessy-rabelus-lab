
import React, { useState } from 'react';
import RepositoryBrowser from './components/RepositoryBrowser';
import Canvas from './components/Canvas';
import FactorPanel from './components/FactorPanel';
import { interpretIntent, applyFactorsAndGenerate } from './services/geminiService';
import { addDoc } from './services/storageService';
import { Factor, RepositoryItem } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('READY');
  const [refreshKey, setRefreshKey] = useState(0);
  const [factors, setFactors] = useState<Factor[]>([
    { id: 'prof', label: 'Tom Profissional', enabled: true },
    { id: 'flash', label: 'Modelo Flash', enabled: true },
    { id: 'detailed', label: 'Resposta Detalhada', enabled: false },
    { id: 'code', label: 'Formatação de Código', enabled: false },
  ]);

  const handleInterpret = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      // Step 1: Interpret intent into JSON
      setStatusMessage('INTERPRETANDO...');
      const interpretation = await interpretIntent(inputText);
      
      if (!interpretation) {
        setResult("Não foi possível processar a intenção.");
        setIsLoading(false);
        setStatusMessage('ERROR');
        return;
      }

      // Step 2: Generate final content using factors
      setStatusMessage('GERANDO RESPOSTA...');
      const finalResponse = await applyFactorsAndGenerate(interpretation, factors);
      
      setResult(finalResponse);
      setStatusMessage('READY');
    } catch (error) {
      console.error(error);
      setResult("Erro no processamento da Tessy. Verifique os logs.");
      setStatusMessage('ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const handleSelectItem = (item: RepositoryItem) => {
    if (item.content) {
      setResult(item.content);
      if (item.factors) setFactors(item.factors);
    }
    setInputText(item.title);
  };

  const handleSaveToRepository = (title: string, description: string) => {
    const newPrompt = {
      title,
      description,
      content: result,
      factors: [...factors],
    };
    addDoc('prompts', newPrompt);
    setRefreshKey(prev => prev + 1); // Trigger refresh in RepositoryBrowser
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInterpret();
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">
            T
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            tessy <span className="text-indigo-400 font-light italic">by Rabelus Lab</span>
          </h1>
        </div>
        
        <div className="flex-1 max-w-2xl px-12">
          <div className="relative group">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva sua intenção para a Tessy..."
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 px-6 pr-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm placeholder-slate-500"
            />
            <button
              onClick={handleInterpret}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-1 top-1 bottom-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold px-4 rounded-full transition-colors shadow-lg"
            >
              {isLoading ? '...' : 'Executar'}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold leading-none">Status</p>
            <p className="text-xs text-green-400 font-medium">System Online</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-inner">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=tessy&backgroundColor=b6e3f4`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Col - 20% */}
        <aside className="w-[20%] min-w-[220px]">
          <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
        </aside>

        {/* Center Col - 50% */}
        <section className="flex-1 w-[50%] min-w-[400px]">
          <Canvas 
            result={result} 
            isLoading={isLoading} 
            onSavePrompt={handleSaveToRepository} 
          />
        </section>

        {/* Right Col - 30% */}
        <aside className="w-[30%] min-w-[280px]">
          <FactorPanel factors={factors} onToggle={toggleFactor} />
        </aside>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center space-x-4">
          <span className="font-bold tracking-tighter">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></span>
            <span className="uppercase font-bold tracking-widest text-[9px]">Engine Status: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-4 uppercase font-bold tracking-widest text-[9px]">
          <span>Processing Mode: Multi-Stage</span>
          <span>v2.2.0-HYBRID</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default App;
