import React, { useState, useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

const StreamingMathRenderer = ({ content, isStreaming }) => {
  const [parsedElements, setParsedElements] = useState([]);
  const previousContentRef = useRef('');

  useEffect(() => {
    // Only re-parse if content changed
    if (content !== previousContentRef.current) {
      previousContentRef.current = content;
      setParsedElements(parseStreamingContent(content, isStreaming));
    }
  }, [content, isStreaming]);

  const parseStreamingContent = (text, streaming) => {
    // Show placeholder when empty and streaming
    if (!text && streaming) {
      return [
        <div key="thinking" style={{ 
          color: '#999', 
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="thinking-dots">Đang kết nối với AI</span>
          <span className="streaming-cursor" style={{
            display: 'inline-block',
            width: '8px',
            height: '16px',
            backgroundColor: '#667eea',
            animation: 'blink 1s infinite'
          }}></span>
        </div>
      ];
    }

    if (!text) return [];

    const elements = [];
    let buffer = text;
    let key = 0;

    // Parse SVG blocks: ```svg...``` (case insensitive, allow whitespace)
    const svgPattern = /```\s*svg\s*([\s\S]*?)```/gi;
    let svgMatch;
    let lastSvgIndex = 0;
    const svgParts = [];

    // console.log('Parsing buffer for SVG, length:', buffer.length);
    // console.log('Buffer contains ```svg:', buffer.includes('```svg'));
    
    while ((svgMatch = svgPattern.exec(buffer)) !== null) {
      console.log('SVG match found! Captured length:', svgMatch[1].length);
      console.log('SVG captured content:', svgMatch[1]);
      if (svgMatch.index > lastSvgIndex) {
        let beforeContent = buffer.slice(lastSvgIndex, svgMatch.index);
        
        // Remove explanatory text about SVG that appears before the block
        // Common patterns: "Mình sẽ không giải thích...", "Hình vẽ minh họa:", etc.
        beforeContent = beforeContent
          .replace(/[^\n]*(?:không giải thích|về cách|code SVG|SVG code|vẽ SVG)[^\n]*/gi, '')
          .replace(/```\s*svg\s*$/gi, '')
          .trim();
        
        if (beforeContent) {
          svgParts.push({
            type: 'content',
            content: beforeContent
          });
        }
      }
      svgParts.push({
        type: 'svg',
        content: svgMatch[1].trim()
      });
      lastSvgIndex = svgMatch.index + svgMatch[0].length;
    }
    if (lastSvgIndex < buffer.length) {
      let afterContent = buffer.slice(lastSvgIndex);
      afterContent = afterContent.replace(/^```\s*/gi, '').trim();
      if (afterContent) {
        svgParts.push({
          type: 'content',
          content: afterContent
        });
      }
    }

    // If no SVG found, treat all as content
    if (svgParts.length === 0) {
      svgParts.push({ type: 'content', content: buffer });
    }

    // Process each SVG part
    svgParts.forEach((svgPart, svgIdx) => {
      if (svgPart.type === 'svg') {
        // Render SVG diagram
        const sanitizedSvg = sanitizeSVG(svgPart.content);
        if (sanitizedSvg) {
          elements.push(
            <div key={`svg-${key++}`} className="svg-diagram-container" style={{
              margin: '20px 0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div 
                className="svg-diagram"
                style={{
                  maxWidth: '100%',
                  width: '100%',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}
                dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
              />
            </div>
          );
        } else {
          elements.push(
            <div key={`svg-error-${key++}`} style={{
              margin: '15px 0',
              padding: '10px',
              backgroundColor: 'rgba(234, 102, 102, 0.05)',
              borderRadius: '8px',
              color: '#c53030'
            }}>
              ⚠️ SVG không hợp lệ hoặc không an toàn
            </div>
          );
        }
        return;
      }

      // Process normal content with display math
      const contentBuffer = svgPart.content;
      const displayMathPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
      let lastIndex = 0;
      let match;

      const parts = [];
      while ((match = displayMathPattern.exec(contentBuffer)) !== null) {
        // Text before math
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: contentBuffer.slice(lastIndex, match.index)
          });
        }

        // Display math
        const mathContent = match[0];
        let latex = '';
        if (mathContent.startsWith('$$')) {
          latex = mathContent.slice(2, -2);
        } else if (mathContent.startsWith('\\[')) {
          latex = mathContent.slice(2, -2);
        }

        parts.push({
          type: 'displayMath',
          content: latex.trim()
        });

        lastIndex = match.index + match[0].length;
      }

      // Remaining text
      if (lastIndex < contentBuffer.length) {
        parts.push({
          type: 'text',
          content: contentBuffer.slice(lastIndex)
        });
      }

      // Now process each part
      parts.forEach((part, idx) => {
        if (part.type === 'displayMath') {
          try {
            elements.push(
              <div key={`display-${key++}`} style={{ 
                margin: '15px 0', 
                padding: '10px',
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '8px',
                overflow: 'auto'
              }}>
                <BlockMath math={part.content} />
              </div>
            );
          } catch (error) {
            // If KaTeX fails, show raw LaTeX
            elements.push(
              <div key={`display-error-${key++}`} style={{ 
                margin: '15px 0',
                padding: '10px',
                backgroundColor: 'rgba(234, 102, 102, 0.05)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.9em'
              }}>
                {part.content}
              </div>
            );
          }
        } else {
          // Process text with inline math and formatting
          const textElements = parseTextWithInlineMath(part.content, key);
          elements.push(
            <div key={`text-block-${idx}-${svgIdx}`} style={{ marginBottom: '8px' }}>
              {textElements}
            </div>
          );
          key += 100; // Increment key pool
        }
      });
    });

    return elements;
  };

  const sanitizeSVG = (svgCode) => {
    try {
      let processedSvg = svgCode.trim();
      
      // If doesn't start with <svg, wrap it with default SVG tag
      if (!processedSvg.startsWith('<svg')) {
        console.log('SVG missing opening tag, wrapping content...');
        processedSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">\n${processedSvg}\n</svg>`;
      }
      
      // If doesn't end with </svg>, add closing tag
      if (!processedSvg.trim().endsWith('</svg>')) {
        console.log('SVG missing closing tag, adding...');
        processedSvg = processedSvg + '\n</svg>';
      }

      // Configure DOMPurify to allow SVG elements
      const config = {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'text', 'tspan', 'g', 'defs', 'clipPath', 'mask', 'marker'],
        ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'font-size', 'font-family', 'text-anchor', 'dominant-baseline', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'd', 'points', 'transform', 'opacity', 'marker-end', 'marker-start'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
      };

      const sanitized = DOMPurify.sanitize(processedSvg, config);
      
      // Verify it's valid SVG
      if (!sanitized || sanitized.length < 20) {
        console.error('Sanitized SVG is too short or empty:', sanitized);
        return null;
      }
      
      console.log('SVG sanitized successfully, length:', sanitized.length);
      console.log('Sanitized SVG content:', sanitized);
      return sanitized;
    } catch (error) {
      console.error('SVG sanitization error:', error);
      return null;
    }
  };

  const parseTextWithInlineMath = (text, keyOffset = 0) => {
    const elements = [];
    let key = keyOffset;

    // Split by lines first
    const lines = text.split('\n');

    lines.forEach((line, lineIdx) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${key++}`} />);
        return;
      }

      // Check for special formatting
      // Headers
      if (line.startsWith('###')) {
        elements.push(
          <h3 key={`h3-${key++}`} style={{ 
            marginTop: '15px', 
            marginBottom: '10px', 
            fontSize: '1.1em', 
            fontWeight: '600',
            color: '#667eea'
          }}>
            {parseInlineMath(line.replace(/^###\s*/, ''), key)}
          </h3>
        );
        return;
      }

      if (line.startsWith('##')) {
        elements.push(
          <h2 key={`h2-${key++}`} style={{ 
            marginTop: '20px', 
            marginBottom: '12px', 
            fontSize: '1.3em', 
            fontWeight: '700',
            color: '#667eea'
          }}>
            {parseInlineMath(line.replace(/^##\s*/, ''), key)}
          </h2>
        );
        return;
      }

      // Bullet points
      if (line.trim().match(/^[\*\-\•]\s+/)) {
        elements.push(
          <div key={`bullet-${key++}`} style={{ marginLeft: '20px', marginBottom: '8px' }}>
            <span style={{ marginRight: '8px', color: '#667eea' }}>•</span>
            {parseInlineMath(line.replace(/^[\*\-\•]\s+/, ''), key)}
          </div>
        );
        return;
      }

      // Numbered steps (Bước 1:, Bước 2:, etc.)
      const stepMatch = line.match(/^(Bước\s+\d+:)/i);
      if (stepMatch) {
        elements.push(
          <div key={`step-${key++}`} style={{ 
            marginBottom: '12px', 
            paddingLeft: '15px', 
            borderLeft: '3px solid #667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            padding: '8px 15px',
            borderRadius: '0 8px 8px 0'
          }}>
            <strong style={{ color: '#667eea' }}>{stepMatch[1]}</strong>{' '}
            {parseInlineMath(line.slice(stepMatch[0].length), key)}
          </div>
        );
        return;
      }

      // Regular numbered list
      if (line.trim().match(/^\d+\.\s+/)) {
        const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          elements.push(
            <div key={`num-${key++}`} style={{ 
              marginBottom: '8px',
              paddingLeft: '10px'
            }}>
              <strong style={{ color: '#667eea' }}>{numMatch[1]}.</strong>{' '}
              {parseInlineMath(numMatch[2], key)}
            </div>
          );
          return;
        }
      }

      // Bold section headers (**Text:**)
      if (line.match(/^\*\*[^*]+\*\*:/)) {
        elements.push(
          <div key={`section-${key++}`} style={{ 
            marginTop: '15px',
            marginBottom: '8px',
            fontSize: '1.05em'
          }}>
            {parseInlineMath(line, key)}
          </div>
        );
        return;
      }

      // Regular line
      elements.push(
        <div key={`line-${key++}`} style={{ marginBottom: '6px', lineHeight: '1.8' }}>
          {parseInlineMath(line, key)}
        </div>
      );
    });

    return elements;
  };

  const parseInlineMath = (text, keyOffset = 0) => {
    const elements = [];
    let key = keyOffset;

    // Handle bold text first
    let processedText = text;
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const boldParts = [];
    let lastIdx = 0;
    let boldMatch;

    while ((boldMatch = boldPattern.exec(text)) !== null) {
      if (boldMatch.index > lastIdx) {
        boldParts.push({ type: 'text', content: text.slice(lastIdx, boldMatch.index) });
      }
      boldParts.push({ type: 'bold', content: boldMatch[1] });
      lastIdx = boldMatch.index + boldMatch[0].length;
    }
    if (lastIdx < text.length) {
      boldParts.push({ type: 'text', content: text.slice(lastIdx) });
    }

    // Process each part for inline math
    boldParts.forEach((part, partIdx) => {
      if (part.type === 'bold') {
        elements.push(
          <strong key={`bold-${key++}`} style={{ fontWeight: '600', color: '#4a5568' }}>
            {parseInlineMathInText(part.content, key)}
          </strong>
        );
      } else {
        const mathElements = parseInlineMathInText(part.content, key);
        elements.push(...(Array.isArray(mathElements) ? mathElements : [mathElements]));
        key += 50;
      }
    });

    return elements.length > 0 ? elements : text;
  };

  const parseInlineMathInText = (text, keyOffset = 0) => {
    const elements = [];
    let key = keyOffset;

    // Match both $...$ and \(...\) for inline math
    const inlineMathPattern = /(\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineMathPattern.exec(text)) !== null) {
      // Text before math
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${key++}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Extract math content
      const mathContent = match[0];
      let latex = '';
      if (mathContent.startsWith('$')) {
        latex = mathContent.slice(1, -1);
      } else if (mathContent.startsWith('\\(')) {
        latex = mathContent.slice(2, -2);
      }

      // Render inline math
      try {
        elements.push(
          <InlineMath key={`math-${key++}`} math={latex.trim()} />
        );
      } catch (error) {
        // If KaTeX fails, show raw
        elements.push(
          <code key={`math-error-${key++}`} style={{ 
            backgroundColor: 'rgba(234, 102, 102, 0.1)',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '0.9em'
          }}>
            {latex}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-end-${key++}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <div className="streaming-math-content" style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px',
      lineHeight: '1.7',
      color: '#2d3748'
    }}>
      {parsedElements}
      {isStreaming && (
        <span className="streaming-cursor" style={{
          display: 'inline-block',
          width: '2px',
          height: '18px',
          backgroundColor: '#667eea',
          marginLeft: '2px',
          verticalAlign: 'middle'
        }}></span>
      )}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StreamingMathRenderer;
