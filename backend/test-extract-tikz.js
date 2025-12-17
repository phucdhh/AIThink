// Test extractTikzBlocks with the exact format from user's screenshot

const content = `\`\`\`latex
\\documentclass[tikz,border=5mm]{standalone}
\\usetikzlibrary{calc}
\\begin{document}
\\begin{tikzpicture}[scale=0.8]
    % Đặt các điểm
    \\coordinate (A) at (0,0);
    \\coordinate (B) at (1,\\sqrt{3});
    \\coordinate (C) at (3,0);
    
    % Vẽ các cạnh tam giác
    \\draw [blue, thick] (A) -- (B);
    \\draw [blue, thick] (A) -- (C);
    \\draw [blue, thick] (B) -- (C);
    
    % Ghi nhãn các điểm
    \\node [left] at (A) {A};
    \\node [left] at (B) {B};
    \\node [right] at (C) {C};
\\end{tikzpicture}
\\end{document}
\`\`\``;

// Current regex from tikzService.js
const codeBlockRegex = /```\s*tikz\s*([\s\S]*?)(?:```|$)/gi;
const matches = [];
let match;

while ((match = codeBlockRegex.exec(content)) !== null) {
  matches.push({
    original: match[0],
    tikz: match[1].trim()
  });
}

console.log('=== CURRENT REGEX ===');
console.log('Pattern: /```\\s*tikz\\s*([\\s\\S]*?)(?:```|$)/gi');
console.log('Matches found:', matches.length);

if (matches.length === 0) {
  console.log('❌ NO MATCH! Code block has ```latex not ```tikz');
  
  // Test alternative regex
  const altRegex = /```\s*(?:latex|tikz)\s*([\s\S]*?)(?:```|$)/gi;
  const altMatches = [];
  while ((match = altRegex.exec(content)) !== null) {
    altMatches.push({
      original: match[0],
      tikz: match[1].trim()
    });
  }
  
  console.log('\n=== ALTERNATIVE REGEX ===');
  console.log('Pattern: /```\\s*(?:latex|tikz)\\s*([\\s\\S]*?)(?:```|$)/gi');
  console.log('Matches found:', altMatches.length);
  
  if (altMatches.length > 0) {
    console.log('✅ FOUND! Content length:', altMatches[0].tikz.length);
    console.log('First 100 chars:', altMatches[0].tikz.substring(0, 100));
  }
} else {
  console.log('Content:', matches[0].tikz.substring(0, 100));
}
