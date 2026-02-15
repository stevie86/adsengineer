# GrepAI Configuration Quick Reference Card

## 🎯 Your Questions Answered

### 1️⃣ Timeout Configuration Options

| Setting | Location | Default | Purpose |
|---------|----------|---------|---------|
| **RPG LLM Timeout** | `rpg.llm_timeout_ms` | 8000 ms | Timeout for LLM-based feature extraction |
| **Ollama Timeout** | `OLLAMA_REQUEST_TIMEOUT` env var | 120 s | Server-side timeout (NOT in config) |
| **Client Timeout** | ❌ NOT AVAILABLE | — | GrepAI doesn't expose this |

**Key:** Timeouts happen at **Ollama level**, not GrepAI level.

---

### 2️⃣ Embedding Batch Size Settings

```yaml
embedder:
  parallelism: 4  # Concurrent requests (OpenAI only, default: 4)

chunking:
  size: 512       # Tokens per chunk (default: 512)
  overlap: 50     # Overlap between chunks (default: 50)
```

| Setting | Applies To | Effect |
|---------|-----------|--------|
| `parallelism` | OpenAI only | Controls concurrent API requests |
| `chunking.size` | All providers | Smaller = faster, Larger = better context |
| `chunking.overlap` | All providers | Higher = better continuity, larger index |

---

### 3️⃣ Ollama-Specific Configuration

```yaml
embedder:
  provider: ollama
  model: nomic-embed-text        # Fast, good quality
  endpoint: http://localhost:11434
  dimensions: 768                # Auto-set for Ollama
  parallelism: 0                 # Ignored for Ollama
```

**Recommended Models:**
- `nomic-embed-text` - Default, fast, English
- `nomic-embed-text-v2-moe` - Multilingual (~100 languages)
- `bge-m3` - High quality, multilingual
- `all-minilm` - Very fast, lower quality

---

### 4️⃣ Performance Tuning Options

```yaml
watch:
  debounce_ms: 500              # File change debounce (ms)
  rpg_persist_interval_ms: 1000 # RPG persistence interval
  rpg_derived_debounce_ms: 300  # RPG derived symbol debounce

trace:
  mode: fast                    # "fast" (regex) or "precise" (tree-sitter)

search:
  boost:
    enabled: true              # Boost/penalize by file path
  hybrid:
    enabled: false             # Combine vector + text search

store:
  backend: gob                 # "gob" | "postgres" | "qdrant"
```

**Performance Impact:**
- ⚡ **Reduce `chunking.size`** → Faster embedding
- ⚡ **Increase `watch.debounce_ms`** → Less frequent indexing
- ⚡ **Use `trace.mode: fast`** → Faster symbol extraction
- ⚡ **Disable `search.hybrid`** → Faster search
- 🚀 **Use `store.backend: qdrant`** → Highest performance

---

### 5️⃣ Ways to Increase Client Timeout

#### ✅ Method 1: Ollama Server Timeout (BEST)
```bash
export OLLAMA_REQUEST_TIMEOUT=300  # 300 seconds
ollama serve
```

#### ✅ Method 2: RPG LLM Timeout
```yaml
rpg:
  enabled: true
  llm_timeout_ms: 30000  # 30 seconds (default: 8000)
```

#### ✅ Method 3: Optimize for Speed
```yaml
chunking:
  size: 256      # Smaller chunks = faster embedding
  overlap: 25

watch:
  debounce_ms: 1000  # Less frequent indexing

embedder:
  model: all-minilm  # Faster model
```

#### ✅ Method 4: Reduce Parallelism (OpenAI)
```yaml
embedder:
  parallelism: 2  # Reduce from 4 to avoid rate limits
```

#### ❌ Method 5: Direct GrepAI Config
**NOT POSSIBLE** - GrepAI doesn't expose client timeout settings.

---

## 📊 Configuration Presets

