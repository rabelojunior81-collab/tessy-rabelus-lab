import React from 'react';
import { Factor } from '../types';

interface FactorPanelProps {
  factors: Factor[];
  onToggle: (id: string, value?: any) => void;
}

const FactorPanel: React.FC<FactorPanelProps> = ({ factors, onToggle }) => {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar bg-transparent">
      <h2 className="text-xl font-black mb-8 text-emerald-400 uppercase tracking-widest border-b-2 border-emerald-500/20 pb-4">
        Controladores
      </h2>
      <div className="space-y-6">
        {factors.map((factor) => {
          if (factor.type === 'toggle') {
            return (
              <div key={factor.id} className="flex items-center justify-between p-4 bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <span className="text-xs font-black text-white uppercase tracking-wider">{factor.label}</span>
                <button
                  onClick={() => onToggle(factor.id)}
                  className={`w-14 h-7 border-2 transition-all flex items-center px-1 ${
                    factor.enabled ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-800 border-slate-600'
                  } !rounded-none shadow-inner`}
                >
                  <div className={`w-4 h-4 bg-white transition-transform ${factor.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          } else if (factor.type === 'slider') {
            return (
              <div key={factor.id} className="p-5 bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-4">
                  {factor.label}
                </label>
                <input
                  type="range" min={factor.min || 1} max={factor.max || 5} value={factor.value ?? 3}
                  onChange={(e) => onToggle(factor.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-700 appearance-none cursor-pointer accent-emerald-500"
                  style={{ borderRadius: 0 }}
                />
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mt-4 tracking-tighter">
                  <span>Conciso</span>
                  <span className="text-emerald-400 text-sm">LVL {factor.value ?? 3}</span>
                  <span>Detalhado</span>
                </div>
              </div>
            );
          } else if (factor.type === 'dropdown') {
            return (
              <div key={factor.id} className="p-5 bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-3">
                  {factor.label}
                </label>
                <select
                  value={factor.value ?? (factor.options?.[0] || 'intermediario')}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  className="w-full bg-slate-800 border-2 border-emerald-500/10 p-3 text-xs font-bold text-white uppercase focus:outline-none focus:border-emerald-500 transition-all !rounded-none"
                >
                  {factor.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                  )) || (
                    <>
                      <option value="iniciante">INICIANTE</option>
                      <option value="intermediario">INTERMEDIÁRIO</option>
                      <option value="avancado">AVANÇADO</option>
                      <option value="especialista">ESPECIALISTA</option>
                    </>
                  )}
                </select>
              </div>
            );
          } else if (factor.type === 'text') {
            return (
              <div key={factor.id} className="p-5 bg-slate-900/40 border-2 border-emerald-500/10 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-3">
                  {factor.label}
                </label>
                <textarea
                  value={factor.value ?? ''}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  placeholder="EX: PROTOCOLO NODE.JS..."
                  className="w-full bg-slate-800 border-2 border-emerald-500/10 p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 resize-none transition-all !rounded-none h-32 custom-scrollbar"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
      
      <div className="mt-auto p-6 bg-emerald-900/20 border-2 border-emerald-500/30 shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
           <span className="w-1.5 h-3 bg-emerald-400"></span> Dica do Sistema
        </h4>
        <p className="text-[11px] text-emerald-100/70 leading-relaxed font-medium">
          Modo Profissional impõe clareza semântica rigorosa. Controle de profundidade ajusta densidade de tokens.
        </p>
      </div>
    </div>
  );
};

export default FactorPanel;