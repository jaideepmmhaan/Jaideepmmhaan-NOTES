import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note, Theme } from '../types';
import { AUTHOR_HANDLE, THEMES } from '../constants';
import { getFirstImage, getPreviewText, formatDate } from '../utils';
import { Plus, Search, Eye, EyeOff, Trash2, Pin } from 'lucide-react';

interface HomeProps {
  notes: Note[];
  onCreateNote: () => void;
  onSelectNote: (note: Note) => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  onToggleHideNote: (note: Note) => void;
  onTogglePinNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
    notes, 
    onCreateNote, 
    onSelectNote, 
    currentTheme, 
    onSetTheme, 
    onToggleHideNote,
    onTogglePinNote,
    onDeleteNote
}) => {
  const themeColors = THEMES[currentTheme];
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter and Sort
  const filteredNotes = notes.filter(n => {
      // 1. Visibility Check
      const matchesVisibility = showHidden ? n.isHidden : !n.isHidden;
      
      // 2. Search Check
      let matchesSearch = true;
      if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const titleMatch = n.title.toLowerCase().includes(query);
          const contentMatch = n.blocks.some(b => 
              b.type === 'text' && b.content.toLowerCase().includes(query)
          );
          matchesSearch = titleMatch || contentMatch;
      }

      return matchesVisibility && matchesSearch;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
      // 1. Pinned first
      if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
      }
      // 2. Then by date
      return b.updatedAt - a.updatedAt;
  });

  return (
    <div className={`min-h-screen ${themeColors.bg} transition-colors duration-700`}>
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-20 bg-opacity-90 backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="flex flex-col items-start gap-2 mb-1">
             <span className={`text-xs uppercase tracking-widest opacity-60 ${themeColors.text}`}>
               Follow {AUTHOR_HANDLE}
             </span>
             {/* Theme Selector */}
             <div className="flex gap-2">
                <button 
                  onClick={() => onSetTheme('dark')} 
                  className={`w-3 h-3 rounded-full bg-neutral-800 border border-neutral-600 transition-all ${currentTheme === 'dark' ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`} 
                  title="Dark Mode"
                />
                <button 
                  onClick={() => onSetTheme('pink')} 
                  className={`w-3 h-3 rounded-full bg-[#e11d48] border border-pink-900 transition-all ${currentTheme === 'pink' ? 'ring-2 ring-pink-400 scale-110' : 'hover:scale-110'}`} 
                  title="Hot Pink Mode"
                />
                <button 
                  onClick={() => onSetTheme('royal')} 
                  className={`w-3 h-3 rounded-full bg-[#1e40af] border border-blue-900 transition-all ${currentTheme === 'royal' ? 'ring-2 ring-amber-400 scale-110' : 'hover:scale-110'}`} 
                  title="Royale Blue Mode"
                />
             </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className={`text-3xl font-bold tracking-tight ${themeColors.text}`}>
              {showHidden ? 'HIDDEN FRAMES' : 'FRAME NOTES'}
            </h1>
            <button 
                onClick={() => setShowHidden(!showHidden)}
                className={`opacity-40 hover:opacity-100 transition-opacity ${themeColors.text}`}
                title={showHidden ? "Show All" : "Show Hidden"}
            >
                {showHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        {!showHidden && (
            <button 
              onClick={onCreateNote}
              className={`w-12 h-12 rounded-full border ${themeColors.border} ${themeColors.surface} flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg group`}
            >
              <Plus size={24} className={`${themeColors.text} group-hover:${themeColors.accent.replace('text-', '')}`} />
            </button>
        )}
      </header>

      {/* Search Input */}
      <div className="px-6 mb-8">
        <div className={`relative w-full overflow-hidden rounded-xl bg-white/5 border border-white/5 flex items-center px-4 py-3 focus-within:bg-white/10 transition-colors`}>
           <Search size={18} className="text-white/30 mr-3" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder={showHidden ? "Search hidden..." : "Search frames..."} 
             className="bg-transparent outline-none w-full text-sm text-white/80 placeholder-white/30 font-light"
           />
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedNotes.map(note => (
            <NoteCard 
                key={note.id} 
                note={note} 
                onSelect={onSelectNote} 
                onToggleHide={onToggleHideNote}
                onTogglePin={onTogglePinNote}
                onDelete={onDeleteNote}
                themeColors={themeColors}
            />
        ))}

        {/* Placeholder if empty */}
        {sortedNotes.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
             <div className="w-16 h-20 border-2 border-dashed border-white/20 rounded-lg mb-4"></div>
             <p className="text-xs tracking-widest uppercase">
                 {searchQuery ? "No Matches" : (showHidden ? "No Hidden Frames" : "No Frames Yet")}
             </p>
           </div>
        )}
      </div>
    </div>
  );
};

