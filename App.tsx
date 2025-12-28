import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import HistorySidebar from './components/HistorySidebar';
import Canvas from './components/Canvas';
import FactorPanel from './components/FactorPanel';
import { DateAnchor } from './components/DateAnchor';
import { interpretIntent, applyFactorsAndGenerate, optimizePrompt } from './services/geminiService';
import { addDoc, generateUUID, saveConversation, loadLastConversation, saveFactors, loadFactors, cleanOldConversations } from './services/storageService';
import { Factor, RepositoryItem, AttachedFile, OptimizationResult, ConversationTurn, Conversation } from './types';

// Lazy Loaded Components
const RepositoryBrowser = lazy(() => import('./components/RepositoryBrowser'));
const OptimizationModal = lazy(() => import('./components/OptimizationModal'));
const SavePromptModal = lazy(() => import('./components/SavePromptModal'));
const TemplateLibraryModal = lazy(() => import('./components/TemplateLibraryModal'));
const ShareModal = lazy(() => import('./components/ShareModal'));

const INITIAL_FACTORS: Factor[] = [
  { id: 'prof', type: 'toggle', label: 'Tom Profissional', enabled: false },
  { id: 'flash', type: 'toggle', label: 'Modelo Flash', enabled: true },
  { id: 'code', type: 'toggle', label: 'Formatação de Código', enabled: false },
  { id: 'grounding', type: 'toggle', label: 'Busca em Tempo Real', enabled: true },
  { id: 'detail_level', type: 'slider', label: 'Nível de Detalhe', enabled: true, value: 3, min: 1, max: 5 },
  { id: 'audience', type: 'dropdown', label: 'Público-Alvo', enabled: true, value: 'intermediario', options: ['iniciante', 'intermediario', 'avancado', 'especialista'] },
  { id: 'context', type: 'text', label: 'Contexto Adicional', enabled: true, value: '' },
];

