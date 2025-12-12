import axios from 'axios';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class OllamaService {
  constructor() {
    this.apiUrl = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
    this.model = process.env.OLLAMA_MODEL || 'deepseek-r1:8b';
    this.systemPrompt = null;
  }

  async initialize() {
    try {
      const promptPath = join(__dirname, 'promptTemplates', 'system_tutor_role.txt');
      this.systemPrompt = await fs.readFile(promptPath, 'utf-8');
      console.log('✅ System prompt loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load system prompt:', error.message);
      this.systemPrompt = 'Bạn là một gia sư toán học chuyên nghiệp.';
    }
  }

  async chat(userMessage, onStream, abortSignal) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/chat`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          stream: true
        },
        {
          responseType: 'stream',
          signal: abortSignal
        }
      );

      return new Promise((resolve, reject) => {
        let fullResponse = '';
        let stopped = false;

        // Handle abort signal
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            stopped = true;
            response.data.destroy();
            reject(new Error('Request aborted by user'));
          });
        }

        response.data.on('data', (chunk) => {
          if (stopped) return;

          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (stopped) break;

            try {
              const json = JSON.parse(line);
              
              // Handle thinking tokens (Chain of Thought)
              if (json.message?.thinking) {
                fullResponse += json.message.thinking;
                if (onStream && !stopped) {
                  onStream(json.message.thinking, 'thinking');
                }
              }
              
              // Handle content tokens
              if (json.message?.content) {
                fullResponse += json.message.content;
                if (onStream && !stopped) {
                  onStream(json.message.content, 'content');
                }
              }
              
              if (json.done) {
                resolve(fullResponse);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        });

        response.data.on('error', (error) => {
          if (!stopped) {
            reject(error);
          }
        });

        response.data.on('end', () => {
          if (!stopped) {
            resolve(fullResponse);
          }
        });
      });
    } catch (error) {
      if (error.code === 'ERR_CANCELED' || error.message.includes('aborted')) {
        throw new Error('Request aborted by user');
      }
      console.error('❌ Ollama API error:', error.message);
      throw new Error('Failed to communicate with Ollama');
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new OllamaService();
