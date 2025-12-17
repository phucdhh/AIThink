/**
 * Clean version of SVG normalization
 * Handles all cases: negative viewBox, zero-based viewBox with negative content
 */
function normalizeSVGViewBox(svgContent) {
  // Match viewBox attribute
  const viewBoxMatch = svgContent.match(/viewBox=['"]([^'"]+)['"]/);
  if (!viewBoxMatch) return svgContent;

  const viewBoxValues = viewBoxMatch[1].split(/\s+/).map(parseFloat);
  if (viewBoxValues.length !== 4) return svgContent;

  const [minX, minY, viewWidth, viewHeight] = viewBoxValues;
  
  // Parse actual content coordinates to find true bounds
  let minXContent = Infinity;
  let minYContent = Infinity;

  // Find <use x= y=> positions
  const useRe = /<use[^>]*\s+x=['"]([^'"\s]+)['"][^>]*\s+y=['"]([^'"\s]+)['"][^>]*>/g;
  let m;
  while ((m = useRe.exec(svgContent)) !== null) {
    const ux = parseFloat(m[1]);
    const uy = parseFloat(m[2]);
    if (!Number.isNaN(ux)) minXContent = Math.min(minXContent, ux);
    if (!Number.isNaN(uy)) minYContent = Math.min(minYContent, uy);
  }

  // Parse path d attributes
  const pathRe = /<path[^>]*\s+d=['"]([^'"]+)['"][^>]*>/g;
  while ((m = pathRe.exec(svgContent)) !== null) {
    const d = m[1];
    const nums = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g)).map(x => parseFloat(x[0]));
    for (const num of nums) {
      if (!Number.isNaN(num)) {
        minXContent = Math.min(minXContent, num);
        minYContent = Math.min(minYContent, num);
      }
    }
  }

  // Determine true minimum coordinates (viewBox or content, whichever is smaller)
  const trueMinX = minXContent !== Infinity ? Math.min(minX, minXContent) : minX;
  const trueMinY = minYContent !== Infinity ? Math.min(minY, minYContent) : minY;

  // Calculate new viewBox dimensions to contain all content
  const trueMaxX = minX + viewWidth;
  const trueMaxY = minY + viewHeight;
  const newWidth = trueMaxX - trueMinX;
  const newHeight = trueMaxY - trueMinY;

  // Update SVG attributes
  svgContent = svgContent.replace(/viewBox=['"][^'"]+['\"]/, `viewBox="0 0 ${newWidth.toFixed(6)} ${newHeight.toFixed(6)}"`);
  svgContent = svgContent.replace(/(<svg[^>]*\s)width=['"][^'"]+['"]/, `$1width="${newWidth.toFixed(2)}pt"`);
  svgContent = svgContent.replace(/(<svg[^>]*\s)height=['"][^'"]+['"]/, `$1height="${newHeight.toFixed(2)}pt"`);

  // Add transform to shift content to origin
  const transform = `translate(${(-trueMinX).toFixed(6)}, ${(-trueMinY).toFixed(6)})`;
  const gHasTransform = /<g\s+id=['"]page1['"]\s+transform=/.test(svgContent);
  if (gHasTransform) {
    svgContent = svgContent.replace(/<g\s+id=['"]page1['"]\s+transform=['"][^'"]*['"]/, `<g id='page1' transform='${transform}'`);
  } else {
    svgContent = svgContent.replace(/<g\s+id=['"]page1['"]/, `<g id='page1' transform='${transform}'`);
  }

  console.log(`📐 Normalized SVG: shift [${(-trueMinX).toFixed(2)}, ${(-trueMinY).toFixed(2)}], viewBox [0, 0, ${newWidth.toFixed(2)}, ${newHeight.toFixed(2)}]`);
  return svgContent;
}

// Test with problematic SVG
import { readFileSync } from 'fs';
const svg = readFileSync('/Users/mac/AIThink/backend/test-svg-axes.svg', 'utf8');
const normalized = normalizeSVGViewBox(svg);
console.log('\n✅ Done! Check output above.');
