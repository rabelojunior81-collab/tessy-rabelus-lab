
import React from 'react';
import { AttachedFile } from '../types';

interface FilePreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {files.map((file) => (
        <div key={file.id} className="relative flex items-center gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg group animate-in slide-in-from-bottom-2 duration-200">
          {file.mimeType.startsWith('image/') ? (
            <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} className="w-8 h-8 rounded object-cover border border-slate-600" />
          ) : (
            <div className="w-8 h-8 bg-red-900/30 flex items-center justify-center rounded border border-red-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex flex-col min-w-0 max-w-[120px]">
            <span className="text-[10px] text-slate-200 font-medium truncate">{file.name}</span>
            <span className="text-[8px] text-slate-500 uppercase">{(file.size / 1024).toFixed(0)} KB</span>
          </div>
          <button 
            onClick={() => onRemove(file.id)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
