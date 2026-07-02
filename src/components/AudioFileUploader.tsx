// src/components/AudioFileUploader.tsx
// Drag-and-drop audio file uploader for file-based visualization

import { useState, useRef, useCallback } from 'react';

interface Props {
  onFileLoaded: (buffer: ArrayBuffer) => void;
}

export function AudioFileUploader({ onFileLoaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) return;
    setFileName(file.name);
    file.arrayBuffer().then(onFileLoaded);
  }, [onFileLoaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Audio File
      </label>
      <button
        id="audio-file-upload"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed
          transition-all duration-200 text-center cursor-pointer
          ${isDragging
            ? 'border-violet-400 bg-violet-500/20'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8'
          }
        `}
      >
        <span className="text-xl">🎵</span>
        {fileName ? (
          <span className="text-xs text-white/70 truncate max-w-[150px]">{fileName}</span>
        ) : (
          <span className="text-xs text-white/40">Drop audio or click</span>
        )}
        <span className="text-[10px] text-white/30">MP3 · WAV · OGG</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onInputChange}
        className="hidden"
        aria-label="Upload audio file"
      />
    </div>
  );
}
