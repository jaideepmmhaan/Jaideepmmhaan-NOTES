import React, { useState, useEffect } from 'react';
import { Note, Theme } from './types';
import Home from './components/Home';
import Editor from './components/Editor';
import SplashScreen from './components/SplashScreen';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<'home' | 'edit'>('home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');

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
    setActiveNote(updatedNote); 
  };

  const handleBackToHome = () => {
    setActiveNote(null);
    setView('home');
  };

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'pink';
      if (prev === 'pink') return 'royal';
      return 'dark';
    });
  };

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
          onThemeToggle={toggleTheme}
        />
      ) : (
        <Editor 
          note={activeNote}
          onSave={handleSaveNote}
          onBack={handleBackToHome}
          currentTheme={theme}
        />
      )}
    </div>
  );
};

export default App;
