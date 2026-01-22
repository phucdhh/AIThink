# Ollama Optimizations

## Performance Settings

AIThink sử dụng các tối ưu hóa sau cho Ollama:

### 1. Flash Attention
- **Variable:** `OLLAMA_FLASH_ATTENTION=1`
- **Lợi ích:** Xử lý context dài nhanh hơn và tiết kiệm RAM
- **Phù hợp:** Models với context length lớn (>8K tokens)

### 2. KV Cache Quantization
- **Variable:** `OLLAMA_KV_CACHE_TYPE=q8_0`
- **Lợi ích:** Giảm 50-60% dung lượng bộ nhớ cho KV cache
- **Phù hợp:** Hội thoại dài, nhiều turns

## Usage

### Start Ollama với optimizations:
```bash
./start-ollama.sh
```

### Check optimizations:
```bash
./status.sh
```

Output sẽ hiển thị:
```
🔹 Ollama (port 11434):
   ✅ Ollama is running (version: 0.14.3)
   ⚡ Flash Attention: enabled
   💾 KV Cache: q8_0 (optimized)
```

## Requirements

- Ollama version: **0.14.3** or higher
- Models: Hỗ trợ tất cả models, đặc biệt hiệu quả với:
  - deepseek-r1:8b (thinking model)
  - Models với context length > 32K

## Performance Impact

### Memory Usage:
- **Without optimization:** ~2GB RAM cho 32K context
- **With optimization:** ~800MB-1GB RAM

### Speed:
- **Flash Attention:** +30-40% faster với long context
- **KV Cache q8_0:** Minimal speed impact (~5% slower)

## Notes

- Các optimizations được áp dụng khi start Ollama
- Cần restart Ollama để thay đổi có hiệu lực
- Backend AIThink không cần restart khi thay đổi Ollama settings
