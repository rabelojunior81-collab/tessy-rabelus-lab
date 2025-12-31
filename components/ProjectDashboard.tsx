
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { db } from '../services/dbService';
import { Project } from '../types';

const GitHubPanel = lazy(() => import('./GitHubPanel'));

interface ProjectDashboardProps {
  projectId: string;
  onNewConversation: () => void;
  onOpenLibrary: () => void;
  onRefreshHistory: () => void;
  onEditProject: (id: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
  projectId, 
  onNewConversation, 
  onOpenLibrary,
  onRefreshHistory,
  onEditProject
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState({ conversations: 0, library: 0, templates: 0 });

  const loadData = async () => {
    const p = await db.projects.get(projectId);
    if (p) {
      setProject(p);
      const convCount = await db.conversations.where('projectId').equals(projectId).count();
      const libCount = await db.library.where('projectId').equals(projectId).count();
      const tempCount = await db.templates.count(); // Global for now
      setStats({ conversations: convCount, library: libCount, templates: tempCount });
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (!project) return (
    <div className="p-8 text-center text-[10px] font-black uppercase text-slate-500 animate-pulse">
      Sincronizando...
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar animate-fade-in bg-transparent transition-all duration-300">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white/60 dark:bg-slate-900/40 border-2 border-emerald-600/20 shadow-[6px_6px_0_rgba(16,185,129,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 opacity-5 sm:opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[spin_20s_linear_infinite]">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" className="text-emerald-600" />
          </svg>
        </div>
        
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="px-1.5 py-0.5 text-[7px] sm:text-[8px] font-black text-white uppercase tracking-tighter flex items-center gap-1" style={{ backgroundColor: project.color || '#10b981' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Protocolo Ativo
          </div>
          <button 
            onClick={() => onEditProject(projectId)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all cursor-pointer active:scale-90 z-10"
            aria-label="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        <h2 
          className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 leading-none group-hover:text-emerald-600 transition-colors cursor-pointer truncate"
          onClick={() => onEditProject(projectId)}
        >
          {project.name}
        </h2>
        <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4 italic line-clamp-2 sm:line-clamp-3">
          {project.description || 'Sem descrição.'}
        </p>
        
        {project.githubRepo && (
          <a 
            href={project.githubRepo.startsWith('http') ? project.githubRepo : `https://github.com/${project.githubRepo}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[8px] sm:text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:text-emerald-500 transition-all active:scale-95 truncate max-w-full"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GIT: {project.githubRepo.split('/').pop()}
          </a>
        )}
      </div>

      {/* GitHub Integration Section */}
      {project.githubRepo && (
        <div className="mb-6 sm:mb-8">
          <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 border-b border-slate-500/10 pb-2 flex items-center gap-2">
            Integração GitHub
          </h4>
          <Suspense fallback={<div className="h-32 border-2 border-dashed border-emerald-600/10 animate-pulse"></div>}>
            <GitHubPanel repoPath={project.githubRepo} />
          </Suspense>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-3 sm:p-4 bg-white/40 dark:bg-slate-900/20 border-2 border-emerald-600/10 flex flex-col items-start hover:border-emerald-600/40 transition-all">
          <span className="text-[18px] sm:text-[20px] font-black text-emerald-600 leading-none">{stats.conversations}</span>
          <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Sessões</span>
        </div>
        <div className="p-3 sm:p-4 bg-white/40 dark:bg-slate-900/20 border-2 border-emerald-600/10 flex flex-col items-start hover:border-emerald-600/40 transition-all">
          <span className="text-[18px] sm:text-[20px] font-black text-emerald-600 leading-none">{stats.library}</span>
          <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Prompt base</span>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="mb-6 sm:mb-8">
        <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 border-b border-slate-500/10 pb-2">Atalhos</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onRefreshHistory}
            className="flex items-center justify-center gap-2 py-3 px-2 bg-white/50 dark:bg-slate-800/40 border border-emerald-600/10 hover:border-emerald-600/40 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-emerald-500/80 transition-all brutalist-button active:scale-95"
          >
            Sessões
          </button>
          <button 
            onClick={onOpenLibrary}
            className="flex items-center justify-center gap-2 py-3 px-2 bg-white/50 dark:bg-slate-800/40 border border-emerald-600/10 hover:border-emerald-600/40 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-emerald-500/80 transition-all brutalist-button active:scale-95"
          >
            Biblioteca
          </button>
        </div>
      </div>

      {/* Ações do Core */}
      <div className="space-y-3 sm:space-y-4">
        <button 
          onClick={onNewConversation}
          className="w-full brutalist-button py-4 sm:py-5 bg-emerald-600 text-white font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer shadow-[4px_4px_0_rgba(16,185,129,0.2)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Novo Protocolo
        </button>
        <button 
          onClick={onOpenLibrary}
          className="w-full brutalist-button py-4 sm:py-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 border-emerald-600/20 hover:bg-emerald-500/5 active:scale-95 transition-all cursor-pointer"
        >
          Biblioteca Geral
        </button>
      </div>
    </div>
  );
};

export default ProjectDashboard;
