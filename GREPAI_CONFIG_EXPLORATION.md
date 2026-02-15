# GrepAI Configuration File Format & Options

**Last Updated:** 2026-02-13  
**GrepAI Version:** Latest (from yoanbernabeu/grepai)  
**Local Config:** `.grepai/config.yaml`

---

## Executive Summary

GrepAI's configuration is stored in `.grepai/config.yaml` (YAML format, version 1). The configuration supports multiple embedders (Ollama, LM Studio, OpenAI), storage backends (GOB, PostgreSQL, Qdrant), and performance tuning options.

**Key Finding:** GrepAI does NOT have explicit client-side timeout configuration in the config file. Timeouts are handled at the Ollama/embedder level, not in GrepAI itself.

---

## 1. Timeout Configuration Options

### ❌ GrepAI-Level Timeouts
**NOT AVAILABLE** in `.grepai/config.yaml`. GrepAI does not expose client-side timeout settings.

### ✅ Ollama-Level Timeouts (Embedder)
Timeouts are controlled at the **Ollama server level**, not in GrepAI config:

```yaml
# In Ollama's configuration (NOT in grepai config.yaml)
ollama:
  request_timeout: 120.0  # Time in seconds until Ollama times out
```

**Default:** 120 seconds (2 minutes)

### ✅ RPG (Relationship Pattern Graph) LLM Timeout
If using RPG feature with LLM:

```yaml
rpg:
  llm_timeout_ms: 8000  # Milliseconds (default: 8000 = 8 seconds)
```

**Default:** 8000 ms (8 seconds)  
**Valid Range:** Any positive integer  
**Use Case:** When RPG feature is enabled and using LLM for feature extraction

---

## 2. Embedding Batch Size Settings

### Parallelism (OpenAI Only)
```yaml
embedder:
  parallelism: 4  # Number of concurrent batch requests
```

**Details:**
- **Default:** 4 concurrent requests
- **Provider:** OpenAI ONLY (ignored for Ollama/LM Studio)
- **Auto-adjustment:** GrepAI automatically reduces parallelism on rate limit errors
- **Purpose:** Controls how many embedding requests are sent in parallel to OpenAI

**Note:** Ollama and LM Studio handle batching internally; this setting doesn't apply to them.

### Chunking Configuration
```yaml
chunking:
  size: 512      # Tokens per chunk
  overlap: 50    # Overlap between chunks
```

**Details:**
- **Size:** Maximum tokens per chunk (default: 512)
- **Overlap:** Tokens to overlap between consecutive chunks (default: 50)
- **Auto-rechunking:** If chunks exceed embedder's context limit, GrepAI automatically splits them (up to 3 attempts)

**Tuning Guide:**
| Setting | Effect | Trade-off |
|---------|--------|-----------|
| Larger chunks (1024+) | Better context, fewer results | Slower, larger index |
| Smaller chunks (256) | More precise matches, more results | Faster, smaller index |
| More overlap (100+) | Better continuity | Larger index |
| Less overlap (10) | Smaller index | Potential context loss |

---

## 3. Ollama-Specific Configuration

### Embedder Configuration
```yaml
embedder:
  provider: ollama
  model: nomic-embed-text
  endpoint: http://localhost:11434
  dimensions: 768
  parallelism: 0  # Ignored for Ollama
```

**Ollama Defaults:**
- **Provider:** `ollama`
- **Endpoint:** `http://localhost:11434` (auto-set if empty)
- **Dimensions:** 768 (auto-set for Ollama if empty)
- **Parallelism:** 4 (auto-set if ≤ 0, but ignored for Ollama)

### Recommended Ollama Models

| Model | Dimensions | Speed | Quality | Use Case |
|-------|-----------|-------|---------|----------|
| `nomic-embed-text` | 768 | Fast | Good | Default, English |
| `nomic-embed-text-v2-moe` | 768 | Fast | Good | **Multilingual** (~100 languages) |
| `bge-m3` | 1024 | Medium | Excellent | Multilingual, high quality |
| `mxbai-embed-large` | 1024 | Slow | Excellent | High quality, slower |
| `all-minilm` | 384 | Very Fast | Lower | Speed-critical |

