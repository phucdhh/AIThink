import { readFileSync } from 'fs';

const svgContent = readFileSync('test-triangle.svg', 'utf-8');

// Parse viewBox
const viewBoxMatch = svgContent.match(/viewBox=['"]([^'"]+)['"]/);
const viewBoxValues = viewBoxMatch[1].split(/\s+/).map(parseFloat);
const [minX, minY, width, height] = viewBoxValues;
console.log('Original viewBox:', {minX, minY, width, height});

// Extract page1 content
const page1Match = svgContent.match(/<g\s+id=['"]page1['"][^>]*>([\s\S]*?)<\/g>/);
const contentToAnalyze = page1Match ? page1Match[1] : svgContent;
console.log('\nContent length:', contentToAnalyze.length);

// Parse coordinates
let minXContent = Infinity;
let minYContent = Infinity;
let maxXContent = -Infinity;
let maxYContent = -Infinity;

// Find <use x= y=> positions
const useRe = /<use[^>]*\s+x=['"]([^'"\s]+)['"][^>]*\s+y=['"]([^'"\s]+)['"][^>]*>/g;
let m;
let useCount = 0;
while ((m = useRe.exec(contentToAnalyze)) !== null) {
  const ux = parseFloat(m[1]);
  const uy = parseFloat(m[2]);
  useCount++;
  console.log(`<use> #${useCount}: x=${ux}, y=${uy}`);
  if (!Number.isNaN(ux)) {
    minXContent = Math.min(minXContent, ux);
    maxXContent = Math.max(maxXContent, ux);
  }
  if (!Number.isNaN(uy)) {
    minYContent = Math.min(minYContent, uy);
    maxYContent = Math.max(maxYContent, uy);
  }
}

// Parse path d attributes
const pathRe = /<path[^>]*\s+d=['"]([^'"]+)['"][^>]*>/g;
let pathCount = 0;
while ((m = pathRe.exec(contentToAnalyze)) !== null) {
  const d = m[1];
  const nums = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g)).map(x => parseFloat(x[0]));
  pathCount++;
  console.log(`<path> #${pathCount}: ${nums.length} numbers, range [${Math.min(...nums).toFixed(2)}, ${Math.max(...nums).toFixed(2)}]`);
  
  for (const num of nums) {
    if (!Number.isNaN(num)) {
      minXContent = Math.min(minXContent, num);
      maxXContent = Math.max(maxXContent, num);
      minYContent = Math.min(minYContent, num);
      maxYContent = Math.max(maxYContent, num);
    }
  }
}

console.log('\n=== RESULTS ===');
console.log('Content bounds:', {minXContent, minYContent, maxXContent, maxYContent});

const viewBoxMaxX = minX + width;
const viewBoxMaxY = minY + height;

const trueMinX = minXContent !== Infinity ? Math.min(minX, minXContent) : minX;
const trueMinY = minYContent !== Infinity ? Math.min(minY, minYContent) : minY;
const trueMaxX = maxXContent !== -Infinity ? Math.max(viewBoxMaxX, maxXContent) : viewBoxMaxX;
const trueMaxY = maxYContent !== -Infinity ? Math.max(viewBoxMaxY, maxYContent) : viewBoxMaxY;

const newWidth = trueMaxX - trueMinX;
const newHeight = trueMaxY - trueMinY;

console.log('True bounds:', {trueMinX, trueMinY, trueMaxX, trueMaxY});
console.log('New dimensions:', {newWidth, newHeight});
console.log('Shift:', {shiftX: -trueMinX, shiftY: -trueMinY});
