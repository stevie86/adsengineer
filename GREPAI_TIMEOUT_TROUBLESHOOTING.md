# GrepAI Timeout Troubleshooting Guide

**Quick Reference for Timeout Issues**

---

## Problem: "Request Timeout" or "Ollama Connection Timeout"

### Root Cause
GrepAI doesn't have built-in client timeout settings. Timeouts occur at the **Ollama server level**, not in GrepAI config.

### Solution Checklist

#### 1. Verify Ollama is Running
```bash
curl http://localhost:11434/api/tags
```

**Expected:** JSON list of available models  
**If fails:** Start Ollama
```bash
ollama serve
```

#### 2. Check Ollama Endpoint in GrepAI Config
```yaml
# .grepai/config.yaml
embedder:
  endpoint: http://localhost:11434  # Must match Ollama server
```

#### 3. Increase Ollama Server Timeout
**Option A: Environment Variable (Temporary)**
```bash
export OLLAMA_REQUEST_TIMEOUT=300  # 300 seconds
ollama serve
```

**Option B: Ollama Config File (Permanent)**
```bash
# macOS
~/.ollama/config.yaml

# Linux
/etc/ollama/config.yaml

# Windows
%APPDATA%\ollama\config.yaml
```

Add:
```yaml
ollama:
  request_timeout: 300.0  # seconds
```

#### 4. Optimize GrepAI for Faster Embedding
```yaml
# .grepai/config.yaml

# Reduce chunk size (faster embedding)
chunking:
  size: 256      # was 512
  overlap: 25    # was 50

# Reduce indexing frequency
watch:
  debounce_ms: 1000  # was 500

# Use faster model
embedder:
  model: all-minilm  # faster than nomic-embed-text
```

#### 5. Check Ollama Model Performance
```bash
# List loaded models
ollama list

# Check model size and speed
# Smaller/faster models: all-minilm, nomic-embed-text
# Larger/slower models: bge-m3, mxbai-embed-large
```

---

## Timeout Scenarios

### Scenario 1: Initial Indexing Timeout
**Symptom:** Timeout when running `grepai watch` on large codebase

**Solution:**
```yaml
chunking:
  size: 256      # Smaller chunks
  overlap: 25

watch:
  debounce_ms: 2000  # Less frequent updates
```

### Scenario 2: Search Timeout
**Symptom:** `grepai search` times out

**Solution:**
```bash
# Ensure Ollama is responsive
curl http://localhost:11434/api/tags

# Restart Ollama with longer timeout
export OLLAMA_REQUEST_TIMEOUT=300
ollama serve
```

### Scenario 3: RPG Feature Timeout
**Symptom:** Timeout when using RPG (call graph) feature

**Solution:**
```yaml
rpg:
  enabled: true
  llm_timeout_ms: 30000  # Increase from 8000 (8 seconds)
```

### Scenario 4: Remote Ollama Timeout
**Symptom:** Timeout connecting to remote Ollama server

**Solution:**
```yaml
embedder:
  endpoint: http://remote-host:11434  # Verify IP/hostname
  
# Also check network connectivity
ping remote-host
curl http://remote-host:11434/api/tags
```

---

## Performance Tuning Matrix

| Issue | Cause | Fix |
|-------|-------|-----|
| Slow embedding | Large chunks | Reduce `chunking.size` to 256 |
| Frequent timeouts | Ollama timeout too short | Increase `OLLAMA_REQUEST_TIMEOUT` |
| High CPU usage | Too many parallel requests | Reduce `embedder.parallelism` |
| Large index | High overlap | Reduce `chunking.overlap` to 25 |
| Slow indexing | Frequent re-indexing | Increase `watch.debounce_ms` |
| Memory issues | Large model | Switch to `all-minilm` model |

---

## Configuration Presets

### Conservative (Slow but Reliable)
```yaml
embedder:
  model: all-minilm
  endpoint: http://localhost:11434

chunking:
  size: 256
  overlap: 25

watch:
  debounce_ms: 2000

search:
  hybrid:
    enabled: false
```

### Balanced (Default)
```yaml
embedder:
  model: nomic-embed-text
  endpoint: http://localhost:11434

chunking:
  size: 512
  overlap: 50

watch:
  debounce_ms: 500

search:
  hybrid:
    enabled: false
```

### Aggressive (Fast but Resource-Heavy)
```yaml
embedder:
  model: bge-m3
  endpoint: http://localhost:11434

chunking:
  size: 1024
  overlap: 100

watch:
  debounce_ms: 200

search:
  hybrid:
    enabled: true
    k: 60
```

---

## Environment Variables

```bash
# Ollama timeout (seconds)
export OLLAMA_REQUEST_TIMEOUT=300

# Ollama endpoint
export OLLAMA_ENDPOINT=http://localhost:11434

# GrepAI config override (if supported)
export GREPAI_EMBEDDER_PROVIDER=ollama
export GREPAI_STORE_BACKEND=gob
```

---

## Debugging Commands

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Test embedding performance
curl -X POST http://localhost:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","input":"test"}'

# Check GrepAI status
grepai status

# View GrepAI config
cat .grepai/config.yaml

# Rebuild index (fresh start)
rm -rf .grepai/index.gob
grepai watch
```

---

## When to Contact Support

If timeouts persist after trying above solutions:

1. **Collect diagnostics:**
   ```bash
   grepai status
   curl http://localhost:11434/api/tags
   cat .grepai/config.yaml
   ```

2. **Check Ollama logs:**
   ```bash
   # macOS
   log stream --predicate 'process == "ollama"'
   
   # Linux
   journalctl -u ollama -f
   ```

3. **Report to GrepAI:** https://github.com/yoanbernabeu/grepai/issues

---

## Key Points

✅ **Timeouts are at Ollama level, not GrepAI level**  
✅ **Increase `OLLAMA_REQUEST_TIMEOUT` environment variable**  
✅ **Reduce chunk size for faster embedding**  
✅ **Use faster models for large codebases**  
✅ **Increase watch debounce to reduce indexing frequency**  
❌ **Don't modify GrepAI config expecting timeout changes**  
❌ **Don't use very large chunk sizes (>2048) without reason**