### Ollama Connection Issues
If Ollama is not responding:

1. **Check Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Verify endpoint in config:**
   ```yaml
   embedder:
     endpoint: http://localhost:11434  # Must match Ollama server
   ```

3. **For remote Ollama:**
   ```yaml
   embedder:
     endpoint: http://remote-host:11434
   ```

---

## 4. Performance Tuning Options

### Watch Configuration (File Watching)
```yaml
watch:
  debounce_ms: 500  # Delay before re-indexing after file changes
  
  # RPG-specific watch settings
  rpg_persist_interval_ms: 1000        # How often to persist RPG data
  rpg_derived_debounce_ms: 300         # Debounce for derived symbols
  rpg_full_reconcile_interval_sec: 300 # Full reconciliation interval
  rpg_max_dirty_files_per_batch: 128   # Max files to process per batch
```

**Tuning Guide:**
- **Increase `debounce_ms`** (e.g., 1000) if indexing is too aggressive
- **Decrease `debounce_ms`** (e.g., 200) for faster index updates
- **Constraints:**
  - `rpg_persist_interval_ms` ≥ 200
  - `rpg_derived_debounce_ms` ≥ 100
  - `rpg_full_reconcile_interval_sec` ≥ 30
  - `rpg_max_dirty_files_per_batch` ≥ 1

### Trace Configuration (Symbol Extraction)
```yaml
trace:
  mode: fast  # "fast" (regex) or "precise" (tree-sitter)
  enabled_languages:
    - .go
    - .js
    - .ts
    - .jsx
    - .tsx
    - .py
    - .php
    - .c
    - .h
    - .cpp
    - .hpp
    - .cc
    - .cxx
    - .rs
    - .zig
    - .cs
    - .java
    - .pas
    - .dpr
  exclude_patterns:
    - '*_test.go'
    - '*.spec.ts'
    - '*.spec.js'
    - '*.test.ts'
    - '*.test.js'
    - '__tests__/*'
```

**Performance Impact:**
- **`mode: fast`** - Regex-based, faster, less accurate
- **`mode: precise`** - Tree-sitter based, slower, more accurate

### Search Boost Configuration
```yaml
search:
  boost:
    enabled: true
    penalties:
      - pattern: /tests/
        factor: 0.5
      - pattern: /mocks/
        factor: 0.4
    bonuses:
      - pattern: /src/
        factor: 1.1
      - pattern: /lib/
        factor: 1.1
```

**Effect:** Adjusts search result scores based on file paths (no performance impact, only ranking).

### Hybrid Search (Optional)
```yaml
search:
  hybrid:
    enabled: false
    k: 60  # RRF constant (Reciprocal Rank Fusion)
```

**Details:**
- **Disabled by default** (vector search only)
- **When enabled:** Combines vector similarity with text matching
- **Performance:** Slightly slower but more comprehensive results
- **k parameter:** Higher values (e.g., 100) weight vector results more heavily

### Storage Backend Performance

| Backend | Speed | Scalability | Setup | Best For |
|---------|-------|-------------|-------|----------|
| **GOB** | Fast | Single dev | None | Single developer, quick setup |
| **PostgreSQL** | Medium | Team | Docker | Teams, large codebases |
| **Qdrant** | Very Fast | Enterprise | Docker | High performance, teams |

```yaml
# GOB (default, file-based)
store:
  backend: gob

# PostgreSQL with pgvector
store:
  backend: postgres
  postgres:
    dsn: postgres://user:pass@localhost:5432/grepai

# Qdrant (high-performance)
store:
  backend: qdrant
  qdrant:
    endpoint: localhost
    port: 6334
    use_tls: false
```

---

## 5. Ways to Increase Client Timeout

### ❌ Direct GrepAI Config
**NOT POSSIBLE** - GrepAI doesn't expose client timeout settings in config.yaml.

