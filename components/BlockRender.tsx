import React, { useRef, useEffect, useState } from 'react';
import { Block, DrawingPath } from '../types';
import { Pencil, Maximize2, Trash2 } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';

interface BlockRenderProps {
  block: Block;
  isEditing: boolean;
  onUpdate: (id: string, content: string) => void;
  onUpdateDrawings: (id: string, drawings: DrawingPath[]) => void;
  onDelete: (id: string) => void;
  themeAccent: string;
}

export const BlockRender: React.FC<BlockRenderProps> = ({ 
  block, 
  isEditing, 
  onUpdate, 
  onUpdateDrawings,
  onDelete, 
  themeAccent 
}) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (block.type === 'text' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content, block.type]);

  // Render Drawings on read-only canvas
  useEffect(() => {
    if ((block.type === 'image' || block.type === 'video') && canvasRef.current && block.drawings) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      block.drawings.forEach(path => {
        if (path.points.length < 2) return;
        
        if (path.color === 'eraser') {
            // Eraser logic is tough on a composite canvas without re-rendering everything underneath
            // For the read-only view, we might assume destination-out if we want true transparency
            // But since the background is an image/video behind the canvas, destination-out works!
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = path.width * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.shadowBlur = 4;
            ctx.shadowColor = path.color;
        }

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      });
    }
  }, [block.drawings, block.type, isDrawingMode]);


  if (block.type === 'text') {
    return (
      <div className="relative group my-2 px-1">
        <textarea
          ref={textareaRef}
          value={block.content}
          onChange={(e) => onUpdate(block.id, e.target.value)}
          placeholder="Start writing..."
          className={`w-full bg-transparent resize-none outline-none text-lg leading-relaxed font-light tracking-wide placeholder-white/20 transition-all duration-300 ${isEditing ? 'border-l-2 border-white/10 pl-4' : 'pl-0'}`}
          style={{ minHeight: '1.5em' }}
        />
        {isEditing && (
            <button 
                onClick={() => onDelete(block.id)}
                className="absolute -right-4 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500/50 hover:text-red-500"
            >
                <Trash2 size={16} />
            </button>
        )}
      </div>
    );
  }

  if (block.type === 'image' || block.type === 'video') {
    return (
      <div className="relative my-6 group select-none" ref={containerRef}>
        <div className="relative w-full rounded-sm overflow-hidden shadow-lg bg-neutral-900 aspect-square sm:aspect-video transition-transform duration-500">
          
          {block.type === 'image' ? (
             <img src={block.content} alt="Note asset" className="w-full h-full object-cover" />
          ) : (
             <video src={block.content} controls={false} muted playsInline loop autoPlay className="w-full h-full object-cover" />
          )}

          {/* Read-only overlay canvas for drawings */}
          <canvas 
            ref={canvasRef}
            width={containerRef.current?.offsetWidth || 800}
            height={containerRef.current?.offsetHeight || 600}
            className="absolute inset-0 pointer-events-none w-full h-full"
          />

          {/* Hover Controls */}
          {isEditing && !isDrawingMode && (
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                <button 
                  onClick={() => setIsDrawingMode(true)}
                  className={`p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:${themeAccent} transition-all transform hover:scale-110`}
                >
                  <Pencil size={20} />
                </button>
                <button 
                   onClick={() => onDelete(block.id)}
                   className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-red-500 transition-all transform hover:scale-110"
                >
                  <Trash2 size={20} />
                </button>
             </div>
          )}
        </div>
        
        {/* Fullscreen Drawing Mode Overlay */}
        {isDrawingMode && containerRef.current && (
           <DrawingCanvas
              width={containerRef.current.offsetWidth}
              height={containerRef.current.offsetHeight}
              initialPaths={block.drawings || []}
              onSave={(paths) => {
                  onUpdateDrawings(block.id, paths);
                  setIsDrawingMode(false);
              }}
              onCancel={() => setIsDrawingMode(false)}
           />
        )}
      </div>
    );
  }

  return null;
};
