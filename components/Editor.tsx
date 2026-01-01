import React, { useState, useRef, useEffect } from 'react';
import { Note, Block, BlockType, Theme } from '../types';
import { BlockRender } from './BlockRender';
import { generateId } from '../utils';
import { ArrowLeft, Image as ImageIcon, Video, Type, MoreVertical } from 'lucide-react';
import { AUTHOR_HANDLE, THEMES } from '../constants';

interface EditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onBack: () => void;
  currentTheme: Theme;
}

const Editor: React.FC<EditorProps> = ({ note, onSave, onBack, currentTheme }) => {
  // If creating new note, start with empty state
  const [blocks, setBlocks] = useState<Block[]>(note?.blocks || []);
  const [title, setTitle] = useState(note?.title || '');
  const [lastEdited, setLastEdited] = useState(note?.updatedAt || Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const themeColors = THEMES[currentTheme];

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (blocks.length === 0 && !title) return;
      
      const updatedNote: Note = {
        id: note?.id || generateId(),
        title: title || 'Untitled Frame',
        createdAt: note?.createdAt || Date.now(),
        updatedAt: Date.now(),
        blocks,
        isPinned: note?.isPinned || false,
        theme: currentTheme, // Use app theme if note theme not set
      };
      
      // Only save if meaningful content exists
      if (updatedNote.blocks.length > 0 || updatedNote.title !== 'Untitled Frame') {
          onSave(updatedNote);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [blocks, title, currentTheme, note, onSave]);

  const addBlock = (type: BlockType, content: string = '') => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content,
      drawings: []
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        addBlock(type, event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const updateBlockDrawings = (id: string, drawings: any[]) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, drawings } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bg} transition-colors duration-700`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl border-b ${themeColors.border} bg-opacity-80`}>
        <button 
          onClick={onBack}
          className={`${themeColors.text} hover:opacity-70 transition-opacity`}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
           <span className={`text-xs uppercase tracking-widest ${themeColors.textMuted} opacity-50`}>
             {lastEdited ? 'Saved' : 'Editing'}
           </span>
           <button className={`${themeColors.text} hover:opacity-70 ml-2`}>
             <MoreVertical size={20} />
           </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow overflow-y-auto px-6 py-8 pb-32 max-w-2xl mx-auto w-full no-scrollbar">
        {/* Title */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Frame Title"
          className={`w-full bg-transparent text-4xl font-bold mb-8 outline-none placeholder-white/10 ${themeColors.text}`}
        />

        {/* Blocks */}
        <div className="flex flex-col gap-4">
          {blocks.map(block => (
            <BlockRender 
              key={block.id} 
              block={block} 
              isEditing={true}
              onUpdate={updateBlock}
              onUpdateDrawings={updateBlockDrawings}
              onDelete={deleteBlock}
              themeAccent={themeColors.accent}
            />
          ))}
        </div>

        {/* Empty State Prompt */}
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-30 pointer-events-none select-none">
            <p className={`text-sm uppercase tracking-[0.3em] ${themeColors.text}`}>Start Curating</p>
          </div>
        )}
      </main>

      {/* Persistent Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-black/90 to-transparent">
        <div className={`mx-auto max-w-md flex items-center justify-around ${themeColors.surface} border ${themeColors.border} rounded-full px-6 py-4 shadow-2xl backdrop-blur-md`}>
          <button 
            onClick={() => addBlock('text')}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${themeColors.text}`}
          >
            <Type size={24} strokeWidth={1.5} />
          </button>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${themeColors.text}`}
          >
            <ImageIcon size={24} strokeWidth={1.5} />
          </button>
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileUpload} 
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