### ✅ Workarounds

#### Option 1: Increase Ollama Server Timeout
Modify Ollama's configuration (NOT grepai config):

```bash
# Set environment variable before starting Ollama
export OLLAMA_REQUEST_TIMEOUT=300  # 300 seconds

# Or modify Ollama's config file
# ~/.ollama/config.yaml or /etc/ollama/config.yaml
ollama:
  request_timeout: 300.0
```

#### Option 2: Increase RPG LLM Timeout
If using RPG feature:

```yaml
rpg:
  enabled: true
  llm_timeout_ms: 30000  # 30 seconds (default: 8000)
```

#### Option 3: Reduce Parallelism (OpenAI)
Lower concurrent requests to reduce timeouts:

```yaml
embedder:
  provider: openai
  parallelism: 2  # Reduce from default 4
```

#### Option 4: Optimize Chunking
Smaller chunks = faster embedding = fewer timeouts:

```yaml
chunking:
  size: 256      # Reduce from default 512
  overlap: 25    # Reduce from default 50
```

#### Option 5: Increase Watch Debounce
Reduce indexing frequency:

```yaml
watch:
  debounce_ms: 2000  # Increase from default 500
```

---

## 6. Current Project Configuration

**File:** `.grepai/config.yaml`

```yaml
version: 1

embedder:
  provider: ollama
  model: nomic-embed-text
  endpoint: http://localhost:11434
  dimensions: 768
  parallelism: 0  # Ignored for Ollama

store:
  backend: gob

chunking:
  size: 512
  overlap: 50

watch:
  debounce_ms: 500

search:
  boost:
    enabled: true
    penalties:
      - pattern: /tests/
        factor: 0.5
      - pattern: /test/
        factor: 0.5
      - pattern: __tests__
        factor: 0.5
      - pattern: _test.
        factor: 0.5
      - pattern: .test.
        factor: 0.5
      - pattern: .spec.
        factor: 0.5
      - pattern: test_
        factor: 0.5
      - pattern: /mocks/
        factor: 0.4
      - pattern: /mock/
        factor: 0.4
      - pattern: .mock.
        factor: 0.4
      - pattern: /fixtures/
        factor: 0.4
      - pattern: /testdata/
        factor: 0.4
      - pattern: /generated/
        factor: 0.4
      - pattern: .generated.
        factor: 0.4
      - pattern: .gen.
        factor: 0.4
      - pattern: .md
        factor: 0.6
      - pattern: /docs/
        factor: 0.6
    bonuses:
      - pattern: /src/
        factor: 1.1
      - pattern: /lib/
        factor: 1.1
      - pattern: /app/
        factor: 1.1
  hybrid:
    enabled: false
    k: 60

trace:
  mode: fast
  enabled_languages:
    - .go
    - .js
    - .ts
    - .jsx
    - .tsx
    - .py
    - .php
    - .c
    - .h
    - .cpp
    - .hpp
    - .cc
    - .cxx
    - .rs
    - .zig
    - .cs
    - .java
    - .pas
    - .dpr
  exclude_patterns:
    - '*_test.go'
    - '*.spec.ts'
    - '*.spec.js'
    - '*.test.ts'
    - '*.test.js'
    - '__tests__/*'

update:
  check_on_startup: false

ignore:
  - .git
  - .grepai
  - node_modules
  - vendor
  - bin
  - dist
  - __pycache__
  - .venv
  - venv
  - .idea
  - .vscode
  - target
  - .zig-cache
  - zig-out
  - qdrant_storage
```

---

## 7. Configuration Structure (Go Structs)

From `config/config.go`:

