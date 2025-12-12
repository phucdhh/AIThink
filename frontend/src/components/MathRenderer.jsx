import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const MathRenderer = ({ content }) => {
  // Parse markdown-style formatting and LaTeX
  const parseContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let inCodeBlock = false;
    
    lines.forEach((line, lineIdx) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) {
        return;
      }
      
      // Empty line - end current paragraph
      if (line.trim() === '') {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        return;
      }
      
      // Headers
      if (line.startsWith('###')) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        elements.push(
          <h3 key={`h3-${lineIdx}`} style={{ marginTop: '15px', marginBottom: '10px', fontSize: '1.1em', fontWeight: '600' }}>
            {line.replace(/^###\s*/, '')}
          </h3>
        );
        return;
      }
      
      if (line.startsWith('##')) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        elements.push(
          <h2 key={`h2-${lineIdx}`} style={{ marginTop: '20px', marginBottom: '12px', fontSize: '1.3em', fontWeight: '700' }}>
            {line.replace(/^##\s*/, '')}
          </h2>
        );
        return;
      }
      
      // Bullet points
      if (line.trim().match(/^[\*\-\•]\s+/)) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        elements.push(
          <div key={`bullet-${lineIdx}`} style={{ marginLeft: '20px', marginBottom: '8px' }}>
            <span style={{ marginRight: '8px' }}>•</span>
            {renderInlineMath(line.replace(/^[\*\-\•]\s+/, ''))}
          </div>
        );
        return;
      }
      
      // Numbered steps
      if (line.trim().match(/^\d+\.\s+/)) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        const stepMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (stepMatch) {
          elements.push(
            <div key={`step-${lineIdx}`} style={{ marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid #667eea' }}>
              <strong style={{ color: '#667eea' }}>Bước {stepMatch[1]}:</strong> {renderInlineMath(stepMatch[2])}
            </div>
          );
        }
        return;
      }
      
      // Bold text markers
      if (line.includes('**')) {
        if (currentParagraph.length > 0) {
          elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
          currentParagraph = [];
        }
        elements.push(renderParagraph(line, elements.length));
        return;
      }
      
      // Regular line - add to current paragraph
      currentParagraph.push(line);
    });
    
    // Add remaining paragraph
    if (currentParagraph.length > 0) {
      elements.push(renderParagraph(currentParagraph.join('\n'), elements.length));
    }
    
    return elements;
  };
  
  const renderParagraph = (text, key) => {
    // Check for display math: $$...$$ or \[...\]
    const displayMathRegex = /(\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])/g;
    const matches = [...text.matchAll(displayMathRegex)];
    
    if (matches.length > 0) {
      const parts = [];
      let lastIndex = 0;
      
      matches.forEach((match, idx) => {
        // Text before math
        if (match.index > lastIndex) {
          const textBefore = text.slice(lastIndex, match.index);
          parts.push(
            <span key={`text-${key}-${idx}`}>
              {renderInlineMath(textBefore)}
            </span>
          );
        }
        
        // Extract math content (either from $$...$$ or \[...\])
        const mathContent = match[2] || match[3];
        
        // Display math
        parts.push(
          <div key={`display-${key}-${idx}`} style={{ margin: '15px 0', textAlign: 'center' }}>
            <BlockMath math={mathContent.trim()} />
          </div>
        );
        
        lastIndex = match.index + match[0].length;
      });
      
      // Remaining text
      if (lastIndex < text.length) {
        parts.push(
          <span key={`text-${key}-end`}>
            {renderInlineMath(text.slice(lastIndex))}
          </span>
        );
      }
      
      return (
        <div key={`para-${key}`} style={{ marginBottom: '12px', lineHeight: '1.8' }}>
          {parts}
        </div>
      );
    }
    
    return (
      <p key={`para-${key}`} style={{ marginBottom: '12px', lineHeight: '1.8' }}>
        {renderInlineMath(text)}
      </p>
    );
  };
  
  const renderInlineMath = (text) => {
    // Handle bold text
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Match both $...$ and \(...\) for inline math
    const inlineMathRegex = /(\$([^\$\n]+?)\$|\\\(([^\)]+?)\\\))/g;
    const parts = [];
    let lastIndex = 0;
    let idx = 0;
    let match;
    
    while ((match = inlineMathRegex.exec(text)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${idx}`} dangerouslySetInnerHTML={{ __html: textBefore }} />
        );
      }
      
      // Extract math content (either from $...$ or \(...\))
      const mathContent = match[2] || match[3];
      
      // Add inline math
      parts.push(
        <InlineMath key={`math-${idx}`} math={mathContent.trim()} />
      );
      
      idx++;
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      parts.push(
        <span key={`text-end-${idx}`} dangerouslySetInnerHTML={{ __html: remaining }} />
      );
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  return (
    <div className="math-content">
      {parseContent(content)}
    </div>
  );
};

export default MathRenderer;
