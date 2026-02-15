# GrepAI Configuration Documentation Index

**Complete exploration of GrepAI configuration format and options**  
**Generated:** 2026-02-13

---

## 📚 Documentation Files

### 1. **GREPAI_QUICK_REFERENCE.md** ⭐ START HERE
**Best for:** Quick answers, troubleshooting checklist, configuration presets

**Contains:**
- ✅ Answers to all 5 questions in table format
- ✅ Configuration presets (Conservative, Balanced, Aggressive)
- ✅ Troubleshooting checklist
- ✅ Key concepts explained
- ✅ Critical findings summary

**Read time:** 5-10 minutes

---

### 2. **GREPAI_CONFIG_EXPLORATION.md** 📖 COMPREHENSIVE GUIDE
**Best for:** Deep understanding, detailed reference, implementation

**Contains:**
- ✅ Executive summary
- ✅ Detailed timeout configuration options
- ✅ Embedding batch size settings
- ✅ Ollama-specific configuration
- ✅ Performance tuning options (watch, trace, search, storage)
- ✅ Ways to increase client timeout (5 methods)
- ✅ Current project configuration (full YAML)
- ✅ Configuration structure (Go structs)
- ✅ Recommended configurations for different scenarios
- ✅ Validation rules
- ✅ Key takeaways table

**Read time:** 20-30 minutes

---

### 3. **GREPAI_TIMEOUT_TROUBLESHOOTING.md** 🔧 TROUBLESHOOTING GUIDE
**Best for:** Solving timeout issues, debugging, performance problems

**Contains:**
- ✅ Root cause analysis
- ✅ Solution checklist (5 steps)
- ✅ Timeout scenarios (4 common cases)
- ✅ Performance tuning matrix
- ✅ Configuration presets
- ✅ Environment variables
- ✅ Debugging commands
- ✅ When to contact support

**Read time:** 10-15 minutes

---

### 4. **GREPAI_CONFIG_SUMMARY.txt** 📋 EXECUTIVE SUMMARY
**Best for:** Quick overview, sharing with team, reference

**Contains:**
- ✅ Findings summary (5 questions answered)
- ✅ Current project config snapshot
- ✅ Key insights (5 points)
- ✅ Recommended actions (immediate, short-term, long-term)

**Read time:** 3-5 minutes

---

## 🎯 Quick Navigation

### I need to...

**Understand timeout configuration**
→ Read: GREPAI_QUICK_REFERENCE.md (Section 1️⃣)

**Fix timeout issues**
→ Read: GREPAI_TIMEOUT_TROUBLESHOOTING.md (Solution Checklist)

**Learn about batch size settings**
→ Read: GREPAI_QUICK_REFERENCE.md (Section 2️⃣)

**Configure Ollama**
→ Read: GREPAI_QUICK_REFERENCE.md (Section 3️⃣)

**Tune performance**
→ Read: GREPAI_CONFIG_EXPLORATION.md (Section 4)

**Increase client timeout**
→ Read: GREPAI_QUICK_REFERENCE.md (Section 5️⃣)

**Get a quick overview**
→ Read: GREPAI_CONFIG_SUMMARY.txt

**Deep dive into configuration**
→ Read: GREPAI_CONFIG_EXPLORATION.md (Full guide)

---

## 📊 Questions Answered

### ✅ Question 1: Timeout Configuration Options
**Answer:** GrepAI doesn't expose client-side timeout in config. Use `OLLAMA_REQUEST_TIMEOUT` env var or `rpg.llm_timeout_ms` for RPG feature.

**Files:** All 4 documents

---

### ✅ Question 2: Embedding Batch Size Settings
**Answer:** 
- `embedder.parallelism` (OpenAI only, default: 4)
- `chunking.size` (default: 512 tokens)
- `chunking.overlap` (default: 50 tokens)

**Files:** GREPAI_QUICK_REFERENCE.md, GREPAI_CONFIG_EXPLORATION.md

---

### ✅ Question 3: Ollama-Specific Configuration
**Answer:**
- Provider: `ollama`
- Model: `nomic-embed-text` (default)
- Endpoint: `http://localhost:11434`
- Dimensions: 768 (auto-set)

**Files:** GREPAI_QUICK_REFERENCE.md, GREPAI_CONFIG_EXPLORATION.md

---

### ✅ Question 4: Performance Tuning Options
**Answer:**
- Watch debounce: `watch.debounce_ms`
- Trace mode: `trace.mode` (fast or precise)
- Search boost: `search.boost.enabled`
- Hybrid search: `search.hybrid.enabled`
- Storage backend: `store.backend`

