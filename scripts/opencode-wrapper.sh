#!/bin/bash

# Define paths
OPENCODE_BIN="/home/linuxbrew/.linuxbrew/bin/opencode"
TARGET_DIR=${1:-"./src"}
REPORT_FILE="docs/OPENCODE_REPORT.md"

echo "### [OpenCode] Triggering Sisyphus for analysis on $TARGET_DIR..."

# We use 'opencode run' followed by a detailed prompt.
# This tells the internal agent exactly what to do.
PROMPT="Analyze the codebase in $TARGET_DIR. Focus on security vulnerabilities, logic flaws in tracking, and adherence to Cloudflare Worker best practices. Summarize your findings."

# Execute
RAW_OUTPUT=$($OPENCODE_BIN run "$PROMPT" 2>&1)
EXIT_CODE=$?

# Generate the Markdown Report
{
    echo "# OpenCode Sisyphus Analysis Report"
    echo "Date: $(date)"
    echo "Target Directory: $TARGET_DIR"
    echo ""
    echo "## Execution Status"
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Task processed by OpenCode."
    else
        echo "❌ OpenCode encountered an error."
    fi
    echo ""
    echo "## Agent Output"
    echo '```text'
    echo "$RAW_OUTPUT"
    echo '```'
} > "$REPORT_FILE"

echo "### [OpenCode] Done. Feedback saved to $REPORT_FILE"
exit $EXIT_CODE
