#!/bin/bash
set -euo pipefail

PROMPT="${1:?Error: PROMPT is required}"
MODEL="${2:-v0-1.5-md}"

if [ -z "${V0_API_KEY:-}" ]; then
  echo "Error: V0_API_KEY environment variable is not set."
  echo "Set it via: export V0_API_KEY=your_key_here"
  exit 1
fi

ESCAPED_PROMPT=$(echo "$PROMPT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")

curl -sN \
  "https://api.v0.dev/v1/chat/completions" \
  -H "Authorization: Bearer $V0_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"stream\": true,
    \"messages\": [
      {
        \"role\": \"system\",
        \"content\": \"You are v0, an AI assistant by Vercel. Generate production-ready code using Next.js, TypeScript, Tailwind CSS, and shadcn/ui.\"
      },
      {
        \"role\": \"user\",
        \"content\": $ESCAPED_PROMPT
      }
    ]
  }" | python3 -c "
import sys, json

for line in sys.stdin:
    line = line.strip()
    if not line or not line.startswith('data:'):
        continue
    data_str = line[5:].strip()
    if data_str == '[DONE]':
        print()
        break
    try:
        chunk = json.loads(data_str)
        delta = chunk.get('choices', [{}])[0].get('delta', {})
        content = delta.get('content', '')
        if content:
            print(content, end='', flush=True)
    except json.JSONDecodeError:
        continue

print()
"