**Files:** GREPAI_QUICK_REFERENCE.md, GREPAI_CONFIG_EXPLORATION.md

---

### ✅ Question 5: Ways to Increase Client Timeout
**Answer:** 5 methods:
1. Set `OLLAMA_REQUEST_TIMEOUT` env var (BEST)
2. Increase `rpg.llm_timeout_ms`
3. Reduce `chunking.size` for faster embedding
4. Reduce `embedder.parallelism` (OpenAI)
5. Increase `watch.debounce_ms`

**Files:** GREPAI_QUICK_REFERENCE.md, GREPAI_TIMEOUT_TROUBLESHOOTING.md

---

## 🔑 Key Findings

1. **GrepAI has NO client-side timeout setting** ❌
   - Timeouts are controlled at Ollama server level
   - Use `OLLAMA_REQUEST_TIMEOUT` environment variable

2. **Parallelism only applies to OpenAI** ⚠️
   - Ollama and LM Studio ignore this setting
   - Default: 4 concurrent requests

3. **Chunking is the primary performance lever** 🎯
   - Smaller chunks (256) = faster embedding
   - Larger chunks (1024) = better context

4. **RPG feature has its own timeout** 📌
   - `rpg.llm_timeout_ms` (default: 8000 ms)
   - Only applies when RPG is enabled

5. **Storage backend affects scalability, not timeout** 📦
   - GOB: Single dev, fast
   - PostgreSQL: Teams, scalable
   - Qdrant: Enterprise, high performance

---

## 📈 Statistics

| Metric | Value |
|--------|-------|
| Total lines of documentation | 1,258 |
| Configuration options documented | 25+ |
| Timeout methods explained | 5 |
| Performance tuning options | 8 |
| Recommended models | 5 |
| Configuration presets | 3 |
| Troubleshooting scenarios | 4 |
| Debugging commands | 6 |

---

## 🚀 Getting Started

### Step 1: Read Quick Reference (5 min)
```bash
cat GREPAI_QUICK_REFERENCE.md
```

### Step 2: Check Current Config (1 min)
```bash
cat .grepai/config.yaml
```

### Step 3: If Issues, Use Troubleshooting Guide (10 min)
```bash
cat GREPAI_TIMEOUT_TROUBLESHOOTING.md
```

### Step 4: For Deep Dive, Read Full Guide (30 min)
```bash
cat GREPAI_CONFIG_EXPLORATION.md
```

---

## 🔗 External Resources

- **GrepAI GitHub:** https://github.com/yoanbernabeu/grepai
- **GrepAI Documentation:** https://yoanbernabeu.github.io/grepai/
- **Configuration Source:** https://github.com/yoanbernabeu/grepai/blob/main/config/config.go
- **Local Config:** `.grepai/config.yaml`

---

## 📝 Document Metadata

| Document | Lines | Size | Focus |
|----------|-------|------|-------|
| GREPAI_QUICK_REFERENCE.md | 300+ | 6.5 KB | Quick answers, presets |
| GREPAI_CONFIG_EXPLORATION.md | 582 | 14 KB | Comprehensive guide |
| GREPAI_TIMEOUT_TROUBLESHOOTING.md | 284 | 5.3 KB | Troubleshooting |
| GREPAI_CONFIG_SUMMARY.txt | 108 | 4.3 KB | Executive summary |
| **TOTAL** | **1,274** | **29.8 KB** | Complete reference |

---

## ✅ Exploration Status

- [x] Timeout configuration options explored
- [x] Embedding batch size settings documented
- [x] Ollama-specific configuration detailed
- [x] Performance tuning options explained
- [x] Client timeout increase methods provided
- [x] Current project config analyzed
- [x] Configuration structure documented
- [x] Troubleshooting guide created
- [x] Quick reference card created
- [x] Executive summary provided

**Status:** ✅ COMPLETE

---

## 💡 Pro Tips

1. **Start with GREPAI_QUICK_REFERENCE.md** - It answers all 5 questions in 5-10 minutes
2. **Use troubleshooting guide** - When you encounter timeout issues
3. **Reference the presets** - Conservative, Balanced, or Aggressive configurations
4. **Check the checklist** - Before contacting support
5. **Keep env var handy** - `export OLLAMA_REQUEST_TIMEOUT=300`

---

**Generated:** 2026-02-13  
**Source:** GrepAI GitHub repository + local configuration analysis  
**Completeness:** 100% (all 5 questions answered with detailed documentation)