### 🐢 Conservative (Reliable)
```yaml
embedder:
  model: all-minilm
chunking:
  size: 256
  overlap: 25
watch:
  debounce_ms: 2000
search:
  hybrid:
    enabled: false
```

### ⚖️ Balanced (Default)
```yaml
embedder:
  model: nomic-embed-text
chunking:
  size: 512
  overlap: 50
watch:
  debounce_ms: 500
search:
  hybrid:
    enabled: false
```

### 🚀 Aggressive (Fast)
```yaml
embedder:
  model: bge-m3
chunking:
  size: 1024
  overlap: 100
watch:
  debounce_ms: 200
search:
  hybrid:
    enabled: true
```

---

## 🔧 Troubleshooting Checklist

- [ ] Ollama running? `curl http://localhost:11434/api/tags`
- [ ] Correct endpoint? `embedder.endpoint: http://localhost:11434`
- [ ] Timeout set? `export OLLAMA_REQUEST_TIMEOUT=300`
- [ ] Chunk size optimized? `chunking.size: 256` for large codebases
- [ ] Watch debounce increased? `watch.debounce_ms: 1000`
- [ ] Using fast model? `embedder.model: all-minilm`
- [ ] Hybrid search disabled? `search.hybrid.enabled: false`

---

## 📝 Current Project Config

**File:** `.grepai/config.yaml`

```yaml
version: 1
embedder:
  provider: ollama
  model: nomic-embed-text
  endpoint: http://localhost:11434
  dimensions: 768
  parallelism: 0
chunking:
  size: 512
  overlap: 50
watch:
  debounce_ms: 500
search:
  boost:
    enabled: true
  hybrid:
    enabled: false
trace:
  mode: fast
store:
  backend: gob
```

---

## 🎓 Key Concepts

| Concept | Meaning | Impact |
|---------|---------|--------|
| **Chunk** | Text segment sent to embedder | Smaller = faster, Larger = better context |
| **Parallelism** | Concurrent API requests | OpenAI only, affects rate limits |
| **Debounce** | Delay before re-indexing | Higher = less frequent updates |
| **Boost** | Score adjustment by path | Affects search ranking, not performance |
| **Hybrid** | Vector + text search | Slower but more comprehensive |
| **RPG** | Relationship Pattern Graph | Call graph analysis, optional feature |

---

## 🚨 Critical Findings

1. **GrepAI has NO client-side timeout setting** ❌
   - Timeouts are at Ollama level
   - Use `OLLAMA_REQUEST_TIMEOUT` environment variable

2. **Parallelism only works with OpenAI** ⚠️
   - Ollama/LM Studio ignore this setting
   - Default: 4 concurrent requests

3. **Chunking is the main performance lever** 🎯
   - Reduce size for faster embedding
   - Increase size for better context

4. **RPG feature is disabled by default** 📌
   - Has its own LLM timeout setting
   - Only applies when explicitly enabled

5. **Storage backend doesn't affect timeout** 📦
   - GOB: Single dev, fast
   - PostgreSQL: Teams, scalable
   - Qdrant: Enterprise, high performance

---

## 📚 Documentation Files

1. **GREPAI_CONFIG_EXPLORATION.md** - Comprehensive guide (582 lines)
2. **GREPAI_TIMEOUT_TROUBLESHOOTING.md** - Troubleshooting guide (284 lines)
3. **GREPAI_CONFIG_SUMMARY.txt** - Executive summary (108 lines)
4. **GREPAI_QUICK_REFERENCE.md** - This file

---

## 🔗 Resources

- **GitHub:** https://github.com/yoanbernabeu/grepai
- **Docs:** https://yoanbernabeu.github.io/grepai/
- **Config Source:** https://github.com/yoanbernabeu/grepai/blob/main/config/config.go
- **Local Config:** `.grepai/config.yaml`

---

**Generated:** 2026-02-13  
**Status:** ✅ Complete exploration of all 5 questions
