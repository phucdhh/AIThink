import { exec } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execAsync = promisify(exec);

class TikzService {
  constructor() {
    this.tmpDir = os.tmpdir();
  }

  /**
   * Compile TikZ code to SVG
   * @param {string} tikzCode - TikZ/LaTeX code
   * @returns {Promise<string>} - SVG content
   */
  async compileToSVG(tikzCode) {
    const jobId = crypto.randomBytes(8).toString('hex');
    const basePath = path.join(this.tmpDir, `tikz_${jobId}`);
    const texFile = `${basePath}.tex`;
    const dviFile = `${basePath}.dvi`;
    const svgFile = `${basePath}.svg`;

    try {
      // Create LaTeX document with TikZ
      const latexDoc = this.wrapTikzCode(tikzCode);
      await writeFile(texFile, latexDoc);

      // Compile LaTeX → DVI (use absolute path)
      await execAsync(`/Library/TeX/texbin/latex -interaction=nonstopmode -output-directory=${this.tmpDir} ${texFile}`, {
        timeout: 10000
      });

      // Convert DVI → SVG using dvisvgm (use absolute path)
      // Specify Ghostscript library explicitly for PostScript processing
      const gsLib = '/opt/homebrew/Cellar/ghostscript/10.06.0/lib/libgs.dylib';
      const dvisvgmEnv = {
        ...process.env,
        PATH: `/opt/homebrew/bin:/Library/TeX/texbin:/usr/local/bin:/usr/bin:/bin`
      };
      
      // Use --exact-bbox for better bounding box calculation
      await execAsync(`/Library/TeX/texbin/dvisvgm --no-fonts --exact-bbox --libgs=${gsLib} --output=${svgFile} ${dviFile}`, {
        timeout: 10000,
        env: dvisvgmEnv
      });

      // Read SVG content and normalize viewBox
      let svgContent = await readFile(svgFile, 'utf-8');
      svgContent = this.normalizeSVGViewBox(svgContent);

      // Cleanup temp files
      await this.cleanup(basePath);

      return svgContent;
    } catch (error) {
      // Cleanup on error
      await this.cleanup(basePath);
      throw new Error(`TikZ compilation failed: ${error.message}`);
    }
  }

