import React, { useState } from 'react';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

const SavePromptModal: React.FC<SavePromptModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, description);
    setTitle(''); setDescription(''); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel !rounded-none w-full max-w-md animate-in zoom-in duration-200">
        <div className="px-8 py-6 border-b-2 border-white/10 flex justify-between items-center bg-slate-900/40">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Protocolo de Arquivamento</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-900/20">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Título do Protocolo</label>
            <input autoFocus type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contrato V1.0..." className="w-full bg-slate-900/60 border-2 border-white/10 p-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-all !rounded-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Resumo de Metadados</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição da sequência lógica..." className="w-full bg-slate-900/60 border-2 border-white/10 p-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-all h-32 resize-none !rounded-none custom-scrollbar" />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="brutalist-button flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs">Abortar</button>
            <button type="submit" className="brutalist-button flex-1 py-4 bg-cyan-500 text-white font-black uppercase tracking-widest text-xs">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavePromptModal;