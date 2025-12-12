import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * SVGRenderer - Render SVG diagrams from markdown code blocks
 * Parses text for ```svg...``` blocks and renders them safely
 */
const SVGRenderer = ({ text, isStreaming = false }) => {
  const renderedContent = useMemo(() => {
    if (!text) return [];

    const parts = [];
    let lastIndex = 0;
    
    // Match ```svg...``` blocks
    const svgRegex = /```svg\s*([\s\S]*?)```/g;
    let match;

    while ((match = svgRegex.exec(text)) !== null) {
      const beforeSvg = text.slice(lastIndex, match.index);
      if (beforeSvg) {
        parts.push({ type: 'text', content: beforeSvg });
      }

      const svgCode = match[1].trim();
      parts.push({ type: 'svg', content: svgCode });
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  const sanitizeSVG = (svgCode) => {
    try {
      // Configure DOMPurify to allow SVG elements
      const config = {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'text', 'tspan', 'g', 'defs', 'clipPath', 'mask'],
        ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'font-size', 'font-family', 'text-anchor', 'dominant-baseline', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'd', 'points', 'transform'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
      };

      const sanitized = DOMPurify.sanitize(svgCode, config);
      return sanitized;
    } catch (error) {
      console.error('SVG sanitization error:', error);
      return null;
    }
  };

  return (
    <div className="svg-renderer">
      {renderedContent.map((part, index) => {
        if (part.type === 'svg') {
          const sanitized = sanitizeSVG(part.content);
          
          if (!sanitized) {
            return (
              <div key={index} className="svg-error">
                ⚠️ SVG không hợp lệ
              </div>
            );
          }

          return (
            <div key={index} className="svg-diagram-container">
              <div 
                className="svg-diagram"
                dangerouslySetInnerHTML={{ __html: sanitized }}
              />
            </div>
          );
        } else {
          return (
            <span key={index}>{part.content}</span>
          );
        }
      })}
      {isStreaming && parts.length > 0 && parts[parts.length - 1].type === 'text' && (
        <span className="streaming-cursor" style={{
          display: 'inline-block',
          width: '2px',
          height: '18px',
          backgroundColor: '#667eea',
          marginLeft: '2px',
          animation: 'blink 1s infinite'
        }}></span>
      )}
    </div>
  );
};

export default SVGRenderer;