  /**
   * Wrap TikZ code in LaTeX document
   * Auto-wraps with tikzpicture environment if missing
   */
  wrapTikzCode(tikzCode) {
    // Sanitize code: remove code fences and ensure tikzpicture environment is balanced
    const sanitize = (code) => {
      let s = String(code || '');
      // Remove leading/trailing code fences ``` and optional language marker
      s = s.replace(/^\s*```\s*\w*\s*\n?/i, '');
      s = s.replace(/\n?\s*```\s*$/i, '');

      // Trim whitespace
      s = s.trim();

      const hasBegin = /\\begin\{tikzpicture\}/i.test(s);
      const hasEnd = /\\end\{tikzpicture\}/i.test(s);

      if (!hasBegin && hasEnd) {
        s = `\\begin{tikzpicture}\n${s}`;
      } else if (hasBegin && !hasEnd) {
        s = `${s}\n\\end{tikzpicture}`;
      } else if (!hasBegin && !hasEnd) {
        s = `\\begin{tikzpicture}\n${s}\n\\end{tikzpicture}`;
      }

      return s;
    };

    const finalCode = sanitize(tikzCode);

    return `\\documentclass[tikz,border=10pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,patterns,angles,quotes}
\\usepackage{amsmath,amssymb}

\\begin{document}
${finalCode}
\\end{document}`;
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(basePath) {
    const extensions = ['.tex', '.dvi', '.svg', '.aux', '.log'];
    const cleanupPromises = extensions.map(ext =>
      unlink(`${basePath}${ext}`).catch(() => {})
    );
    await Promise.all(cleanupPromises);
  }

  /**
   * Normalize SVG viewBox to start at (0, 0)
   * This fixes rendering issues where negative viewBox coordinates cause blank SVGs
   * @param {string} svgContent - Raw SVG content
   * @returns {string} - Normalized SVG content
   */
  normalizeSVGViewBox(svgContent) {
    // Match viewBox attribute
    const viewBoxMatch = svgContent.match(/viewBox=['"]([^'"]+)['"]/);
    if (!viewBoxMatch) return svgContent;

    const viewBoxValues = viewBoxMatch[1].split(/\s+/).map(parseFloat);
    if (viewBoxValues.length !== 4) return svgContent;

    const [minX, minY, width, height] = viewBoxValues;
    
    // dvisvgm with --exact-bbox should calculate correct bounds,
    // but we normalize to (0,0) origin and add 10% padding for safety
    const shiftX = -minX;
    const shiftY = -minY;
    
    // Add 10% padding to ensure all content is visible
    const padding = 0.1;
    const newWidth = width * (1 + padding);
    const newHeight = height * (1 + padding);

    // Update viewBox to start at (0, 0) with expanded dimensions
    svgContent = svgContent.replace(
      /viewBox=['"][^'"]+['"]/,
      `viewBox="0 0 ${newWidth.toFixed(6)} ${newHeight.toFixed(6)}"`
    );

    // Update width and height attributes in <svg> tag only (not stroke-width)
    svgContent = svgContent.replace(
      /(<svg[^>]*\s)width=['"][^'"]+['"]/,
      `$1width="${newWidth.toFixed(2)}pt"`
    );
    svgContent = svgContent.replace(
      /(<svg[^>]*\s)height=['"][^'"]+['"]/,
      `$1height="${newHeight.toFixed(2)}pt"`
    );

    // Add or update transform on <g id='page1'> element
    const transform = `translate(${shiftX.toFixed(6)}, ${shiftY.toFixed(6)})`;
    
    const gHasTransform = /<g\s+id=['"]page1['"]\s+transform=/.test(svgContent);
    if (gHasTransform) {
      svgContent = svgContent.replace(
        /<g\s+id=['"]page1['"]\s+transform=['"][^'"]*['"]/,
        `<g id='page1' transform='${transform}'`
      );
    } else {
      svgContent = svgContent.replace(
        /<g\s+id=['"]page1['"]/,
        `<g id='page1' transform='${transform}'`
      );
    }

    console.log(`📐 Normalized SVG: shift [${shiftX.toFixed(2)}, ${shiftY.toFixed(2)}], viewBox [0, 0, ${newWidth.toFixed(2)}, ${newHeight.toFixed(2)}]`);
    return svgContent;
  }

  /**
   * Extract TikZ blocks from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<{original: string, tikz: string}>}
   */
  extractTikzBlocks(content) {
    // Match multiple patterns:
    // 1. ```tikz...``` (case insensitive)
    // 2. Standalone \begin{tikzpicture}...\end{tikzpicture}
    const blocks = [];
    
    // Pattern 1: Code blocks with tikz/latex marker (case insensitive, handles incomplete blocks)
    // Accept both ```tikz and ```latex since AI may use either
    const codeBlockRegex = /```\s*(?:tikz|latex)\s*([\s\S]*?)(?:```|$)/gi;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const tikzCode = match[1].trim();
      // Only process if it contains tikzpicture or documentclass with tikz
      if (tikzCode && tikzCode.length > 0 && 
          (tikzCode.includes('tikzpicture') || tikzCode.includes('documentclass'))) {
        blocks.push({
          original: match[0],
          tikz: tikzCode
        });
      }
    }
    
    // Pattern 2: Standalone tikzpicture environments (not in code blocks)
    // Remove already-matched code blocks to avoid double-processing
    let contentWithoutCodeBlocks = content.replace(/```\s*(?:tikz|latex)[\s\S]*?```/gi, '');
    
    const standaloneRegex = /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g;
    while ((match = standaloneRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const tikzCode = match[0];
      if (tikzCode && tikzCode.length > 0) {
        blocks.push({
          original: match[0],
          tikz: tikzCode
        });
      }
    }

    return blocks;
  }
}

export default new TikzService();
