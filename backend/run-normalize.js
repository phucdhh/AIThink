import tikzService from './src/services/tikzService.js';
import { readFile } from 'fs/promises';

async function run() {
  try {
    const input = await readFile(process.argv[2], 'utf8');
    const out = tikzService.normalizeSVGViewBox(input);
    console.log(out);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
