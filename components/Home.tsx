import React from 'react';
import { Note, Theme } from '../types';
import { AUTHOR_HANDLE, THEMES } from '../constants';
import { getFirstImage, getPreviewText, formatDate } from '../utils';
import { Plus, Search } from 'lucide-react';

interface HomeProps {
  notes: Note[];
  onCreateNote: () => void;
  onSelectNote: (note: Note) => void;
  currentTheme: Theme;
  onThemeToggle: () => void;
}

const Home: React.FC<HomeProps> = ({ notes, onCreateNote, onSelectNote, currentTheme, onThemeToggle }) => {
  const themeColors = THEMES[currentTheme];
  
  // Sort by updated at desc
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={`min-h-screen ${themeColors.bg} transition-colors duration-700`}>
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-20 bg-opacity-90 backdrop-blur-sm">
        <div className="flex flex-col">
          <button onClick={onThemeToggle} className={`text-xs uppercase tracking-widest mb-1 opacity-60 hover:opacity-100 transition-opacity text-left ${themeColors.text}`}>
            Follow {AUTHOR_HANDLE}
          </button>
          <h1 className={`text-3xl font-bold tracking-tight ${themeColors.text}`}>
            FRAME NOTES
          </h1>
        </div>
        <button 
          onClick={onCreateNote}
          className={`w-12 h-12 rounded-full border ${themeColors.border} ${themeColors.surface} flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg group`}
        >
          <Plus size={24} className={`${themeColors.text} group-hover:${themeColors.accent.replace('text-', '')}`} />
        </button>
      </header>

      {/* Search (Visual Only for Vibe) */}
      <div className="px-6 mb-8">
        <div className={`relative w-full overflow-hidden rounded-xl bg-white/5 border border-white/5 flex items-center px-4 py-3 focus-within:bg-white/10 transition-colors`}>
           <Search size={18} className="text-white/30 mr-3" />
           <input 
             type="text" 
             placeholder="Search frames..." 
             className="bg-transparent outline-none w-full text-sm text-white/80 placeholder-white/30 font-light"
           />
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedNotes.map(note => {
          const coverImage = getFirstImage(note.blocks);
          const previewText = getPreviewText(note.blocks);

          return (
            <div 
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="group relative flex flex-col cursor-pointer"
            >
              {/* Card Aspect Ratio Container */}
              <div className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden ${themeColors.surface} shadow-lg border ${themeColors.border} transition-transform duration-300 group-hover:scale-[1.02]`}>
                
                {coverImage ? (
                  <div className="absolute inset-0">
                    {/* If video, simple thumb for now */}
                    {coverImage.startsWith('data:video') ? (
                       <video src={coverImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                    ) : (
                       <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    )}
                    {/* Gradient overlay for text readability */}
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
              </div>
            </div>
          );
        })}

        {/* Placeholder if empty */}
        {sortedNotes.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
             <div className="w-16 h-20 border-2 border-dashed border-white/20 rounded-lg mb-4"></div>
             <p className="text-xs tracking-widest uppercase">No Frames Yet</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Home;
