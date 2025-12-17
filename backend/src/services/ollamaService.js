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
    this.commonPrompt = null;
    this.tikzPrompt = null;
  }

  async initialize() {
    try {
      const commonPath = join(__dirname, 'promptTemplates', 'common-prompt.txt');
      const tikzPath = join(__dirname, 'promptTemplates', 'tikz-prompt.txt');
      
      this.commonPrompt = await fs.readFile(commonPath, 'utf-8');
      this.tikzPrompt = await fs.readFile(tikzPath, 'utf-8');
      
      console.log('✅ System prompts loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load system prompts:', error.message);
      this.commonPrompt = 'Bạn là một trợ lý toán học chuyên nghiệp.';
      this.tikzPrompt = '';
    }
  }

  // Detect if user message needs TikZ (geometry, graphs, tables)
  needsTikz(message) {
    const tikzKeywords = [
      'hình', 'vẽ', 'đồ thị', 'biểu đồ', 'đường', 'góc', 'tam giác', 'tứ giác', 
      'đường tròn', 'elip', 'parabol', 'hyperbol', 'đa giác', 'trục tọa độ',
      'bảng biến thiên', 'bảng xét dấu', 'minh họa', 'mô tả hình',
      'geometry', 'graph', 'plot', 'draw', 'diagram', 'table', 'chart'
    ];
    
    const lowerMessage = message.toLowerCase();
    return tikzKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async chat(userMessage, onStream, abortSignal, selectedModel = null, apiKey = null) {
    const modelToUse = selectedModel || this.model;
    
    // Cloud models are called through local Ollama (after ollama pull)
    // No need for separate API endpoint or authentication
    if (modelToUse.includes(':cloud')) {
      console.log('☁️ Using cloud model via local Ollama');
    }
    
    // Build system prompt: common + tikz (if needed)
    const useTikz = this.needsTikz(userMessage);
    const systemPrompt = useTikz 
      ? `${this.commonPrompt}\n\n${this.tikzPrompt}`
      : this.commonPrompt;
    
    if (useTikz) {
      console.log('🎨 TikZ prompt added for visualization');
    }
    
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/chat`,
        {
          model: modelToUse,
          messages: [
            {
              role: 'system',
              content: systemPrompt
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
      throw new Error('Failed to communicate with AI');
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
