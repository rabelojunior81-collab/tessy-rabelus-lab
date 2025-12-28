import React from 'react';
import { OptimizationResult } from '../types';

interface OptimizationModalProps {
  isOpen: boolean;
  result: OptimizationResult | null;
  onClose: () => void;
  onApply: (optimizedPrompt: string) => void;
}

const OptimizationModal: React.FC<OptimizationModalProps> = ({ isOpen, result, onClose, onApply }) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/30 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel !rounded-none w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden !bg-white/95 dark:!bg-slate-900/60 !backdrop-blur-2xl animate-zoom-in [animation-delay:75ms]">
        <div className="px-8 py-6 border-b-2 border-emerald-500/20 flex justify-between items-center bg-emerald-500/5 dark:bg-slate-900/40">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter glow-text-green">Otimização de Lógica</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">Motor de Diagnóstico Gemini Pro</p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-transparent">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-2 border-emerald-500/10 shadow-[6px_6px_0_rgba(0,0,0,0.03)] dark:shadow-[6px_6px_0_rgba(0,0,0,0.3)] flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mb-2">Clareza</span>
              <span className={`text-4xl font-black ${result.clarity_score >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {result.clarity_score.toFixed(1)}/10
              </span>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-2 border-emerald-500/10 shadow-[6px_6px_0_rgba(0,0,0,0.03)] dark:shadow-[6px_6px_0_rgba(0,0,0,0.3)] flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mb-2">Completude</span>
              <span className={`text-4xl font-black ${result.completeness_score >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {result.completeness_score.toFixed(1)}/10
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <div className="w-1 h-4 bg-amber-500"></div> Sugestões do Sistema
            </h4>
            <div className="space-y-4">
              {result.suggestions.map((s, idx) => (
                <div key={idx} className="p-4 bg-amber-500/5 dark:bg-slate-800/40 border-l-4 border-amber-500 shadow-[4px_4px_0_rgba(0,0,0,0.02)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                  <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 inline-block">
                    {s.category}
                  </span>
                  <p className="text-sm text-slate-900 dark:text-white font-bold mb-1">{s.issue}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">Recomendação: {s.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <div className="w-1 h-4 bg-emerald-500"></div> Protocolo Otimizado
            </h4>
            <div className="p-6 bg-slate-100 dark:bg-slate-950 border-2 border-emerald-500/20 text-slate-800 dark:text-emerald-100 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {result.optimized_prompt}
            </div>
          </div>
        </div>

        <div className="p-8 border-t-2 border-emerald-500/20 flex gap-4 bg-emerald-500/5 dark:bg-slate-900/40">
          <button onClick={onClose} className="brutalist-button px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Abortar</button>
          <button onClick={() => navigator.clipboard.writeText(result.optimized_prompt)} className="brutalist-button px-6 py-3 bg-teal-600/10 dark:bg-teal-600/20 text-teal-700 dark:text-teal-400 font-black uppercase tracking-widest text-xs">Copiar Texto</button>
          <button onClick={() => onApply(result.optimized_prompt)} className="brutalist-button flex-1 px-6 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs">Executar Protocolo</button>
        </div>
      </div>
    </div>
  );
};

export default OptimizationModal;