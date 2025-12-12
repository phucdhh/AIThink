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

      // Compile LaTeX → DVI
      await execAsync(`latex -interaction=nonstopmode -output-directory=${this.tmpDir} ${texFile}`, {
        timeout: 10000
      });

      // Convert DVI → SVG using dvisvgm
      await execAsync(`dvisvgm --no-fonts --exact --output=${svgFile} ${dviFile}`, {
        timeout: 10000
      });

      // Read SVG content
      const svgContent = await readFile(svgFile, 'utf-8');

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
   */
  wrapTikzCode(tikzCode) {
    return `\\documentclass[tikz,border=2pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,patterns,angles,quotes}
\\usepackage{amsmath,amssymb}

\\begin{document}
${tikzCode}
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
   * Extract TikZ blocks from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<{original: string, tikz: string}>}
   */
  extractTikzBlocks(content) {
    const tikzRegex = /```tikz\s*([\s\S]*?)```/gi;
    const blocks = [];
    let match;

    while ((match = tikzRegex.exec(content)) !== null) {
      blocks.push({
        original: match[0],
        tikz: match[1].trim()
      });
    }

    return blocks;
  }
}

export default new TikzService();
