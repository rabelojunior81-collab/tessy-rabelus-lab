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
  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" strokeDasharray="2 2" className="animate-[spin_20s_linear_infinite]" />
      <path d="M25 25 H75 V35 H55 V80 H45 V35 H25 Z" fill="url(#logoGrad)" />
      <circle cx="50" cy="15" r="3" fill="#84cc16" className="animate-pulse" />
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

  const [activeSideTab, setActiveSideTab] = useState<'library' | 'history'>('history');
  const [isHistoryMobileOpen, setIsHistoryMobileOpen] = useState(false);
  const [isLibraryMobileOpen, setIsLibraryMobileOpen] = useState(false);
  const [isFactorsMobileOpen, setIsFactorsMobileOpen] = useState(false);
  
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

  useEffect(() => {
    const removed = cleanOldConversations();
    if (removed > 0) {
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
    setIsHistoryMobileOpen(false);
    setIsLibraryMobileOpen(false);
    setIsFactorsMobileOpen(false);
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
      if (!allowedTypes.includes(file.type)) return;
      if (file.size > maxSize) return;
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
    setIsLibraryMobileOpen(false);
  }, []);

  const handleLoadConversationFromHistory = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setResult('');
    setInputText('');
    setAttachedFiles([]);
    setStatusMessage('PRONTO');
    setIsHistoryMobileOpen(false);
    localStorage.setItem('tessy_last_conv_id', conversation.id);
  }, []);

  const handleDeleteConversationFromHistory = useCallback((id: string) => {
    if (currentConversation.id === id) handleNewConversation();
    setHistoryRefreshKey(p => p + 1);
  }, [currentConversation.id, handleNewConversation]);

  const handleSaveToRepository = useCallback((title: string, description: string, tags: string[]) => {
    const lastTurn = currentConversation.turns[currentConversation.turns.length - 1];
    const newPrompt = {
      title, description,
      content: lastTurn?.tessyResponse || result,
      factors: [...factors],
      tags: tags
    };
    addDoc('prompts', newPrompt);
    setRefreshKey(prev => prev + 1);
  }, [currentConversation.turns, result, factors]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-emerald-600/30">
      <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 border-b-2 border-emerald-600/25 bg-white/85 dark:bg-slate-900/60 backdrop-blur-2xl z-40 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            onClick={() => setIsHistoryMobileOpen(true)}
            className="md:hidden brutalist-button w-10 h-10 bg-emerald-600/10 text-emerald-600 border-emerald-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <TessyLogo />
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-none text-slate-800 dark:text-white uppercase glow-text-green">
              tessy <span className="hidden xs:inline text-emerald-600 dark:text-emerald-400 font-light italic text-xs sm:text-lg lowercase">by rabelus lab</span>
            </h1>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-600 dark:text-slate-400 tracking-[0.2em] uppercase mt-0.5 line-clamp-1 max-w-[120px] sm:max-w-none">
              {currentConversation.title}
            </span>
          </div>
        </div>

        <div className="hidden lg:block">
          <DateAnchor groundingEnabled={factors.find(f => f.id === 'grounding')?.enabled || false} />
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-6">
          <button 
            onClick={() => setIsFactorsMobileOpen(true)}
            className="md:hidden brutalist-button w-10 h-10 bg-teal-600/10 text-teal-600 border-teal-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
          
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center brutalist-button bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-600/25 active:scale-90">
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
          
          <div className="w-9 h-9 sm:w-11 sm:h-11 border-2 border-emerald-600/25 p-0.5 shadow-[4px_4px_0_rgba(16,185,129,0.15)] bg-white/85 dark:bg-slate-950/40 shrink-0">
            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=tessy-green&backgroundColor=10b981`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile History Drawer */}
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${isHistoryMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsHistoryMobileOpen(false)}></div>
          <div className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ${isHistoryMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <HistorySidebar 
              activeId={currentConversation.id} 
              onLoad={handleLoadConversationFromHistory}
              onDelete={handleDeleteConversationFromHistory}
              refreshKey={historyRefreshKey}
              onClose={() => setIsHistoryMobileOpen(false)}
            />
          </div>
        </div>

        {/* Desktop Sidebars Wrapper */}
        <aside className="hidden md:flex flex-col w-[20%] lg:w-[18%] border-r-2 border-emerald-600/15 glass-panel !border-t-0 !border-b-0">
          <div className="flex border-b-2 border-emerald-600/15 shrink-0">
            <button onClick={() => setActiveSideTab('history')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSideTab === 'history' ? 'bg-emerald-600/10 text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}>Histórico</button>
            <button onClick={() => setActiveSideTab('library')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSideTab === 'library' ? 'bg-emerald-600/10 text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}>Biblioteca</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              {activeSideTab === 'library' ? (
                <RepositoryBrowser onSelectItem={handleSelectItem} refreshKey={refreshKey} />
              ) : (
                <HistorySidebar activeId={currentConversation.id} onLoad={handleLoadConversationFromHistory} onDelete={handleDeleteConversationFromHistory} refreshKey={historyRefreshKey} />
              )}
            </Suspense>
          </div>
        </aside>

        {/* Main Section */}
        <section className="flex-1 flex flex-col min-w-0">
          <Canvas 
            result={result} isLoading={isLoading} isOptimizing={isOptimizing}
            onSavePrompt={handleSaveToRepository} onOptimize={handleOptimize}
            attachedFiles={attachedFiles} onRemoveFile={handleRemoveFile}
            conversationHistory={currentConversation.turns}
            onNewConversation={handleNewConversation}
            inputText={inputText} setInputText={setInputText}
            fileInputRef={fileInputRef} textInputRef={textInputRef}
            handleFileUpload={handleFileUpload} handleInterpret={handleInterpret}
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

        {/* Mobile Factors Drawer */}
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${isFactorsMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsFactorsMobileOpen(false)}></div>
          <div className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ${isFactorsMobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
             <div className="h-full flex flex-col">
                <div className="p-4 border-b border-emerald-600/20 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest">Controles</span>
                  <button onClick={() => setIsFactorsMobileOpen(false)} className="p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex-1 overflow-hidden">
                   <FactorPanel factors={factors} onToggle={handleToggleFactor} />
                </div>
             </div>
          </div>
        </div>

        {/* Desktop Factors Panel */}
        <aside className="hidden md:block w-[25%] lg:w-[22%] border-l-2 border-emerald-600/15 glass-panel !border-t-0 !border-b-0">
          <FactorPanel factors={factors} onToggle={handleToggleFactor} />
        </aside>
      </main>

      <footer className="h-8 sm:h-10 border-t-2 border-emerald-600/25 bg-white/85 dark:bg-slate-900/80 px-4 sm:px-8 flex items-center justify-between text-[8px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-black tracking-[0.2em] shrink-0 z-40">
        <div className="flex items-center space-x-2 sm:space-x-6">
          <span className="hidden xs:inline">© 2024 RABELUS LAB</span>
          <span className="flex items-center space-x-2">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}></span>
            <span className="uppercase text-slate-800 dark:text-white truncate">MOTOR: {statusMessage}</span>
          </span>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-8">
          <span className="hidden sm:inline">PULSE PROTOCOL v2.8.0</span>
          <span className="text-emerald-600 dark:text-emerald-400">STATUS: SEGURO</span>
        </div>
      </footer>

      <Suspense fallback={null}>
        {isOptModalOpen && optimizationResult && (
          <OptimizationModal isOpen={isOptModalOpen} result={optimizationResult} onClose={() => setIsOptModalOpen(false)} onApply={handleApplyOptimization} />
        )}
      </Suspense>
    </div>
  );
};

export default App;