import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DrawingPath, Point } from '../types';
import { NEON_COLORS } from '../constants';
import { Eraser, Pencil, Undo } from 'lucide-react';

interface DrawingCanvasProps {
  initialPaths: DrawingPath[];
  onSave: (paths: DrawingPath[]) => void;
  onCancel: () => void;
  width: number;
  height: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialPaths, onSave, onCancel, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState(NEON_COLORS[0]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(3);

  // Redraw canvas whenever paths change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color; // Eraser might be handled differently in a layered approach, but for simple overlay, we can't truly erase background image, only paths.
      // Implementing eraser as "removing paths" or "drawing clear" is complex on single canvas. 
      // For this overlay MVP, "Eraser" will strictly remove drawn strokes if we detect intersection, OR we just draw 'destination-out'.
      // Since we are storing paths, let's keep it additive. "Eraser" usually means "Remove Stroke" in vector apps or "Paint Transparent" in raster.
      // Let's stick to additive drawing. If tool is eraser, we use globalCompositeOperation.
      
      const isEraser = path.color === 'eraser';
      
      if (isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = path.width * 2;
      } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.shadowBlur = 4;
          ctx.shadowColor = path.color;
          ctx.lineWidth = path.width;
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [paths, width, height]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    setIsDrawing(true);
    const point = getPoint(e);
    setCurrentPoints([point]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getPoint(e);
    setCurrentPoints(prev => [...prev, point]);

    // Live render current stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 4;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = selectedColor;
        ctx.shadowBlur = 4;
        ctx.shadowColor = selectedColor;
        ctx.lineWidth = brushSize;
    }

    if (currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPoints.length > 1) {
      setPaths(prev => [...prev, {
        points: currentPoints,
        color: tool === 'eraser' ? 'eraser' : selectedColor,
        width: brushSize
      }]);
    }
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col pointer-events-auto bg-black/40 backdrop-blur-[2px]">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="touch-none cursor-crosshair flex-grow"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {/* Drawing Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-10">
        
        {/* Colors */}
        <div className="flex gap-2 mr-4">
          {NEON_COLORS.map(color => (
            <button
              key={color}
              onClick={() => { setSelectedColor(color); setTool('pen'); }}
              className={`w-6 h-6 rounded-full transition-transform ${selectedColor === color && tool === 'pen' ? 'scale-125 ring-2 ring-white' : 'scale-100 hover:scale-110'}`}
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-neutral-700" />

        {/* Tools */}
        <button 
          onClick={() => setTool('pen')}
          className={`p-2 rounded-full transition-colors ${tool === 'pen' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
        >
          <Pencil size={20} />
        </button>

        <button 
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-full transition-colors ${tool === 'eraser' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
        >
          <Eraser size={20} />
        </button>

        <button 
          onClick={handleUndo}
          className="p-2 rounded-full text-neutral-400 hover:text-white transition-colors"
        >
          <Undo size={20} />
        </button>

        <div className="w-px h-6 bg-neutral-700" />

        <button 
          onClick={() => onSave(paths)}
          className="text-xs font-bold tracking-widest text-white uppercase hover:text-cyan-400 transition-colors ml-2"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
