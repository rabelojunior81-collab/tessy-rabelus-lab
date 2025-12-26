
import React from 'react';
import { AttachedFile } from '../types';

interface FilePreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300">
      <div className="w-full text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
         </svg>
         Arquivos Anexados ({files.length}):
      </div>
      {files.map((file) => (
        <div key={file.id} className="relative flex items-center gap-2 p-1.5 bg-slate-800/80 border border-slate-700 rounded-lg group hover:border-indigo-500/50 transition-all">
          {file.mimeType.startsWith('image/') ? (
            <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} className="w-7 h-7 rounded object-cover border border-slate-700" />
          ) : (
            <div className="w-7 h-7 bg-red-900/20 flex items-center justify-center rounded border border-red-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex flex-col min-w-0 max-w-[100px]">
            <span className="text-[9px] text-slate-300 font-semibold truncate leading-tight">{file.name}</span>
            <span className="text-[7px] text-slate-500 uppercase">{(file.size / 1024).toFixed(0)} KB</span>
          </div>
          <button 
            onClick={() => onRemove(file.id)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg border border-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
