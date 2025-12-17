# AI Model Configuration

## Overview
AIThink supports multiple AI models through Ollama, including both local and cloud models.

## Configuration File
Location: `backend/src/api/ai.conf`

### Format
```json
{
  "apiKey": "your-ollama-api-key",
  "models": [
    {
      "id": "model-id",
      "name": "Display Name",
      "type": "local|cloud",
      "endpoint": "http://localhost:11434",
      "description": "Model description"
    }
  ],
  "defaultModel": "default-model-id"
}
```

### Current Models

1. **DeepSeek R1 8B (Local)** - Default
   - Fast local reasoning model
   - Best for quick responses
   - No API costs

2. **DeepSeek V3.2 (Cloud)**
   - Enhanced capabilities
   - Better for complex problems
   - Requires Ollama Cloud API key

3. **GPT OSS 120B (Cloud)**
   - Large open-source model
   - Best for advanced reasoning
   - Requires Ollama Cloud API key

4. **Gemini 3 Pro (Cloud)**
   - Google's latest model
   - Strong multimodal capabilities
   - Requires Ollama Cloud API key

## Adding New Models

1. Open `backend/src/api/ai.conf`
2. Add new model to the `models` array:
```json
{
  "id": "new-model-id",
  "name": "New Model Name",
  "type": "local",
  "endpoint": "http://localhost:11434",
  "description": "Your description"
}
```
3. Restart backend: `pm2 restart aithink-backend`

## API Key Setup

1. Get API key from [Ollama Cloud](https://ollama.com/cloud)
2. Update `apiKey` in `ai.conf`
3. Restart backend

## Usage

Users can select models from the dropdown in the chat interface. All models use the same system prompt from `system_tutor_role.txt` to ensure consistency.

## Environment Variables

You can also set the default model via environment variable:
```bash
OLLAMA_MODEL=deepseek-r1:8b
```

This will be overridden by user selection in the UI.
