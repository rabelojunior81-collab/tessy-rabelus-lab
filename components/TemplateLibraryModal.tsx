
import React from 'react';
import { PROMPT_TEMPLATES } from '../constants/templates';
import { Template } from '../types';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel !rounded-none w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200 !bg-slate-900/60 !backdrop-blur-2xl !border-emerald-500/40">
        <div className="px-8 py-6 border-b-2 border-emerald-500/20 flex justify-between items-center bg-slate-900/40">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter glow-text-green">Biblioteca de Templates</h3>
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">Protocolos Pré-configurados Rabelus Lab</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/20">
          <div className="space-y-10">
            {categories.map(category => (
              <div key={category}>
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                  <div className="h-0.5 w-8 bg-emerald-500/50"></div>
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROMPT_TEMPLATES.filter(t => t.category === category).map(template => (
                    <div 
                      key={template.id}
                      className="group relative p-6 bg-slate-900/60 border-2 border-emerald-500/10 hover:border-emerald-500/50 transition-all shadow-[6px_6px_0_rgba(0,0,0,0.3)] cursor-pointer"
                      onClick={() => onSelect(template)}
                    >
                      <h5 className="text-sm font-black text-white uppercase mb-3 group-hover:text-emerald-400 transition-colors tracking-wider">
                        {template.label}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic font-medium">
                        {template.content}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Carregar Protocolo →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t-2 border-emerald-500/20 bg-slate-900/40 flex justify-end">
          <button onClick={onClose} className="brutalist-button px-8 py-3 bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs">
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibraryModal;
