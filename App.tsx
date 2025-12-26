
import React, { useState, useRef } from 'react';
import RepositoryBrowser from './components/RepositoryBrowser';
import Canvas from './components/Canvas';
import FactorPanel from './components/FactorPanel';
import OptimizationModal from './components/OptimizationModal';
import { interpretIntent, applyFactorsAndGenerate, optimizePrompt } from './services/geminiService';
import { addDoc } from './services/storageService';
import { Factor, RepositoryItem, AttachedFile, OptimizationResult, ConversationTurn } from './types';

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
  
  // Multi-turn state
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [factors, setFactors] = useState<Factor[]>([
    { id: 'prof', type: 'toggle', label: 'Tom Profissional', enabled: false },
    { id: 'flash', type: 'toggle', label: 'Modelo Flash', enabled: true },
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
    const currentInput = textToUse;
    const currentFiles = [...attachedFiles];
    
    try {
      setStatusMessage('INTERPRETANDO...');
      const interpretation = await interpretIntent(textToUse, currentFiles, conversationHistory);
      setLastInterpretation(interpretation);
      
      if (!interpretation) {
        setResult("Não foi possível processar a intenção.");
        setIsLoading(false);
        setStatusMessage('ERROR');
        return;
      }

      setStatusMessage('GERANDO RESPOSTA...');
      const finalResponse = await applyFactorsAndGenerate(interpretation, factors, currentFiles, conversationHistory);
      
      const newTurn: ConversationTurn = {
        id: `turn_${Date.now()}_${Math.random()}`,
        userMessage: currentInput,
        tessyResponse: finalResponse,
        timestamp: Date.now(),
        attachedFiles: currentFiles.length > 0 ? currentFiles : undefined
      };

      setConversationHistory(prev => [...prev, newTurn]);
      setResult('');
      setInputText('');
      setAttachedFiles([]);
      setStatusMessage('READY');
    } catch (error) {
      console.error(error);
      setResult("Erro no processamento da Tessy. Verifique os logs.");
      setStatusMessage('ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationHistory([]);
    setResult('');
    setInputText('');
    setAttachedFiles([]);
    setStatusMessage('READY');
  };

  const handleOptimize = async () => {
    if (conversationHistory.length === 0) return;
    const lastTurn = conversationHistory[conversationHistory.length - 1];
    
    setIsOptimizing(true);
    try {
      const optimization = await optimizePrompt(lastTurn.userMessage, lastInterpretation, lastTurn.tessyResponse);
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
      setInputText(item.title);
    }
  };

  const handleSaveToRepository = (title: string, description: string) => {
    const lastTurn = conversationHistory[conversationHistory.length - 1];
    const newPrompt = {
      title,
      description,
      content: lastTurn?.tessyResponse || result,
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
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">T</div>
          <h1 className="text-xl font-bold tracking-tight">
            tessy <span className="text-indigo-400 font-light italic">by Rabelus Lab</span>
          </h1>
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

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[15%] min-w-[200px]">
          <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
        </aside>

        <section className="flex-1 w-[60%] min-w-[500px]">
          <Canvas 
            result={result} 
            isLoading={isLoading} 
            isOptimizing={isOptimizing}
            onSavePrompt={handleSaveToRepository} 
            onOptimize={handleOptimize}
            attachedFiles={attachedFiles}
            onRemoveFile={handleRemoveFile}
            conversationHistory={conversationHistory}
            onNewConversation={handleNewConversation}
            inputText={inputText}
            setInputText={setInputText}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleInterpret={handleInterpret}
            handleKeyDown={handleKeyDown}
          />
        </section>

        <aside className="w-[25%] min-w-[260px]">
          <FactorPanel factors={factors} onToggle={handleToggleFactor} />
        </aside>
      </main>

      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center space-x-4">
          <span className="font-bold tracking-tighter">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></span>
            <span className="uppercase font-bold tracking-widest text-[9px]">Engine Status: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-4 uppercase font-bold tracking-widest text-[9px]">
          <span>Conversation Mode: Multi-Turn Intelligence</span>
          <span>v2.5.0-CHRONOS</span>
        </div>
      </footer>

      <OptimizationModal 
        isOpen={isOptModalOpen}
        result={optimizationResult}
        onClose={() => setIsOptModalOpen(false)}
        onApply={handleApplyOptimization}
      />
    </div>
  );
};

export default App;