interface NoteCardProps {
    note: Note;
    onSelect: (note: Note) => void;
    onToggleHide: (note: Note) => void;
    onTogglePin: (note: Note) => void;
    onDelete: (id: string) => void;
    themeColors: any;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onSelect, onToggleHide, onTogglePin, onDelete, themeColors }) => {
    const coverImage = getFirstImage(note.blocks);
    const previewText = getPreviewText(note.blocks);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPressing, setIsPressing] = useState(false);

    const startPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        setIsPressing(true);
        timerRef.current = setTimeout(() => {
            setIsPressing(false);
            if (navigator.vibrate) navigator.vibrate(50);
            onToggleHide(note);
        }, 600); 
    }, [note, onToggleHide]);

    const endPress = useCallback(() => {
        setIsPressing(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return (
        <div 
          className="group relative flex flex-col cursor-pointer touch-manipulation"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onClick={() => {
             // Basic click handler (long press is handled by timer)
             if (!isPressing && !timerRef.current) {
                 // Already cleared or invalid
             }
             // Just select
             onSelect(note);
          }}
        >
          {/* Card Aspect Ratio Container */}
          <div className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden ${themeColors.surface} shadow-lg border ${themeColors.border} transition-transform duration-300 ${isPressing ? 'scale-95 opacity-80' : 'group-hover:scale-[1.02]'}`}>
            
            {coverImage ? (
              <div className="absolute inset-0">
                {coverImage.startsWith('data:video') ? (
                   <video src={coverImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                ) : (
                   <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                <span className="text-white/10 text-4xl font-serif italic">Tx</span>
              </div>
            )}
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <h3 className={`text-white font-medium text-sm line-clamp-1 mb-1 ${!coverImage ? themeColors.text : ''}`}>
                {note.title}
              </h3>
              <p className="text-xs text-white/60 line-clamp-2 font-light leading-snug">
                {previewText}
              </p>
              <p className="text-[10px] text-white/40 mt-2 uppercase tracking-wider">
                {formatDate(note.updatedAt)}
              </p>
            </div>

            {/* Top Right Actions */}
            <div className="absolute top-2 right-2 flex gap-2">
                 {/* Pin Button */}
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note);
                    }}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                        note.isPinned 
                        ? `bg-white/10 ${themeColors.accent} opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.2)]` 
                        : 'bg-black/40 text-white/50 opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                    title={note.isPinned ? "Unpin" : "Pin"}
                 >
                     <Pin size={12} fill={note.isPinned ? "currentColor" : "none"} />
                 </button>

                 {/* Hidden Indicator */}
                {note.isHidden && (
                     <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-full">
                         <EyeOff size={12} className="text-white/50" />
                     </div>
                )}
            </div>

            {/* Delete Button (visible on hover or if no cover image) */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                }}
                className={`absolute top-2 left-2 p-1.5 rounded-full bg-black/40 hover:bg-red-500/80 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100`}
                title="Delete Frame"
            >
                <Trash2 size={12} className="text-white" />
            </button>
          </div>
        </div>
    );
};

export default Home;