```go
type Config struct {
  Version           int            // Config file version
  Embedder          EmbedderConfig // Embedding provider settings
  Store             StoreConfig    // Vector store backend
  Chunking          ChunkingConfig // Text chunking options
  Watch             WatchConfig    // File watching settings
  Search            SearchConfig   // Search enhancements
  Trace             TraceConfig    // Symbol extraction
  RPG               RPGConfig      // Relationship Pattern Graph
  Update            UpdateConfig   // Auto-update settings
  Ignore            []string       // Patterns to ignore
  ExternalGitignore string         // External gitignore file
}

type EmbedderConfig struct {
  Provider    string // "ollama" | "lmstudio" | "openai"
  Model       string // Model name
  Endpoint    string // API endpoint
  APIKey      string // API key (for OpenAI)
  Dimensions  *int   // Vector dimensions
  Parallelism int    // Concurrent requests (OpenAI only)
}

type WatchConfig struct {
  DebounceMs                  int       // File change debounce (ms)
  RPGPersistIntervalMs        int       // RPG persistence interval
  RPGDerivedDebounceMs        int       // RPG derived symbol debounce
  RPGFullReconcileIntervalSec int       // Full reconciliation interval
  RPGMaxDirtyFilesPerBatch    int       // Max files per batch
}

type RPGConfig struct {
  Enabled              bool    // Enable RPG feature
  LLMTimeoutMs         int     // LLM request timeout (ms)
  DriftThreshold       float64 // Drift detection threshold
  MaxTraversalDepth    int     // Max call graph depth
  FeatureMode          string  // "local" | "hybrid" | "llm"
  FeatureGroupStrategy string  // "sample" | "split"
}
```

---

## 8. Recommended Configurations

### For Large Codebases (Timeout Issues)
```yaml
embedder:
  provider: ollama
  model: nomic-embed-text
  endpoint: http://localhost:11434
  dimensions: 768

chunking:
  size: 256      # Smaller chunks = faster
  overlap: 25

watch:
  debounce_ms: 1000  # Less frequent indexing

search:
  hybrid:
    enabled: false  # Disable hybrid search
```

### For Team Environments
```yaml
store:
  backend: postgres
  postgres:
    dsn: postgres://user:pass@localhost:5432/grepai

embedder:
  provider: ollama
  model: nomic-embed-text-v2-moe  # Multilingual support
  endpoint: http://ollama-server:11434
```

### For High Performance
```yaml
store:
  backend: qdrant
  qdrant:
    endpoint: localhost
    port: 6334

embedder:
  provider: openai
  model: text-embedding-3-small
  parallelism: 8  # Higher parallelism

chunking:
  size: 1024     # Larger chunks
  overlap: 100
```

---

## 9. Validation Rules

GrepAI enforces these constraints:

```
watch.rpg_persist_interval_ms >= 200
watch.rpg_derived_debounce_ms >= 100
watch.rpg_full_reconcile_interval_sec >= 30
watch.rpg_max_dirty_files_per_batch >= 1

rpg.drift_threshold: 0.0 to 1.0
rpg.max_traversal_depth: 1 to 10
rpg.feature_mode: "local" | "hybrid" | "llm"
rpg.feature_group_strategy: "sample" | "split"
```

---

## 10. Key Takeaways

| Question | Answer |
|----------|--------|
| **Can I set client timeout in GrepAI config?** | ❌ No, not directly |
| **Where are timeouts configured?** | ✅ At Ollama/embedder level |
| **How do I increase timeout?** | ✅ Set `OLLAMA_REQUEST_TIMEOUT` env var or modify Ollama config |
| **What controls batch size?** | ✅ `embedder.parallelism` (OpenAI only) |
| **How do I optimize for large codebases?** | ✅ Reduce `chunking.size`, increase `watch.debounce_ms` |
| **What's the default chunk size?** | ✅ 512 tokens |
| **Can I use PostgreSQL instead of GOB?** | ✅ Yes, set `store.backend: postgres` |
| **Is RPG enabled by default?** | ❌ No, disabled by default |

---

## References

- **GrepAI GitHub:** https://github.com/yoanbernabeu/grepai
- **GrepAI Docs:** https://yoanbernabeu.github.io/grepai/
- **Config Source:** https://github.com/yoanbernabeu/grepai/blob/main/config/config.go
- **Local Config:** `.grepai/config.yaml`
