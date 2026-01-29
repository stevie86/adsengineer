#!/bin/bash
# Doppler Secrets Manager
# Helper script to manage Doppler CLI easily
# Usage: ./doppler-secrets.sh [command] [args...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if doppler is installed
if ! command -v doppler &> /dev/null; then
    echo -e "${RED}Error: doppler CLI not found${NC}"
    echo "Install it from: https://cli.doppler.com/docs"
    exit 1
fi

# Check if doppler is configured
if [ ! -f ~/.config/doppler/config ]; then
    echo -e "${YELLOW}Warning: Doppler CLI not configured${NC}"
    echo "Run: doppler login"
    echo "Or use: doppler configure --token YOUR_TOKEN"
    echo "Get token from: https://dashboard.doppler.com/settings/tokens"
    exit 1
fi

# Show usage if no arguments
if [ $# -eq 0 ]; then
    cat << 'EOF'
${GREEN}Doppler Secrets Manager${NC}

Usage: $(basename "$0") [command] [args...]

${BLUE}Commands:${NC}
  list or ls                    List all secrets
  get [secret]                 Get value of a secret
  set [secret] [value]         Set a secret
  delete [secret]              Delete a secret
  export-all [prefix]          Export all secrets as env vars (prefix optional)
  mount                         Export secrets to secrets.json file
  update [config]              Update secrets from secrets.json

${BLUE}Examples:${NC}
  $(basename "$0") list                              # List all secrets
  $0 get CLOUDFLARE_API_TOKEN                   # Get a specific secret
  $0 set CLOUDFLARE_API_TOKEN "Bearer xyz"    # Set a secret
  $0 export-all                                   # Export all as env vars
  $0 export-all CLOUDFLARE_                        # Export only CLOUDFLARE_* secrets
  $0 mount                                         # Export to secrets.json

${BLUE}Get help:${NC}
  doppler --help
  doppler secrets --help

EOF
    exit 0
fi

COMMAND=$1
shift

case $COMMAND in
    list|ls)
        echo -e "${BLUE}Listing all Doppler secrets...${NC}"
        echo ""

        # Try to get project config
        PROJECT=$(doppler configure get project 2>/dev/null || echo "adsengineer")

        # Export secrets to temp file
        TEMP_FILE=$(mktemp)
        trap "rm -f $TEMP_FILE" EXIT

        doppler run -- bash -c 'doppler secrets download --format=json > $TEMP_FILE 2>/dev/null || {}' 2>/dev/null || {
            echo -e "${YELLOW}No secrets found or doppler not configured for this project${NC}"
            echo ""
            echo "Try: doppler configure --token YOUR_TOKEN"
            echo "Get token from: https://dashboard.doppler.com/settings/tokens"
            exit 0
        }

        if [ ! -f "$TEMP_FILE" ]; then
            echo -e "${YELLOW}No secrets file found${NC}"
            exit 0
        fi

        # Pretty print JSON secrets
        cat "$TEMP_FILE" | jq -r '
            . as $secret |
            "  \($secret | ascii_downcase)\(.value | if type == \"string\" then if length > 50 then (.[:30] + \"...\") \(.[-27:]) else . end else \"<not a string>\" end)"
        ' 2>/dev/null || {
            # Fallback: just list names if jq not available
            cat "$TEMP_FILE" | jq -r '. as $secret | $secret | ascii_downcase' // empty'
        }

        rm -f "$TEMP_FILE"
        ;;

    get)
        SECRET=$1

        if [ -z "$SECRET" ]; then
            echo -e "${RED}Error: secret name required${NC}"
            echo "Usage: $(basename "$0") get CLOUDFLARE_API_TOKEN"
            exit 1
        fi

        echo -e "${BLUE}Getting secret: ${GREEN}$SECRET${NC}${NC}"
        echo ""
        VALUE=$(doppler secrets get "$SECRET" 2>/dev/null)

        if [ $? -eq 0 ] && [ -n "$VALUE" ]; then
            # Show first 50 chars for sensitive data
            if [ ${#VALUE} -gt 50 ]; then
                echo "Value: ${VALUE:0:50}... (${#VALUE} chars total)"
            else
                echo "Value: $VALUE"
            fi
            echo ""
            echo -e "${GREEN}✓ Secret found${NC}"
            echo ""
            echo "${BLUE}To use in your shell:${NC}"
            echo "export $SECRET=\"$VALUE\""
            echo ""
            echo "${BLUE}To copy to clipboard:${NC}"
            echo "echo '$VALUE' | xclip  # Linux"
            echo "echo '$VALUE' | pbcopy   # macOS"
        else
            echo -e "${RED}✗ Secret not found or empty${NC}"
            echo -e "${YELLOW}Make sure you're in the right project:${NC}"
            echo "  doppler configure --project <project-name>"
            exit 1
        fi
        ;;

    set)
        SECRET=$1
        VALUE=$2

        if [ -z "$SECRET" ] || [ -z "$VALUE" ]; then
            echo -e "${RED}Error: both secret name and value required${NC}"
            echo "Usage: $(basename "$0") set CLOUDFLARE_API_TOKEN \"Bearer xyz\""
            exit 1
        fi

        echo -e "${BLUE}Setting secret: ${GREEN}$SECRET${NC}${NC}"
        doppler secrets set "$SECRET" "$VALUE"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Secret set successfully${NC}"
        else
            echo -e "${RED}✗ Failed to set secret${NC}"
            exit 1
        fi
        ;;

    delete)
        SECRET=$1

        if [ -z "$SECRET" ]; then
            echo -e "${RED}Error: secret name required${NC}"
            echo "Usage: $(basename "$0\") delete CLOUDFLARE_API_TOKEN"
            exit 1
        fi

        echo -e "${BLUE}Deleting secret: ${GREEN}$SECRET${NC}${NC}"
        read -p "Are you sure? " -n -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled"
            exit 0
        fi

        doppler secrets delete "$SECRET"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Secret deleted${NC}"
        else
            echo -e "${RED}✗ Failed to delete secret${NC}"
            exit 1
        fi
        ;;

    export-all)
        PREFIX=$1

        echo -e "${BLUE}Exporting all secrets as environment variables${NC}"
        [ -n "$PREFIX" ] && echo -e "${BLUE}(prefix: ${GREEN}$PREFIX${NC})${NC}"
        echo ""

        # Export secrets to temp file
        TEMP_FILE=$(mktemp)
        trap "rm -f $TEMP_FILE" EXIT

        doppler run -- bash -c 'doppler secrets download --format=json > $TEMP_FILE' 2>/dev/null || {
            echo -e "${RED}Error: could not download secrets${NC}"
            echo "Make sure doppler is authenticated and project is configured"
            exit 1
        }

        # Create export script
        if command -v jq &> /dev/null; then
            cat "$TEMP_FILE" | jq -r '
                . as $secret |
                "\($secret | ascii_upcase)=\"\( .value // \"\" )\""
            ' > "$TEMP_FILE.export"
        else
            # Fallback without jq
            cat "$TEMP_FILE" | grep -o '"[A-Z_]*"\s*:' | cut -d'"' -f2 | tr ':' '=' | while read -r line; do
                KEY=$(echo "$line" | tr -d '"')
                VALUE=$(cat "$TEMP_FILE" | grep -o "\"$KEY\"[[:space:]]*:[[:space:]]*\"[^\"]*\"," | cut -d'"' -f2 | head -1 | sed 's/\\"/"/g')
                [ -z "$PREFIX" ] && KEY="${PREFIX}${KEY}"
                echo "export $KEY=\"$VALUE\""
            done > "$TEMP_FILE.export"
        fi

        echo -e "${GREEN}✓ Export commands saved to: $TEMP_FILE.export${NC}"
        echo ""
        echo "${BLUE}To apply:${NC}"
        echo "  source $TEMP_FILE.export"
        echo ""
        echo "${BLUE}To copy to clipboard:${NC}"
        echo "  cat $TEMP_FILE.export | xclip  # Linux"
        echo "  cat $TEMP_FILE.export | pbcopy  # macOS"
        echo ""
        echo "${BLUE}Or run: source $TEMP_FILE.export${NC}"
        source "$TEMP_FILE.export"

        rm -f "$TEMP_FILE.export"
        rm -f "$TEMP_FILE"
        ;;

    mount)
        echo -e "${BLUE}Mounting secrets to secrets.json for easy inspection${NC}"
        echo ""

        TEMP_FILE=$(mktemp)
        trap "rm -f $TEMP_FILE" EXIT

        doppler run -- bash -c 'doppler secrets download --format=json > $TEMP_FILE' 2>/dev/null || {
            echo -e "${RED}Error: could not download secrets${NC}"
            exit 1
        }

        echo "Secrets saved to: $TEMP_FILE"

        if command -v jq &> /dev/null; then
            echo ""
            echo -e "${BLUE}Pretty format of saved file:${NC}"
            cat "$TEMP_FILE" | jq '.' | head -100
        else
            echo ""
            echo "Note: Install 'jq' for pretty printing: sudo apt-get install jq"
        fi

        echo ""
        echo "${BLUE}To inspect a specific secret:${NC}"
        echo "  jq '.secrets.CLOUDFLARE_API_TOKEN.value' $TEMP_FILE"
        echo ""
        echo "${BLUE}To update all secrets from this file:${NC}"
        echo "  doppler secrets upload $TEMP_FILE"
        echo ""
        echo "${BLUE}To clean up:${NC}"
        echo "  rm $TEMP_FILE"
        ;;

    update)
        CONFIG=$1

        if [ -z "$CONFIG" ]; then
            echo -e "${RED}Error: config file path required${NC}"
            echo "Usage: $(basename "$0") update ./secrets.json"
            exit 1
        fi

        if [ ! -f "$CONFIG" ]; then
            echo -e "${RED}Error: config file not found: $CONFIG${NC}"
            exit 1
        fi

        echo -e "${BLUE}Updating secrets from: ${GREEN}$CONFIG${NC}${NC}"
        doppler secrets upload "$CONFIG"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Secrets updated successfully${NC}"
        else
            echo -e "${RED}✗ Failed to update secrets${NC}"
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo ""
        $(basename "$0")
        exit 1
        ;;
esac