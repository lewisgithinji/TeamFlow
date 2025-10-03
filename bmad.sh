#!/bin/bash

# bmad.sh - Build Model and Design script for TeamFlow
# Usage: ./bmad.sh model "your instructions here"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 <command> <instructions>"
    echo ""
    echo "Commands:"
    echo "  model     - Generate data models based on instructions"
    echo ""
    echo "Example:"
    echo "  $0 model \"Create data models for TeamFlow\""
    exit 1
}

# Check if command is provided
if [ $# -lt 2 ]; then
    usage
fi

COMMAND=$1
INSTRUCTIONS=$2

case $COMMAND in
    model)
        echo -e "${GREEN}Starting model generation...${NC}"
        echo -e "${YELLOW}Instructions: ${INSTRUCTIONS}${NC}"
        echo ""

        # Check if Claude CLI is available
        if ! command -v claude &> /dev/null; then
            echo -e "${RED}Error: Claude CLI not found${NC}"
            echo "Please install Claude Code CLI or use this script within Claude Code environment"
            exit 1
        fi

        # Create a temporary file for the prompt
        TEMP_PROMPT=$(mktemp)

        # Write the full prompt to the temp file
        cat > "$TEMP_PROMPT" << 'PROMPT_END'
You are a data modeling expert. Your task is to create comprehensive data models based on the provided instructions.

Follow these guidelines:
1. Read and analyze all referenced documentation files
2. Create an Entity Relationship Diagram (ERD) using Mermaid syntax
3. Define detailed schemas for all entities with proper data types
4. Specify relationships (one-to-many, many-to-many) between entities
5. Add appropriate indexes for performance optimization
6. Define constraints, validations, and default values
7. Create enums for status and type fields
8. Consider scalability, normalization, and best practices
9. Save the output to the specified file path

Instructions:
PROMPT_END

        echo "$INSTRUCTIONS" >> "$TEMP_PROMPT"

        # Execute Claude with the prompt
        echo -e "${YELLOW}Calling Claude AI to generate models...${NC}"
        claude --prompt "$(cat "$TEMP_PROMPT")"

        # Clean up temp file
        rm -f "$TEMP_PROMPT"

        echo ""
        echo -e "${GREEN}Model generation complete!${NC}"
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        usage
        ;;
esac