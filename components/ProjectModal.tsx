
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
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do projeto é obrigatório.');
      return;
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
      onClose();
    } catch (err) {
      console.error("Failed to save project:", err);
      setError('Ocorreu um erro ao salvar o projeto.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel !rounded-none w-full max-w-lg animate-zoom-in !bg-white dark:!bg-slate-900 shadow-2xl overflow-hidden border-2 border-emerald-500/30">
        <div className="px-6 py-4 border-b-2 border-emerald-500/20 flex justify-between items-center bg-emerald-500/5 dark:bg-slate-950/40">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
            {projectId ? 'Editar Projeto' : 'Novo Projeto'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border-2 border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Nome do Projeto</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do projeto..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/20 p-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition-all !rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o objetivo deste projeto..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/20 p-3 text-slate-900 dark:text-white font-medium h-24 resize-none focus:outline-none focus:border-emerald-500 transition-all !rounded-none custom-scrollbar"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Repositório GitHub (Opcional)</label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="usuario/repositorio ou URL completa"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/20 p-3 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all !rounded-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Cor de Destaque</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 bg-transparent border-2 border-emerald-500/20 cursor-pointer p-1"
              />
              <span className="text-xs font-mono font-bold text-slate-500">{color.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="brutalist-button flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="brutalist-button flex-1 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-700"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
