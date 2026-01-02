import React, { useState, useEffect } from 'react';
import { Note, Theme } from './types';
import Home from './components/Home';
import Editor from './components/Editor';
import SplashScreen from './components/SplashScreen';
import { THEMES } from './constants';
import { RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<'home' | 'edit'>('home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Undo State
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('frame_notes_data');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    }
    const savedTheme = localStorage.getItem('frame_notes_theme') as Theme;
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  // Save to LocalStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('frame_notes_data', JSON.stringify(notes));
  }, [notes]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('frame_notes_theme', theme);
  }, [theme]);

  const handleCreateNote = () => {
    setActiveNote(null);
    setView('edit');
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setView('edit');
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(prev => {
      const exists = prev.find(n => n.id === updatedNote.id);
      if (exists) {
        return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
      } else {
        return [updatedNote, ...prev];
      }
    });
    // Keep active note updated so UI reflects changes immediately without jumping
    if (activeNote && activeNote.id === updatedNote.id) {
        setActiveNote(updatedNote); 
    }
  };
  
  const handleToggleHideNote = (note: Note) => {
      const updatedNote = { ...note, isHidden: !note.isHidden };
      handleSaveNote(updatedNote);
  };

  const handleTogglePinNote = (note: Note) => {
      const updatedNote = { ...note, isPinned: !note.isPinned };
      handleSaveNote(updatedNote);
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // Set as deleted and remove from main list
    setDeletedNote(noteToDelete);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    
    // If we are editing this note, go back home
    if (activeNote?.id === noteId) {
        setActiveNote(null);
        setView('home');
    }

    // Clear any existing timer
    if (undoTimer) clearTimeout(undoTimer);

    // Set new timer to clear buffer
    const timer = setTimeout(() => {
        setDeletedNote(null);
        setUndoTimer(null);
    }, 5000); // 5 seconds to undo
    setUndoTimer(timer);
  };

  const handleUndoDelete = () => {
      if (deletedNote) {
          setNotes(prev => [deletedNote, ...prev]);
          setDeletedNote(null);
          if (undoTimer) {
              clearTimeout(undoTimer);
              setUndoTimer(null);
          }
      }
  };

  const handleBackToHome = () => {
    setActiveNote(null);
    setView('home');
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const themeColors = THEMES[theme];

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="font-sans antialiased text-white selection:bg-cyan-500/30">
      {view === 'home' ? (
        <Home 
          notes={notes}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
          currentTheme={theme}
          onSetTheme={handleSetTheme}
          onToggleHideNote={handleToggleHideNote}
          onTogglePinNote={handleTogglePinNote}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <Editor 
          note={activeNote}
          onSave={handleSaveNote}
          onBack={handleBackToHome}
          currentTheme={theme}
          onDeleteNote={handleDeleteNote}
        />
      )}

      {/* Global Undo Toast */}
      {deletedNote && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <button 
                onClick={handleUndoDelete}
                className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border ${themeColors.border} ${themeColors.surface} text-white hover:scale-105 transition-transform`}
              >
                  <span className="text-sm font-medium">Note Deleted</span>
                  <div className="h-4 w-px bg-white/20"></div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                      <RotateCcw size={14} />
                      <span className="text-sm font-bold uppercase tracking-wider">Undo</span>
                  </div>
              </button>
          </div>
      )}
    </div>
  );
};

export default App;