# 🧪 TikZ/SVG Chrome Testing Tools

This directory contains tools for debugging TikZ → SVG rendering issues.

## Files

### `test-svg.html`
Interactive HTML page to test SVG rendering with different normalization strategies.

**Usage:**
1. Open in browser: `file:///Users/mac/AIThink/chrome_test/test-svg.html`
2. Paste raw SVG from backend logs into the script section
3. View 3 different rendering approaches:
   - Raw SVG (as-is from dvisvgm)
   - Normalized SVG (viewBox starts at 0,0 with transform)
   - Scaled SVG (with preserveAspectRatio)

### `test-tikz.sh`
Bash script to test different dvisvgm compilation options.

**Usage:**
```bash
./test-tikz.sh
```

**What it does:**
- Creates a test TikZ diagram (triangle with labels)
- Compiles with LaTeX → DVI
- Tests 5 different dvisvgm options:
  1. Default (no flags)
  2. `--exact`
  3. `--exact-bbox`
  4. `--bbox=preview`
  5. `--bbox=min`
- Compares viewBox values and file sizes
- Copies results to `chrome_test/` folder

**Output files:**
- `test-default.svg`
- `test-exact.svg`
- `test-exact-bbox.svg`
- `test-bbox-preview.svg`
- `test-bbox-min.svg`

## Common Issues

### Issue 1: Empty white box in SVG
**Symptom:** SVG element renders but content not visible

**Cause:** ViewBox with negative coordinates (e.g., `viewBox="-55.695 191.982 8.056 6.807"`)

**Solution:** Normalize viewBox to start at 0,0 and translate content:
```javascript
// Change viewBox="-55 192 8 7" to viewBox="0 0 8 7"
// Add transform to <g>: transform="translate(55, -192)"
```

### Issue 2: PostScript specials ignored
**Symptom:** Warning "128 PostScript specials ignored"

**Cause:** dvisvgm can't find Ghostscript

**Solution:** 
```bash
brew install ghostscript
# Add to PATH: /opt/homebrew/bin
```

### Issue 3: Very small or huge SVG
**Symptom:** SVG renders but size is wrong

**Cause:** Wrong dvisvgm bbox option

**Solutions:**
- Try different bbox options (see test-tikz.sh)
- Add `--scale=N` option to dvisvgm
- Remove fixed width/height from SVG tag

## Debug Workflow

1. **Check backend logs:**
   ```bash
   pm2 logs aithink-backend | grep -A5 "TikZ"
   ```

2. **Copy SVG output** from logs

3. **Test in browser:**
   - Open `test-svg.html`
   - Paste SVG in script section
   - Reload page to see all 3 rendering tests

4. **Test dvisvgm options:**
   ```bash
   ./test-tikz.sh
   ```
   Open generated SVG files to compare quality

5. **Apply fix** to `backend/src/services/tikzService.js` and `frontend/src/components/StreamingMathRenderer.jsx`

## Key Requirements

✅ **Ghostscript must be in PATH:**
```bash
which gs  # Should return /opt/homebrew/bin/gs
```

✅ **dvisvgm must find Ghostscript:**
```bash
PATH=/opt/homebrew/bin:$PATH dvisvgm --version
# Should NOT show "Ghostscript not found" warnings
```

✅ **Frontend must normalize viewBox:**
- Remove XML declaration if blocking
- Change viewBox to start at (0,0)
- Add transform="translate(x,y)" to shift content
- Remove fixed width/height attributes

## Current Configuration

**Backend (tikzService.js):**
```javascript
// Use dvisvgm with Ghostscript in PATH
const dvisvgmEnv = {
  PATH: '/opt/homebrew/bin:/Library/TeX/texbin:/usr/local/bin:/usr/bin:/bin'
};
await execAsync('dvisvgm --no-fonts --output=file.svg file.dvi', { env: dvisvgmEnv });
```

**Frontend (StreamingMathRenderer.jsx):**
```javascript
// Normalize viewBox and add transform
const [minX, minY, width, height] = viewBox.split(' ');
newViewBox = `0 0 ${width} ${height}`;
transform = `translate(${-minX}, ${-minY})`;
```

## Tips

- **Always test in browser first** before deploying
- **Check PM2 logs** for dvisvgm warnings
- **Use chrome_test/** for isolated testing without affecting production
- **Compare multiple dvisvgm options** to find the best for your use case
