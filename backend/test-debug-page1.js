import { readFileSync } from 'fs';

const svgContent = readFileSync('test-triangle.svg', 'utf-8');

// Test regex matching
const page1Match = svgContent.match(/<g\s+id=['"]page1['"][^>]*>([\s\S]*?)<\/g>/);
console.log('Match found:', page1Match ? 'YES' : 'NO');

if (page1Match) {
  console.log('Captured content length:', page1Match[1].length);
  console.log('First 200 chars:', page1Match[1].substring(0, 200));
} else {
  // Try alternative
  const alt = svgContent.match(/<g\s+id=['"]page1['"][^>]*>([\s\S]+)/);
  console.log('Alternative match:', alt ? 'YES' : 'NO');
  if (alt) {
    console.log('Alt content length:', alt[1].length);
    console.log('First 200 chars:', alt[1].substring(0, 200));
  }
}

// Check what's inside
const useMatches = svgContent.match(/<use[^>]*>/g);
console.log('\nTotal <use> tags in full SVG:', useMatches ? useMatches.length : 0);

const pathMatches = svgContent.match(/<path[^>]*d=['"][^'"]+['"][^>]*>/g);
console.log('Total <path> tags with d attr:', pathMatches ? pathMatches.length : 0);
