import React, { useState, useRef, useEffect } from 'react';
import { Note, Block, BlockType, Theme } from '../types';
import { BlockRender } from './BlockRender';
import { generateId } from '../utils';
import { ArrowLeft, Image as ImageIcon, Video, Type, Share, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import { AUTHOR_HANDLE, THEMES } from '../constants';

interface EditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onBack: () => void;
  onDeleteNote: (id: string) => void;
  currentTheme: Theme;
}

const Editor: React.FC<EditorProps> = ({ note, onSave, onBack, onDeleteNote, currentTheme }) => {
  // If creating new note, start with empty state
  const [blocks, setBlocks] = useState<Block[]>(note?.blocks || []);
  const [title, setTitle] = useState(note?.title || '');
  const [lastEdited, setLastEdited] = useState(note?.updatedAt || Date.now());
  const [isHidden, setIsHidden] = useState(note?.isHidden || false);
  
  // Local Block Undo State
  const [deletedBlock, setDeletedBlock] = useState<{ block: Block, index: number } | null>(null);

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
        isHidden,
        theme: currentTheme, // Use app theme if note theme not set
      };
      
      // Only save if meaningful content exists
      if (updatedNote.blocks.length > 0 || updatedNote.title !== 'Untitled Frame') {
          onSave(updatedNote);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [blocks, title, currentTheme, isHidden, note, onSave]);

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
    const blockIndex = blocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;
    const blockToDelete = blocks[blockIndex];
    
    // Save for undo
    setDeletedBlock({ block: blockToDelete, index: blockIndex });
    
    // Remove
    setBlocks(prev => prev.filter(b => b.id !== id));

    // Clear undo after 4s
    setTimeout(() => {
        setDeletedBlock(curr => curr?.block.id === id ? null : curr);
    }, 4000);
  };

  const restoreBlock = () => {
      if (deletedBlock) {
          setBlocks(prev => {
              const newBlocks = [...prev];
              newBlocks.splice(deletedBlock.index, 0, deletedBlock.block);
              return newBlocks;
          });
          setDeletedBlock(null);
      }
  };

  const toggleHidden = () => {
      setIsHidden(!isHidden);
  };

  const handleShare = async () => {
    const textContent = blocks
        .filter(b => b.type === 'text')
        .map(b => b.content)
        .join('\n\n');
    
    const shareData = {
        title: title,
        text: `FRAME NOTES: ${title}\n\n${textContent}`,
        // url: window.location.href // Optional: share app link
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.text);
            alert("Summary copied to clipboard");
        }
    } catch (err) {
        console.error("Share failed", err);
    }
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
        <div className="flex items-center gap-4">
           {/* Share Button */}
           <button 
              onClick={handleShare}
              className={`${themeColors.text} hover:opacity-70 transition-transform active:scale-95`}
              title="Share Summary"
           >
              <Share size={20} />
           </button>

           {/* Hide/Unhide */}
           <button 
              onClick={toggleHidden}
              className={`${themeColors.text} hover:opacity-70 transition-transform active:scale-95`}
              title={isHidden ? "Unhide Frame" : "Hide Frame"}
           >
             {isHidden ? <EyeOff size={20} className="text-red-400" /> : <Eye size={20} className="opacity-50 hover:opacity-100" />}
           </button>

           {/* Delete Note */}
           {note && (
               <button 
                  onClick={() => onDeleteNote(note.id)}
                  className={`text-red-400/70 hover:text-red-500 transition-colors ml-2`}
                  title="Delete Frame"
               >
                  <Trash2 size={20} />
               </button>
           )}
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
        <div className="flex flex-col gap-4 relative">
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

        {/* Local Block Undo Toast */}
        {deletedBlock && (
             <div className="sticky bottom-4 mx-auto w-max z-10 animate-in fade-in slide-in-from-bottom-2">
                  <button 
                    onClick={restoreBlock}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full shadow-xl text-xs text-white hover:bg-neutral-700 transition-colors"
                  >
                      <span>Item Deleted</span>
                      <span className="text-cyan-400 font-bold ml-2">UNDO</span>
                  </button>
             </div>
        )}

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