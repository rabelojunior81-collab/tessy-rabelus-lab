import React, { useState, useRef, useEffect } from 'react';
import RepositoryBrowser from './components/RepositoryBrowser';
import Canvas from './components/Canvas';
import FactorPanel from './components/FactorPanel';
import OptimizationModal from './components/OptimizationModal';
import { interpretIntent, applyFactorsAndGenerate, optimizePrompt } from './services/geminiService';
import { addDoc, generateUUID, saveConversation, loadLastConversation, saveFactors, loadFactors } from './services/storageService';
import { Factor, RepositoryItem, AttachedFile, OptimizationResult, ConversationTurn, Conversation } from './types';

const INITIAL_FACTORS: Factor[] = [
  { id: 'prof', type: 'toggle', label: 'Tom Profissional', enabled: false },
  { id: 'flash', type: 'toggle', label: 'Modelo Flash', enabled: true },
  { id: 'code', type: 'toggle', label: 'Formatação de Código', enabled: false },
  { id: 'detail_level', type: 'slider', label: 'Nível de Detalhe', enabled: true, value: 3, min: 1, max: 5 },
  { id: 'audience', type: 'dropdown', label: 'Público-Alvo', enabled: true, value: 'intermediario', options: ['iniciante', 'intermediario', 'avancado', 'especialista'] },
  { id: 'context', type: 'text', label: 'Contexto Adicional', enabled: true, value: '' },
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('PRONTO');
  const [refreshKey, setRefreshKey] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptModalOpen, setIsOptModalOpen] = useState(false);
  const [lastInterpretation, setLastInterpretation] = useState<any>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation>(() => {
    const last = loadLastConversation();
    if (last) return last;
    return {
      id: generateUUID(),
      title: 'Nova Conversa',
      turns: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });
  const [factors, setFactors] = useState<Factor[]>(() => {
    const saved = loadFactors();
    return saved || INITIAL_FACTORS;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const saveFactorsTimerRef = useRef<number | null>(null);

  const handleNewConversation = () => {
    setCurrentConversation({
      id: generateUUID(),
      title: 'Nova Conversa',
      turns: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setResult('');
    setInputText('');
    setAttachedFiles([]);
    setPendingUserMessage(null);
    setPendingFiles([]);
    setStatusMessage('PRONTO');
    setTimeout(() => textInputRef.current?.focus(), 10);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (saveFactorsTimerRef.current) {
      window.clearTimeout(saveFactorsTimerRef.current);
    }
    saveFactorsTimerRef.current = window.setTimeout(() => {
      saveFactors(factors);
    }, 500);
    return () => {
      if (saveFactorsTimerRef.current) window.clearTimeout(saveFactorsTimerRef.current);
    };
  }, [factors]);

  useEffect(() => {
    if (currentConversation.turns.length > 0) {
      saveConversation(currentConversation);
    }
  }, [currentConversation]);

  const handleInterpret = async (forcedText?: string) => {
    const textToUse = forcedText ?? inputText;
    if (!textToUse.trim() && attachedFiles.length === 0) return;
    const currentInput = textToUse;
    const currentFiles = [...attachedFiles];
    setPendingUserMessage(currentInput);
    setPendingFiles(currentFiles);
    setInputText('');
    setAttachedFiles([]);
    setIsLoading(true);
    setStatusMessage('INTERPRETANDO...');
    setResult('');
    try {
      const interpretation = await interpretIntent(currentInput, currentFiles, currentConversation.turns);
      setLastInterpretation(interpretation);
      if (!interpretation) {
        setResult("Não foi possível processar a intenção.");
        setStatusMessage('ERRO');
        return;
      }
      setStatusMessage('GERANDO RESPOSTA...');
      const finalResponse = await applyFactorsAndGenerate(interpretation, factors, currentFiles, currentConversation.turns);
      const newTurn: ConversationTurn = {
        id: generateUUID(),
        userMessage: currentInput,
        tessyResponse: finalResponse,
        timestamp: Date.now(),
        attachedFiles: currentFiles.length > 0 ? currentFiles : undefined
      };
      setCurrentConversation(prev => {
        const isFirstMessage = prev.turns.length === 0;
        let newTitle = prev.title;
        if (isFirstMessage) {
          const rawTitle = currentInput.trim();
          newTitle = rawTitle.substring(0, 50) + (rawTitle.length > 50 ? '...' : '');
        }
        return { ...prev, title: newTitle, turns: [...prev.turns, newTurn], updatedAt: Date.now() };
      });
      setStatusMessage('PRONTO');
    } catch (error) {
      console.error(error);
      setResult("Erro no processamento da Tessy. Verifique os logs e sua conexão.");
      setStatusMessage('ERRO');
    } finally {
      setIsLoading(false);
      setPendingUserMessage(null);
      setPendingFiles([]);
    }
  };

  const handleOptimize = async () => {
    if (currentConversation.turns.length === 0) return;
    const lastTurn = currentConversation.turns[currentConversation.turns.length - 1];
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
    setIsOptModalOpen(false);
    handleInterpret(optimizedPrompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 4 * 1024 * 1024;
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
          id: generateUUID(),
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
    if (!item.content) return;
    if (item.factors) setFactors(item.factors);
    const newTurn: ConversationTurn = {
      id: generateUUID(),
      userMessage: item.title,
      tessyResponse: item.content,
      timestamp: item.timestamp || Date.now()
    };
    setCurrentConversation(prev => ({
      ...prev,
      turns: [...prev.turns, newTurn],
      updatedAt: Date.now()
    }));
    setInputText('');
    setStatusMessage('PRONTO');
  };

  const handleSaveToRepository = (title: string, description: string) => {
    const lastTurn = currentConversation.turns[currentConversation.turns.length - 1];
    const newPrompt = {
      title,
      description,
      content: lastTurn?.tessyResponse || result,
      factors: [...factors],
    };
    addDoc('prompts', newPrompt);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
      <header className="h-16 flex items-center justify-between px-8 border-b-2 border-white/10 bg-slate-900/60 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-cyan-500 flex items-center justify-center font-black text-2xl text-white shadow-[4px_4px_0_rgba(0,0,0,0.5)] border-2 border-white/20">T</div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight leading-none text-white uppercase">
              tessy <span className="text-cyan-400 font-light italic text-lg lowercase">by Rabelus Lab</span>
            </h1>
            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">{currentConversation.title}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-black leading-none tracking-widest">Protocolo de Sistema</p>
            <p className="text-xs text-cyan-400 font-bold uppercase mt-1">v2.6.0-Liquid</p>
          </div>
          <div className="w-11 h-11 border-2 border-cyan-500/50 p-0.5 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=tessy-v2&backgroundColor=b6e3f4`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Coluna 1: RepositoryBrowser (15%) */}
        <aside className="w-[15%] min-w-[200px] border-r-2 border-white/10 glass-panel shadow-none border-t-0 border-b-0">
          <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
        </aside>

        {/* Coluna 2: Canvas (60%) */}
        <section className="w-[60%] min-w-[500px] flex-1">
          <Canvas 
            result={result} 
            isLoading={isLoading} 
            isOptimizing={isOptimizing}
            onSavePrompt={handleSaveToRepository} 
            onOptimize={handleOptimize}
            attachedFiles={attachedFiles}
            onRemoveFile={handleRemoveFile}
            conversationHistory={currentConversation.turns}
            onNewConversation={handleNewConversation}
            inputText={inputText}
            setInputText={setInputText}
            fileInputRef={fileInputRef}
            textInputRef={textInputRef}
            handleFileUpload={handleFileUpload}
            handleInterpret={handleInterpret}
            handleKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleInterpret();
              }
            }}
            pendingUserMessage={pendingUserMessage}
            pendingFiles={pendingFiles}
          />
        </section>

        {/* Coluna 3: FactorPanel (25%) */}
        <aside className="w-[25%] min-w-[300px] border-l-2 border-white/10 glass-panel shadow-none border-t-0 border-b-0">
          <FactorPanel factors={factors} onToggle={handleToggleFactor} />
        </aside>
      </main>

      <footer className="h-10 border-t-2 border-white/10 bg-slate-900/80 px-8 flex items-center justify-between text-[10px] text-slate-400 font-black tracking-[0.2em] shrink-0 z-20">
        <div className="flex items-center space-x-6">
          <span className="text-white">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500'} shadow-[0_0_10px_rgba(14,165,233,0.5)]`}></span>
            <span className="uppercase text-white">MOTOR: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-8">
          <span>SINC SEGURA: ATIVA</span>
          <span className="text-cyan-400">PULSE PROTOCOL 2.6.0</span>
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