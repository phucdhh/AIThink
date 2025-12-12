import tikzService from './src/services/tikzService.js';

const testTikz = `\\begin{tikzpicture}[scale=1.5]
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (4,0);
  \\coordinate (C) at (2,3);
  
  \\draw[thick, blue] (A) -- (B) -- (C) -- cycle;
  
  \\node[below left] at (A) {$A$};
  \\node[below right] at (B) {$B$};
  \\node[above] at (C) {$C$};
  
  \\draw[red, dashed] (A) -- ($ (B)!0.5!(C) $);
\\end{tikzpicture}`;

async function test() {
  try {
    console.log('🎨 Testing TikZ compilation...');
    const svg = await tikzService.compileToSVG(testTikz);
    console.log('✅ Success! SVG length:', svg.length);
    console.log(svg.substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
