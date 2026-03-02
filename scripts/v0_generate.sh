#!/bin/bash
set -euo pipefail

PROMPT="${1:?Error: PROMPT is required}"
MODEL="${2:-v0-1.5-md}"
MAX_TOKENS="${3:-4000}"

if [ -z "${V0_API_KEY:-}" ]; then
  echo "Error: V0_API_KEY environment variable is not set."
  echo "Set it via: export V0_API_KEY=your_key_here"
  echo "Or configure in ~/.openclaw/openclaw.json under skills.entries.v0-vercel.env.V0_API_KEY"
  exit 1
fi

ESCAPED_PROMPT=$(echo "$PROMPT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api.v0.dev/v1/chat/completions" \
  -H "Authorization: Bearer $V0_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"max_completion_tokens\": $MAX_TOKENS,
    \"messages\": [
      {
        \"role\": \"system\",
        \"content\": \"You are v0, an AI assistant by Vercel. Generate production-ready code using Next.js, TypeScript, Tailwind CSS, and shadcn/ui. Provide complete, working code with all imports.\"
      },
      {
        \"role\": \"user\",
        \"content\": $ESCAPED_PROMPT
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Error: v0 API returned HTTP $HTTP_CODE"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    content = data['choices'][0]['message']['content']
    print(content)
except Exception as e:
    print(f'Error parsing response: {e}', file=sys.stderr)
    print(json.dumps(data, indent=2))
"
