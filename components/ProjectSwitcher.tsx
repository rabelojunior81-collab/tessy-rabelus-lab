import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Project } from '../types';

interface ProjectSwitcherProps {
  currentProjectId: string;
  onSwitch: (id: string) => void;
  onOpenModal: () => void;
  onEditProject: (id: string) => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ currentProjectId, onSwitch, onOpenModal, onEditProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const all = await db.projects.toArray();
      const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
      setProjects(sorted);
      
      const current = sorted.find(p => p.id === currentProjectId);
      setCurrentProject(current || null);
    };
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, [currentProjectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onEditProject(id);
    setIsOpen(false);
  };

  const handleCreate = () => {
    onOpenModal();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 dark:bg-slate-900/60 border-2 lg:border border-emerald-600/30 hover:border-emerald-600 transition-all duration-300 shadow-[4px_4px_0_rgba(16,185,129,0.1)] lg:shadow-[6px_6px_0_rgba(16,185,129,0.2)] hover:lg:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] sm:text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest max-w-[80px] sm:max-w-[150px] truncate">
          {currentProject?.name || 'Selecionar Projeto'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 lg:border border-emerald-600 shadow-2xl lg:shadow-[10px_10px_0_rgba(0,0,0,0.5)] z-50 animate-fade-in transition-all">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-[8px] font-black uppercase text-slate-400 italic">Nenhum projeto</div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => { onSwitch(project.id); setIsOpen(false); }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-emerald-600/10 group ${
                    project.id === currentProjectId ? 'bg-emerald-600/15' : 'hover:bg-emerald-600/5'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: project.color || '#10b981', boxShadow: project.id === currentProjectId ? '0 0 8px currentColor' : 'none' }} />
                    <span className={`text-[10px] font-black uppercase tracking-wider truncate transition-colors ${
                      project.id === currentProjectId ? 'text-emerald-600 glow-text-green' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {project.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleEdit(e, project.id)}
                    className="p-2 ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all rounded-none cursor-pointer active:scale-90 shrink-0 z-10"
                    title="Editar Projeto"
                    aria-label="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-4 px-4 flex items-center justify-center gap-2 bg-emerald-600/10 text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600/20 transition-all border-t-2 lg:border-t border-emerald-600 cursor-pointer active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Criar Protocolo
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;