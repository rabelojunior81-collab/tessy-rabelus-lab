
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-xl font-bold text-white">Engenharia de Prompt Inteligente</h3>
            <p className="text-xs text-slate-400 mt-1">Análise via Gemini 3 Pro AI Engine</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Clareza</span>
              <span className={`text-3xl font-black ${result.clarity_score >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.clarity_score}/10
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Completude</span>
              <span className={`text-3xl font-black ${result.completeness_score >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.completeness_score}/10
              </span>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Sugestões de Melhoria
            </h4>
            <div className="space-y-3">
              {result.suggestions.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 border-l-4 border-amber-500 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mb-1">{s.issue}</p>
                  <p className="text-xs text-slate-400 italic">💡 {s.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimized Prompt */}
          <div>
            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Prompt Otimizado
            </h4>
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl font-mono text-sm text-emerald-100 whitespace-pre-wrap leading-relaxed shadow-inner">
              {result.optimized_prompt}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-semibold"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.optimized_prompt);
            }}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-semibold flex items-center gap-2"
          >
            Copiar
          </button>
          <button
            onClick={() => onApply(result.optimized_prompt)}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-bold shadow-lg shadow-emerald-500/20"
          >
            Aceitar e Re-executar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptimizationModal;
