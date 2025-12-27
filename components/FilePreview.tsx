import React from 'react';
import { AttachedFile } from '../types';

interface FilePreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="w-full text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
         <div className="w-4 h-0.5 bg-emerald-400"></div>
         Carga de Dados: {files.length} unidades
      </div>
      {files.map((file) => (
        <div key={file.id} className="relative flex items-center gap-3 p-2 bg-slate-900/80 border-2 border-emerald-500/20 shadow-[4px_4px_0_rgba(0,0,0,0.3)] !rounded-none group hover:border-emerald-500/50 transition-all">
          {file.mimeType.startsWith('image/') ? (
            <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} className="w-10 h-10 object-cover border border-emerald-500/10" />
          ) : (
            <div className="w-10 h-10 bg-emerald-900/30 flex items-center justify-center border border-emerald-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
          )}
          <div className="flex flex-col min-w-0 max-w-[120px]">
            <span className="text-[10px] text-white font-black truncate uppercase tracking-wider">{file.name}</span>
            <span className="text-[8px] text-slate-500 font-black uppercase">{(file.size / 1024).toFixed(0)} KB</span>
          </div>
          <button 
            onClick={() => onRemove(file.id)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-lg border-2 border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;