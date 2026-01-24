# Mission: Deep Codebase Research via OpenCode
You are the orchestrator. You need to understand the deep dependencies of the Shopify integration.

## Tasks:
1. **Trigger OpenCode:** Use the shell to run `sisyphus` (OpenCode) on the `src/shopify` directory.
2. **Analysis:** Direct OpenCode to find all instances where the `Shopify Access Token` is referenced or validated.
3. **Synthesis:** Take the output from OpenCode and update `docs/SYSTEM_REPORT.md` with a detailed security audit of token handling.

## Execution Command:
Run: `node /path/to/oh-my-opencode/bin/sisyphus --analyze ./src/shopify`
