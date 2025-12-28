import React from 'react';
import { Factor } from '../types';

interface FactorPanelProps {
  factors: Factor[];
  onToggle: (id: string, value?: any) => void;
}

const FactorPanel: React.FC<FactorPanelProps> = ({ factors, onToggle }) => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar bg-transparent">
      <h2 className="text-xl font-black mb-8 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b-2 border-emerald-500/20 pb-4">
        Controladores
      </h2>
      <div className="space-y-6">
        {factors.map((factor) => {
          if (factor.type === 'toggle') {
            return (
              <div key={factor.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{factor.label}</span>
                <button
                  onClick={() => onToggle(factor.id)}
                  className={`w-14 h-7 border-2 transition-all flex items-center px-1 ${
                    factor.enabled ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  } !rounded-none shadow-inner`}
                >
                  <div className={`w-4 h-4 bg-white transition-transform ${factor.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          } else if (factor.type === 'slider') {
            return (
              <div key={factor.id} className="p-5 bg-white/40 dark:bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                  {factor.label}
                </label>
                <input
                  type="range" min={factor.min || 1} max={factor.max || 5} value={factor.value ?? 3}
                  onChange={(e) => onToggle(factor.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-300 dark:bg-slate-700 appearance-none cursor-pointer accent-emerald-500"
                  style={{ borderRadius: 0 }}
                />
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mt-4 tracking-tighter">
                  <span>Conciso</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">LVL {factor.value ?? 3}</span>
                  <span>Detalhado</span>
                </div>
              </div>
            );
          } else if (factor.type === 'dropdown') {
            return (
              <div key={factor.id} className="p-5 bg-white/40 dark:bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">
                  {factor.label}
                </label>
                <select
                  value={factor.value ?? (factor.options?.[0] || 'intermediario')}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  className="w-full bg-white/60 dark:bg-slate-800 border-2 border-emerald-500/10 p-3 text-xs font-bold text-slate-800 dark:text-white uppercase focus:outline-none focus:border-emerald-500 transition-all !rounded-none"
                >
                  {factor.options?.map((opt) => (
                    <option key={opt} value={opt} className="dark:bg-slate-800">{opt.toUpperCase()}</option>
                  )) || (
                    <>
                      <option value="iniciante" className="dark:bg-slate-800">INICIANTE</option>
                      <option value="intermediario" className="dark:bg-slate-800">INTERMEDIÁRIO</option>
                      <option value="avancado" className="dark:bg-slate-800">AVANÇADO</option>
                      <option value="especialista" className="dark:bg-slate-800">ESPECIALISTA</option>
                    </>
                  )}
                </select>
              </div>
            );
          } else if (factor.type === 'text') {
            return (
              <div key={factor.id} className="p-5 bg-white/40 dark:bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">
                  {factor.label}
                </label>
                <textarea
                  value={factor.value ?? ''}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  placeholder="EX: PROTOCOLO NODE.JS..."
                  className="w-full bg-white/60 dark:bg-slate-800 border-2 border-emerald-500/10 p-4 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 resize-none transition-all !rounded-none h-32 custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-emerald-900/30"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
      
      <div className="mt-auto p-6 bg-emerald-500/5 dark:bg-emerald-900/20 border-2 border-emerald-500/30 shadow-[6px_6px_0_rgba(0,0,0,0.05)] dark:shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
           <span className="w-1.5 h-3 bg-emerald-400"></span> Dica do Sistema
        </h4>
        <p className="text-[11px] text-slate-700 dark:text-emerald-100/70 leading-relaxed font-medium">
          Modo Profissional impõe clareza semântica rigorosa. Controle de profundidade ajusta densidade de tokens.
        </p>
      </div>
    </div>
  );
};

export default FactorPanel;