const TessyLogo = React.memo(() => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="2 2" className="animate-[spin_20s_linear_infinite]" />
      <path d="M20 30 L50 15 L80 30" fill="none" stroke="url(#logoGrad)" strokeWidth="1" strokeOpacity="0.3" />
      <path d="M20 70 L50 85 L80 70" fill="none" stroke="url(#logoGrad)" strokeWidth="1" strokeOpacity="0.3" />
      <path d="M25 25 H75 V35 H55 V80 H45 V35 H25 Z" fill="url(#logoGrad)" className="drop-shadow-sm" />
      <circle cx="50" cy="15" r="3" fill="#84cc16" className="animate-pulse" />
      <circle cx="80" cy="30" r="2.5" fill="#10b981" />
      <circle cx="20" cy="30" r="2.5" fill="#10b981" />
      <circle cx="50" cy="85" r="3" fill="#14b8a6" className="animate-pulse" />
    </svg>
  </div>
));

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('tessy-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  const [activeTab, setActiveTab] = useState<'library' | 'history'>('history');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('PRONTO');
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
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

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('tessy-theme', theme);
  }, [theme]);

  // Cleanup old conversations on mount
  useEffect(() => {
    const removed = cleanOldConversations();
    if (removed > 0) {
      console.log(`Sistema: ${removed} conversas antigas foram removidas do histórico local.`);
      setHistoryRefreshKey(prev => prev + 1);
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), []);

  const handleNewConversation = useCallback(() => {
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
    setHistoryRefreshKey(p => p + 1);
    setTimeout(() => textInputRef.current?.focus(), 10);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textInputRef.current?.focus();
      }
      if (isCtrlOrMeta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
      if (isCtrlOrMeta && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveTab(prev => prev === 'history' ? 'library' : 'history');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [handleNewConversation]);

  useEffect(() => {
    if (saveFactorsTimerRef.current) window.clearTimeout(saveFactorsTimerRef.current);
    saveFactorsTimerRef.current = window.setTimeout(() => saveFactors(factors), 500);
    return () => { if (saveFactorsTimerRef.current) window.clearTimeout(saveFactorsTimerRef.current); };
  }, [factors]);

  useEffect(() => {
    if (currentConversation.turns.length > 0) {
      saveConversation(currentConversation);
      setHistoryRefreshKey(p => p + 1);
    }
  }, [currentConversation.turns.length, currentConversation.updatedAt, currentConversation.id]);

  const handleInterpret = useCallback(async (forcedText?: string) => {
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
      
      const groundingEnabled = factors.find(f => f.id === 'grounding')?.enabled ?? true;
      setStatusMessage('GERANDO RESPOSTA...');
      const generationResult = await applyFactorsAndGenerate(interpretation, factors, currentFiles, currentConversation.turns, groundingEnabled);
      
      const newTurn: ConversationTurn = {
        id: generateUUID(),
        userMessage: currentInput,
        tessyResponse: generationResult.text,
        timestamp: Date.now(),
        attachedFiles: currentFiles.length > 0 ? currentFiles : undefined,
        groundingChunks: generationResult.groundingChunks
      };
      
      setCurrentConversation(prev => {
        const isFirstMessage = prev.turns.length === 0;
        let newTitle = prev.title;
        if (isFirstMessage) {
          const rawTitle = currentInput.trim();
          newTitle = rawTitle.substring(0, 50) + (rawTitle.length > 50 ? '...' : '');
        }
        return { 
          ...prev, 
          title: newTitle, 
          turns: [...prev.turns, newTurn], 
          updatedAt: Date.now() 
        };
      });
      setStatusMessage('PRONTO');
    } catch (error) {
      console.error(error);
      setResult("Erro no processamento. Verifique sua conexão.");
      setStatusMessage('ERRO');
    } finally {
      setIsLoading(false);
      setPendingUserMessage(null);
      setPendingFiles([]);
    }
  }, [inputText, attachedFiles, currentConversation.turns, factors]);

  const handleOptimize = useCallback(async () => {
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
  }, [currentConversation.turns, lastInterpretation]);

  const handleApplyOptimization = useCallback((optimizedPrompt: string) => {
    setIsOptModalOpen(false);
    handleInterpret(optimizedPrompt);
  }, [handleInterpret]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 4 * 1024 * 1024;
    (Array.from(files) as File[]).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Arquivo ${file.name} ignorado.`);
        return;
      }
      if (file.size > maxSize) {
        alert(`Arquivo muito grande (máximo 4MB).`);
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
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleToggleFactor = useCallback((id: string, value?: any) => {
    setFactors(prev => prev.map(f => 
      f.id === id 
        ? { ...f, enabled: value !== undefined ? true : !f.enabled, value: value !== undefined ? value : f.value }
        : f
    ));
  }, []);

  const handleSelectItem = useCallback((item: RepositoryItem) => {
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
  }, []);

  const handleLoadConversationFromHistory = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setResult('');
    setInputText('');
    setAttachedFiles([]);
    setStatusMessage('PRONTO');
    localStorage.setItem('tessy_last_conv_id', conversation.id);
  }, []);

  const handleDeleteConversationFromHistory = useCallback((id: string) => {
    if (currentConversation.id === id) {
      handleNewConversation();
    }
    setHistoryRefreshKey(p => p + 1);
  }, [currentConversation.id, handleNewConversation]);

  const handleSaveToRepository = useCallback((title: string, description: string, tags: string[]) => {
    const lastTurn = currentConversation.turns[currentConversation.turns.length - 1];
    const newPrompt = {
      title,
      description,
      content: lastTurn?.tessyResponse || result,
      factors: [...factors],
      tags: tags
    };
    addDoc('prompts', newPrompt);
    setRefreshKey(prev => prev + 1);
  }, [currentConversation.turns, result, factors]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-emerald-600/30">
      <header className="h-16 flex items-center justify-between px-8 border-b-2 border-emerald-600/25 bg-white/85 dark:bg-slate-900/60 backdrop-blur-2xl z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <TessyLogo />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight leading-none text-slate-800 dark:text-white uppercase glow-text-green">
              tessy <span className="text-emerald-600 dark:text-emerald-400 font-light italic text-lg lowercase">by rabelus lab</span>
            </h1>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 tracking-[0.2em] uppercase mt-1">{currentConversation.title}</span>
          </div>
        </div>

        <DateAnchor 
          groundingEnabled={factors.find(f => f.id === 'grounding')?.enabled || false} 
        />
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center brutalist-button bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 border-emerald-600/25 transition-transform duration-300 active:scale-90"
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            <div className={`transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}>
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              )}
            </div>
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/50 uppercase font-black leading-none tracking-widest">Protocolo Seguro</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mt-1">v2.7.5-Optimized</p>
          </div>
          <div className="w-11 h-11 border-2 border-emerald-600/25 p-0.5 shadow-[4px_4px_0_rgba(16,185,129,0.15)] bg-white/85 dark:bg-slate-950/40">
            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=tessy-green&backgroundColor=10b981`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[18%] min-w-[250px] border-r-2 border-emerald-600/15 glass-panel shadow-none border-t-0 border-b-0 flex flex-col">
          <div className="flex border-b-2 border-emerald-600/15 shrink-0">
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Histórico
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Biblioteca
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              {activeTab === 'library' ? (
                <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
              ) : (
                <HistorySidebar 
                  activeId={currentConversation.id} 
                  onLoad={handleLoadConversationFromHistory}
                  onDelete={handleDeleteConversationFromHistory}
                  refreshKey={historyRefreshKey}
                />
              )}
            </Suspense>
          </div>
        </aside>

        <section className="w-[57%] min-w-[500px] flex-1">
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
            factors={factors}
            conversationTitle={currentConversation.title}
            conversationId={currentConversation.id}
            onImportSuccess={handleLoadConversationFromHistory}
          />
        </section>

        <aside className="w-[25%] min-w-[300px] border-l-2 border-emerald-600/15 glass-panel shadow-none border-t-0 border-b-0">
          <FactorPanel factors={factors} onToggle={handleToggleFactor} />
        </aside>
      </main>

      <footer className="h-10 border-t-2 border-emerald-600/25 bg-white/85 dark:bg-slate-900/80 px-8 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-black tracking-[0.2em] shrink-0 z-20">
        <div className="flex items-center space-x-6">
          <span className="text-emerald-600/70 dark:text-emerald-500/70">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></span>
            <span className="uppercase text-slate-800 dark:text-white">MOTOR: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-8">
          <span className="text-emerald-600/40 dark:text-emerald-500/40">SINC SEGURA: ATIVA</span>
          <span className="text-emerald-600 dark:text-emerald-400">PULSE PROTOCOL 2.7.5</span>
        </div>
      </footer>

      <Suspense fallback={null}>
        {isOptModalOpen && optimizationResult && (
          <OptimizationModal 
            isOpen={isOptModalOpen}
            result={optimizationResult}
            onClose={() => setIsOptModalOpen(false)}
            onApply={handleApplyOptimization}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;