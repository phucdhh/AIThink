import ollamaService from '../services/ollamaService.js';
import tikzService from '../services/tikzService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load AI config
let aiConfig;
try {
  aiConfig = JSON.parse(readFileSync(join(__dirname, 'ai.conf'), 'utf-8'));
} catch (err) {
  console.error('Failed to load ai.conf:', err.message);
  aiConfig = { defaultModel: 'deepseek-r1:8b', models: [] };
}

// Track active requests per socket to ensure cleanup
const activeRequests = new Map();

export const chatHandler = async (socket, queueService) => {
  const socketId = socket.id;
  
  // Send available models to client
  socket.emit('models:list', { 
    models: aiConfig.models, 
    defaultModel: aiConfig.defaultModel 
  });
  
  socket.on('chat:message', async (data) => {
    const { message, model, image } = data;

    if (!message || typeof message !== 'string') {
      socket.emit('chat:error', { error: 'Invalid message' });
      return;
    }

    try {
      // Send queue status
      const queueStatus = queueService.getStatus();
      socket.emit('queue:status', queueStatus);

      // Create abort controller for this request
      const abortController = new AbortController();
      activeRequests.set(socketId, abortController);

      // Add to queue
      await queueService.addToQueue(async () => {
        socket.emit('chat:start', { message: 'Processing your request...' });

        let fullResponse = '';
        let lastTikzCheckLength = 0;

        // Get selected model or use default
        // If image is provided, force qwen3-vl:235b-cloud
        const selectedModel = image ? 'qwen3-vl:235b-cloud' : (model || aiConfig.defaultModel);
        const selectedModelInfo = aiConfig.models.find(m => m.id === selectedModel);
        const apiKey = selectedModelInfo?.type === 'cloud' ? aiConfig.apiKey : null;
        
        console.log(`🤖 Using model: ${selectedModel} (${selectedModelInfo?.type || 'local'})`);
        if (image) {
          console.log('📷 Image attached, using vision model');
        }

        try {
          await ollamaService.chat(message, async (chunk, type) => {
            // Check if aborted
            if (abortController?.signal.aborted) {
              throw new Error('Request aborted by user');
            }
            
            // Accumulate full response
            if (type === 'content') {
              fullResponse += chunk;
              
              // Check for complete TikZ blocks after accumulating enough content
              // Only check every 500 chars to avoid excessive processing
              if (fullResponse.length - lastTikzCheckLength > 500) {
                lastTikzCheckLength = fullResponse.length;
                
                // Look for complete TikZ blocks (with closing ```)
                const completeTikzRegex = /```\s*tikz\s*([\s\S]*?)```/gi;
                const matches = [...fullResponse.matchAll(completeTikzRegex)];
                
                if (matches.length > 0) {
                  console.log(`🎨 Found ${matches.length} complete TikZ block(s) during streaming`);
                  
                  // Compile the last complete block
                  const lastMatch = matches[matches.length - 1];
                  const tikzCode = lastMatch[1].trim();
                  
                  if (tikzCode.length > 50) { // Only compile if substantial content
                    try {
                      console.log('🔨 Compiling TikZ block during stream, length:', tikzCode.length);
                      const svg = await tikzService.compileToSVG(tikzCode);
                      console.log(`✅ TikZ compiled successfully, SVG length: ${svg.length}`);
                      
                      // Replace TikZ with SVG in fullResponse
                      fullResponse = fullResponse.replace(lastMatch[0], `\`\`\`svg\n${svg}\n\`\`\``);
                      
                      // Send updated content immediately with original TikZ code
                      console.log('📤 Emitting chat:tikz-compiled event (during stream)');
                      socket.emit('chat:tikz-compiled', { 
                        content: fullResponse,
                        tikzCode: tikzCode 
                      });
                      
                      // Reset check length to avoid re-processing
                      lastTikzCheckLength = fullResponse.length;
                    } catch (tikzError) {
                      console.error('❌ TikZ compilation error during stream:', tikzError.message);
                    }
                  }
                }
              }
            }
            
            // Stream response back to client with type (thinking or content)
            if (type === 'thinking') {
              socket.emit('chat:thinking', { content: chunk });
            } else {
              socket.emit('chat:content', { content: chunk });
            }
          }, abortController.signal, selectedModel, apiKey, image);

          // Post-process: Check for any remaining uncompiled TikZ blocks
          // (in case they weren't caught during streaming)
          const remainingTikzBlocks = tikzService.extractTikzBlocks(fullResponse);
          console.log(`🎨 Final check: Found ${remainingTikzBlocks.length} TikZ blocks`);
          
          if (remainingTikzBlocks.length > 0) {
            let updatedResponse = fullResponse;
            let hasSuccessfulCompilation = false;
            let compiledTikzCodes = [];
            
            for (const block of remainingTikzBlocks) {
              // Skip if already converted to SVG
              if (block.original.includes('```svg')) {
                continue;
              }
              
              try {
                console.log('🔨 Compiling remaining TikZ block, length:', block.tikz.length);
                const svg = await tikzService.compileToSVG(block.tikz);
                console.log(`✅ TikZ compiled successfully, SVG length: ${svg.length}`);
                
                // Replace TikZ code with SVG in response
                const replacement = `\`\`\`svg\n${svg}\n\`\`\``;
                updatedResponse = updatedResponse.replace(block.original, replacement);
                hasSuccessfulCompilation = true;
                compiledTikzCodes.push(block.tikz);
              } catch (tikzError) {
                console.error('❌ TikZ compilation error:', tikzError.message);
                // Add error message after the block
                const errorMsg = `\n\n⚠️ *Lỗi compile TikZ*`;
                if (!block.original.endsWith('```')) {
                  // If block is incomplete, close it properly
                  updatedResponse = updatedResponse.replace(block.original, block.original + '\n```' + errorMsg);
                }
              }
            }
            
            // Only emit updated content if we had successful compilations
            if (hasSuccessfulCompilation) {
              console.log('📤 Emitting chat:tikz-compiled event (final)');
              socket.emit('chat:tikz-compiled', { 
                content: updatedResponse,
                tikzCode: compiledTikzCodes[0] || null // Send first TikZ code
              });
            }
          }

          socket.emit('chat:end', { message: 'Response completed' });
        } catch (error) {
          if (error.message === 'Request aborted by user') {
            console.log('⏹️ Request stopped by user');
            socket.emit('chat:end', { message: 'Stopped by user' });
          } else {
            throw error;
          }
        } finally {
          activeRequests.delete(socketId);
        }
      });
    } catch (error) {
      console.error('❌ Chat error:', error.message, error.stack);
      
      // More detailed error message
      let errorMessage = 'Failed to communicate with AI';
      if (error.response) {
        console.error('API Response Error:', error.response.status, error.response.data);
        errorMessage = `AI Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      socket.emit('chat:error', { error: errorMessage });
      activeRequests.delete(socketId);
    }
  });

  socket.on('chat:stop', () => {
    console.log('🛑 Stop signal received for socket:', socketId);
    const abortController = activeRequests.get(socketId);
    if (abortController) {
      abortController.abort();
      activeRequests.delete(socketId);
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socketId, '- aborting any ongoing requests');
    const abortController = activeRequests.get(socketId);
    if (abortController) {
      console.log('🔴 Aborting active request for disconnected socket:', socketId);
      abortController.abort();
      activeRequests.delete(socketId);
    }
  });

  socket.on('queue:status', () => {
    const status = queueService.getStatus();
    socket.emit('queue:status', status);
  });
};
