import React, { useState, useRef, useEffect } from 'react';

const ZoomableSVG = ({ svgContent }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div 
      className="svg-diagram-container"
      ref={containerRef}
      onWheel={handleWheel}
      style={{ position: 'relative' }}
    >
      {/* Zoom Controls */}
      <div className="svg-controls">
        <button 
          className="svg-control-btn" 
          onClick={handleZoomIn}
          title="Phóng to (hoặc cuộn chuột lên)"
        >
          +
        </button>
        <button 
          className="svg-control-btn" 
          onClick={handleZoomOut}
          title="Thu nhỏ (hoặc cuộn chuột xuống)"
        >
          −
        </button>
        <button 
          className="svg-control-btn" 
          onClick={handleReset}
          title="Đặt lại"
          style={{ fontSize: '14px' }}
        >
          ⟲
        </button>
      </div>

      {/* SVG Content */}
      <div
        ref={svgRef}
        className="svg-diagram"
        onMouseDown={handleMouseDown}
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transformOrigin: 'center center',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          padding: '20px'
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      
      {/* Scale indicator */}
      {scale !== 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default ZoomableSVG;
