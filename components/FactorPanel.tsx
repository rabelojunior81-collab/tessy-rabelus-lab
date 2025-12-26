
import React from 'react';
import { Factor } from '../types';

interface FactorPanelProps {
  factors: Factor[];
  onToggle: (id: string, value?: any) => void;
}

const FactorPanel: React.FC<FactorPanelProps> = ({ factors, onToggle }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-bold mb-6 text-indigo-400">Painel de Fatores</h2>
      <div className="space-y-4">
        {factors.map((factor) => {
          if (factor.type === 'toggle') {
            return (
              <div key={factor.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-sm font-medium text-slate-300">{factor.label}</span>
                <button
                  onClick={() => onToggle(factor.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    factor.enabled ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      factor.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          } else if (factor.type === 'slider') {
            return (
              <div key={factor.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {factor.label}
                </label>
                <input
                  type="range"
                  min={factor.min || 1}
                  max={factor.max || 5}
                  value={factor.value ?? 3}
                  onChange={(e) => onToggle(factor.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Resumo</span>
                  <span className="text-indigo-400 font-bold">
                    {factor.value ?? 3}
                  </span>
                  <span>Profundo</span>
                </div>
              </div>
            );
          } else if (factor.type === 'dropdown') {
            return (
              <div key={factor.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {factor.label}
                </label>
                <select
                  value={factor.value ?? (factor.options?.[0] || 'intermediario')}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {factor.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  )) || (
                    <>
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                      <option value="especialista">Especialista</option>
                    </>
                  )}
                </select>
              </div>
            );
          } else if (factor.type === 'text') {
            return (
              <div key={factor.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {factor.label}
                </label>
                <textarea
                  value={factor.value ?? ''}
                  onChange={(e) => onToggle(factor.id, e.target.value)}
                  placeholder="Ex: Trabalhando com Node.js 20..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                  rows={3}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
      
      <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
        <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">Dica de Contexto</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ativar o "Tom Profissional" fará com que as respostas do Gemini evitem gírias e foquem em clareza executiva. O nível de detalhe ajusta a verbosidade.
        </p>
      </div>
    </div>
  );
};

export default FactorPanel;
