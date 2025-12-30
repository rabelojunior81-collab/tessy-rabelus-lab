
import React, { useState, useEffect } from 'react';
import { db, generateUUID } from '../services/dbService';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | null;
  onSuccess: (projectId: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, projectId, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      db.projects.get(projectId).then(project => {
        if (project) {
          setName(project.name);
          setDescription(project.description || '');
          setGithubRepo(project.githubRepo || '');
          setColor(project.color || '#10b981');
        }
      });
    } else if (isOpen) {
      setName('');
      setDescription('');
      setGithubRepo('');
      setColor('#10b981');
    }
    setError('');
    setIsClosing(false);
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('O nome do projeto é obrigatório.');
      return;
    }

    if (githubRepo.trim()) {
      const repoRegex = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/;
      if (!repoRegex.test(githubRepo.trim())) {
        setError('Repositório GitHub deve estar no formato: usuario/repositorio');
        return;
      }
    }

    const id = projectId || generateUUID();
    const now = Date.now();
    
    const projectData: Project = {
      id,
      name: name.trim(),
      description: description.trim(),
      githubRepo: githubRepo.trim(),
      color,
      createdAt: projectId ? (await db.projects.get(projectId))?.createdAt || now : now,
      updatedAt: now
    };

    try {
      await db.projects.put(projectData);
      onSuccess(id);
      handleClose();
    } catch (err) {
      console.error("Failed to save project:", err);
      setError('Ocorreu um erro ao salvar o projeto.');
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      <div 
        className={`glass-panel !rounded-none w-full max-w-[500px] flex flex-col !bg-white dark:!bg-slate-900 shadow-[20px_20px_0_rgba(0,0,0,0.5)] border-4 border-emerald-500 overflow-hidden max-h-[95vh] ${isClosing ? 'animate-zoom-out' : 'animate-zoom-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b-4 border-emerald-500 flex justify-between items-center bg-emerald-500/10 dark:bg-slate-950/60 shrink-0">
          <div className="flex flex-col">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
              {projectId ? 'Editar Protocolo' : 'Novo Protocolo'}
            </h3>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Configuração de Núcleo</span>
          </div>
          <button 
            onClick={handleClose} 
            className="bg-red-600 text-white p-2 hover:bg-red-500 transition-all cursor-pointer active:scale-90 border-2 border-black dark:border-white shadow-[2px_2px_0_rgba(0,0,0,1)]"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest border-2 border-black animate-pulse">
              ALERTA: {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Identificação do Projeto</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NOME DO PROTOCOLO..."
              className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-emerald-500/30 p-4 text-slate-900 dark:text-white font-black focus:outline-none focus:border-emerald-500 transition-all !rounded-none placeholder:text-slate-400 uppercase tracking-widest"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Diretrizes / Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="DESCREVA O OBJETIVO DESTE NÚCLEO..."
              className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-emerald-500/30 p-4 text-slate-900 dark:text-white font-bold h-24 sm:h-32 resize-none focus:outline-none focus:border-emerald-500 transition-all !rounded-none custom-scrollbar placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Repositório Git (usuario/repo)</label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="USUARIO/REPO..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-emerald-500/30 p-4 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all !rounded-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Cor de Identidade</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 border-2 border-slate-300 dark:border-emerald-500/30">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 bg-transparent cursor-pointer border-none p-0 appearance-none"
                />
                <span className="text-[11px] font-mono font-black text-slate-500 dark:text-emerald-500/60 uppercase">{color}</span>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 sm:p-8 border-t-4 border-emerald-500 flex gap-4 bg-emerald-500/5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 font-black uppercase tracking-widest text-xs border-2 border-black dark:border-white shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer active:scale-95"
          >
            Abortar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs border-2 border-black dark:border-white shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer active:scale-95"
          >
            Confirmar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
