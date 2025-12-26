
import React from 'react';
import { Factor } from '../types';

interface FactorPanelProps {
  factors: Factor[];
  onToggle: (id: string) => void;
}

const FactorPanel: React.FC<FactorPanelProps> = ({ factors, onToggle }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 p-4">
      <h2 className="text-xl font-bold mb-6 text-indigo-400">Painel de Fatores</h2>
      <div className="space-y-4">
        {factors.map((factor) => (
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
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
        <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">Dica de Contexto</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ativar o "Tom Profissional" fará com que as respostas do Gemini evitem gírias e foquem em clareza executiva.
        </p>
      </div>
    </div>
  );
};

export default FactorPanel;
