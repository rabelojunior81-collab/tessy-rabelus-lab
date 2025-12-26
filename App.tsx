
import React, { useState, useRef } from 'react';
import RepositoryBrowser from './components/RepositoryBrowser';
import Canvas from './components/Canvas';
import FactorPanel from './components/FactorPanel';
import FilePreview from './components/FilePreview';
import OptimizationModal from './components/OptimizationModal';
import { interpretIntent, applyFactorsAndGenerate, optimizePrompt } from './services/geminiService';
import { addDoc } from './services/storageService';
import { Factor, RepositoryItem, AttachedFile, OptimizationResult } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('READY');
  const [refreshKey, setRefreshKey] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptModalOpen, setIsOptModalOpen] = useState(false);
  const [lastInterpretation, setLastInterpretation] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [factors, setFactors] = useState<Factor[]>([
    { id: 'prof', type: 'toggle', label: 'Tom Profissional', enabled: false },
    { id: 'flash', type: 'toggle', label: 'Modelo Flash', enabled: true },
    { id: 'detailed', type: 'toggle', label: 'Resposta Detalhada', enabled: false },
    { id: 'code', type: 'toggle', label: 'Formatação de Código', enabled: false },
    { id: 'detail_level', type: 'slider', label: 'Nível de Detalhe', enabled: true, value: 3, min: 1, max: 5 },
    { id: 'audience', type: 'dropdown', label: 'Público-Alvo', enabled: true, value: 'intermediario', options: ['iniciante', 'intermediario', 'avancado', 'especialista'] },
    { id: 'context', type: 'text', label: 'Contexto Adicional', enabled: true, value: '' },
  ]);

  const handleInterpret = async (forcedText?: string) => {
    const textToUse = forcedText ?? inputText;
    if (!textToUse.trim() && attachedFiles.length === 0) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      setStatusMessage('INTERPRETANDO...');
      const interpretation = await interpretIntent(textToUse, attachedFiles);
      setLastInterpretation(interpretation);
      
      if (!interpretation) {
        setResult("Não foi possível processar a intenção.");
        setIsLoading(false);
        setStatusMessage('ERROR');
        return;
      }

      setStatusMessage('GERANDO RESPOSTA...');
      const finalResponse = await applyFactorsAndGenerate(interpretation, factors, attachedFiles);
      
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

  const handleOptimize = async () => {
    if (!inputText || !result || !lastInterpretation) return;
    setIsOptimizing(true);
    try {
      const optimization = await optimizePrompt(inputText, lastInterpretation, result);
      setOptimizationResult(optimization);
      setIsOptModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao otimizar prompt. Tente novamente.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = (optimizedPrompt: string) => {
    setInputText(optimizedPrompt);
    setIsOptModalOpen(false);
    handleInterpret(optimizedPrompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 4 * 1024 * 1024; // 4MB

    // Fix: Explicitly cast Array.from(files) to File[] to ensure 'file' is not treated as 'unknown'
    (Array.from(files) as File[]).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Arquivo ${file.name} ignorado: Formato não suportado.`);
        return;
      }
      if (file.size > maxSize) {
        alert(`Arquivo ${file.name} muito grande (máximo 4MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, {
          id: `file_${Date.now()}_${Math.random()}`,
          name: file.name,
          mimeType: file.type,
          data: base64Data,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleToggleFactor = (id: string, value?: any) => {
    setFactors(prev => prev.map(f => 
      f.id === id 
        ? { ...f, enabled: value !== undefined ? true : !f.enabled, value: value !== undefined ? value : f.value }
        : f
    ));
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
    setRefreshKey(prev => prev + 1);
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
          <div className="flex flex-col">
            <div className="relative group">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                title="Anexar arquivo (Imagens ou PDF)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descreva sua intenção ou anexe um arquivo..."
                className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-12 pr-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm placeholder-slate-500"
              />
              <button
                onClick={() => handleInterpret()}
                disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                className="absolute right-1 top-1 bottom-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold px-4 rounded-full transition-colors shadow-lg"
              >
                {isLoading ? '...' : 'Executar'}
              </button>
            </div>
            <FilePreview files={attachedFiles} onRemove={handleRemoveFile} />
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
        <aside className="w-[20%] min-w-[220px]">
          <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
        </aside>

        <section className="flex-1 w-[50%] min-w-[400px]">
          <Canvas 
            result={result} 
            isLoading={isLoading} 
            isOptimizing={isOptimizing}
            onSavePrompt={handleSaveToRepository} 
            onOptimize={handleOptimize}
          />
        </section>

        <aside className="w-[30%] min-w-[280px]">
          <FactorPanel factors={factors} onToggle={handleToggleFactor} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center space-x-4">
          <span className="font-bold tracking-tighter">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></span>
            <span className="uppercase font-bold tracking-widest text-[9px]">Engine Status: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-4 uppercase font-bold tracking-widest text-[9px]">
          <span>Processing Mode: Multi-Stage Multimodal</span>
          <span>v2.3.0-VEO-HYBRID</span>
        </div>
      </footer>

      <OptimizationModal 
        isOpen={isOptModalOpen}
        result={optimizationResult}
        onClose={() => setIsOptModalOpen(false)}
        onApply={handleApplyOptimization}
      />

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
