# TikZ Integration

## Overview

AIThink now supports **TikZ** for mathematical diagrams instead of SVG. TikZ provides superior quality for mathematical illustrations, better LaTeX integration, and more natural syntax for geometry.

## Architecture

```
User Question
    ↓
DeepSeek-R1 generates TikZ code
    ↓
Backend streams response (with TikZ code blocks)
    ↓
chat.js detects ```tikz blocks
    ↓
tikzService.js compiles TikZ → DVI → SVG
    ↓
SVG sent to frontend via chat:tikz-compiled event
    ↓
Frontend replaces TikZ code with rendered SVG
```

## Backend Components

### 1. `tikzService.js`

Handles TikZ compilation using LaTeX toolchain:

**Dependencies:**
- `latex` (from BasicTeX)
- `dvisvgm` (DVI to SVG converter)

**Methods:**
- `compileToSVG(tikzCode)` - Main compilation function
- `wrapTikzCode(tikzCode)` - Wraps TikZ in LaTeX document
- `extractTikzBlocks(content)` - Extract ```tikz blocks from markdown
- `cleanup(basePath)` - Clean temporary files

**Process:**
1. Write LaTeX document with TikZ code to temp file
2. Run `latex` to generate DVI file
3. Run `dvisvgm` to convert DVI → SVG
4. Return SVG content
5. Clean up temp files

### 2. `chat.js`

Modified to post-process responses:

```javascript
// After Ollama streaming completes
const tikzBlocks = tikzService.extractTikzBlocks(fullResponse);
for (const block of tikzBlocks) {
  const svg = await tikzService.compileToSVG(block.tikz);
  fullResponse = fullResponse.replace(block.original, `\`\`\`svg\\n${svg}\\n\`\`\``);
}
socket.emit('chat:tikz-compiled', { content: fullResponse });
```

## Frontend Changes

### ChatInterface.jsx

Added handler for `chat:tikz-compiled` event:

```javascript
newSocket.on('chat:tikz-compiled', (data) => {
  // Replace entire assistant message with TikZ-compiled version
  lastMessage.content = data.content;
});
```

SVG rendering remains unchanged - frontend treats compiled TikZ as normal SVG blocks.

## System Prompt

Updated to instruct AI to use TikZ:

```tikz
\begin{tikzpicture}[scale=1.5]
  \coordinate (A) at (0,0);
  \coordinate (B) at (4,0);
  \coordinate (C) at (2,3);
  
  \draw[thick] (A) -- (B) -- (C) -- cycle;
  
  \node[below left] at (A) {$A$};
  \node[below right] at (B) {$B$};
  \node[above] at (C) {$C$};
  
  \pic[draw, angle radius=0.5cm, "$\alpha$"] {angle = B--A--C};
\end{tikzpicture}
```

## Installation

### 1. Install BasicTeX (macOS)

```bash
brew install --cask basictex
```

### 2. Update PATH

```bash
eval "$(/usr/libexec/path_helper)"
```

Or add to `~/.zshrc`:
```bash
export PATH="/Library/TeX/texbin:$PATH"
```

### 3. Install Required Packages

```bash
sudo tlmgr update --self
sudo tlmgr install dvisvgm standalone tikz-cd
```

### 4. Update Startup Scripts

Add PATH update to `start-ollama.sh` and `restart-after-reboot.sh`:

```bash
export PATH="/Library/TeX/texbin:$PATH"
```

## TikZ Best Practices

### Coordinates
```tikz
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at ($(A)!0.5!(B)$);  % Midpoint using calc
```

### Drawing
```tikz
\draw[thick, blue] (A) -- (B);        % Line
\draw[red, dashed] (A) circle (2cm);  % Circle
\fill[green!20] (A) -- (B) -- (C) -- cycle;  % Filled triangle
```

### Labels
```tikz
\node[below] at (A) {$A$};            % Point label
\node[midway, above] {$5$};           % Edge label
```

### Angles
```tikz
\pic[draw, angle radius=0.5cm, "$\alpha$"] {angle = B--A--C};
```

### Libraries
```latex
\usetikzlibrary{arrows.meta,calc,patterns,angles,quotes,decorations.markings}
```

## Performance

- **Compilation time**: ~1-2s per TikZ diagram
- **Cached**: No (each request compiles fresh)
- **Concurrent**: Safe (uses unique temp files per request)

## Error Handling

If TikZ compilation fails:
1. Original ```tikz code block remains in response
2. Error logged to console
3. Frontend shows code instead of diagram
4. User can debug from visible TikZ code

## Testing

```bash
cd backend
node test-tikz.js
```

Expected output:
```
🎨 Testing TikZ compilation...
✅ Success! SVG length: 3777
<?xml version='1.0' encoding='UTF-8'?>...
```

## Advantages Over SVG

| Feature | TikZ | SVG |
|---------|------|-----|
| LaTeX math | ✅ Native | ❌ Separate rendering |
| Coordinate system | ✅ Mathematical (y up) | ❌ Screen (y down) |
| Syntax | ✅ Intuitive for math | ❌ Verbose XML |
| AI training | ✅ Common in papers | ⚠️ Less common |
| Angles/arcs | ✅ Built-in | ❌ Complex paths |
| Quality | ✅ Vector, scalable | ✅ Vector, scalable |

## Future Improvements

1. **Caching**: Cache compiled SVG by TikZ code hash
2. **Timeout**: Add configurable timeout for long compilations
3. **Validation**: Pre-validate TikZ syntax before compilation
4. **Libraries**: Auto-detect and include required TikZ libraries
5. **3D**: Support `tikz-3dplot` for 3D geometry
6. **Pgfplots**: Support function plots and data visualization

## Troubleshooting

### LaTeX not found
```bash
which latex
# Should output: /Library/TeX/texbin/latex
```

Fix: Run `eval "$(/usr/libexec/path_helper)"` or add to shell profile.

### dvisvgm not found
```bash
sudo tlmgr install dvisvgm
```

### Missing TikZ libraries
```bash
sudo tlmgr install tikz-cd pgfplots
```

### Compilation timeout
Increase timeout in `tikzService.js`:
```javascript
await execAsync(command, { timeout: 20000 }); // 20s instead of 10s
```
