
import React from 'react';

interface CanvasProps {
  result: string;
  isLoading: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ result, isLoading }) => {
  return (
    <div className="h-full flex flex-col p-6 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Canvas</h2>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300 relative group">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-indigo-400 font-medium animate-pulse">Consultando Tessy...</p>
            </div>
          </div>
        ) : null}
        
        {!result && !isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            Aguardando entrada de dados para processamento...
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-medium">
        <span>ESTADO: READY</span>
        <span>ENGINE: GEMINI-3-FLASH</span>
        <span>SECURE CONNECTION ACTIVE</span>
      </div>
    </div>
  );
};

export default Canvas;
