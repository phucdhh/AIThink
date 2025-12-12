import ollamaService from '../services/ollamaService.js';
import tikzService from '../services/tikzService.js';

// Track active requests per socket to ensure cleanup
const activeRequests = new Map();

export const chatHandler = async (socket, queueService) => {
  const socketId = socket.id;
  
  socket.on('chat:message', async (data) => {
    const { message } = data;

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

        try {
          await ollamaService.chat(message, (chunk, type) => {
            // Check if aborted
            if (abortController?.signal.aborted) {
              throw new Error('Request aborted by user');
            }
            
            // Accumulate full response
            if (type === 'content') {
              fullResponse += chunk;
            }
            
            // Stream response back to client with type (thinking or content)
            if (type === 'thinking') {
              socket.emit('chat:thinking', { content: chunk });
            } else {
              socket.emit('chat:content', { content: chunk });
            }
          }, abortController.signal);

          // Post-process: Compile TikZ blocks to SVG
          const tikzBlocks = tikzService.extractTikzBlocks(fullResponse);
          if (tikzBlocks.length > 0) {
            for (const block of tikzBlocks) {
              try {
                const svg = await tikzService.compileToSVG(block.tikz);
                // Replace TikZ code with SVG in response
                fullResponse = fullResponse.replace(block.original, `\`\`\`svg\n${svg}\n\`\`\``);
              } catch (tikzError) {
                console.error('TikZ compilation error:', tikzError.message);
                // Keep original TikZ code if compilation fails
              }
            }
            // Send updated response with SVG
            socket.emit('chat:tikz-compiled', { content: fullResponse });
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
      console.error('Chat error:', error);
      socket.emit('chat:error', { error: error.message });
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
