#!/usr/bin/env python3
import os
import sys
import json
import argparse
import urllib.request
import urllib.error


def get_api_key():
    key = os.environ.get("V0_API_KEY", "")
    if not key:
        print("Error: V0_API_KEY environment variable is not set.", file=sys.stderr)
        print("Set it via: set V0_API_KEY=your_key_here  (Windows)", file=sys.stderr)
        print("        or: export V0_API_KEY=your_key_here  (Linux/macOS)", file=sys.stderr)
        sys.exit(1)
    return key


def call_v0_api(prompt, model="v0-1.5-md", max_tokens=4000, stream=False, image_url=None):
    api_key = get_api_key()
    url = "https://api.v0.dev/v1/chat/completions"

    if image_url:
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]
    else:
        user_content = prompt

    payload = {
        "model": model,
        "max_completion_tokens": max_tokens,
        "stream": stream,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are v0, an AI assistant by Vercel. Generate production-ready "
                    "code using Next.js, TypeScript, Tailwind CSS, and shadcn/ui. "
                    "Provide complete, working code with all necessary imports."
                ),
            },
            {"role": "user", "content": user_content},
        ],
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            if stream:
                for line in response:
                    line = line.decode("utf-8").strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data_str = line[5:].strip()
                    if data_str == "[DONE]":
                        print()
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            print(content, end="", flush=True)
                    except json.JSONDecodeError:
                        continue
                print()
            else:
                result = json.loads(response.read().decode("utf-8"))
                content = result["choices"][0]["message"]["content"]
                print(content)

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"Error: v0 API returned HTTP {e.code}", file=sys.stderr)
        try:
            err = json.loads(body)
            if "error" in err:
                print(f"  Code: {err['error'].get('code', 'unknown')}", file=sys.stderr)
                print(f"  Message: {err['error'].get('userMessage', err['error'].get('message', ''))}", file=sys.stderr)
            else:
                print(json.dumps(err, indent=2), file=sys.stderr)
        except json.JSONDecodeError:
            print(body, file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="v0 Model API - Quick Code Generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("prompt", help="The prompt for code generation")
    parser.add_argument("--model", default="v0-1.5-md", choices=["v0-1.5-md", "v0-1.5-lg", "v0-1.0-md"],
                        help="Model to use (default: v0-1.5-md)")
    parser.add_argument("--max-tokens", type=int, default=4000, help="Max output tokens (default: 4000)")
    parser.add_argument("--stream", action="store_true", help="Enable streaming output")
    parser.add_argument("--image", default=None, help="Image URL for multimodal generation")

    args = parser.parse_args()
    call_v0_api(
        prompt=args.prompt,
        model=args.model,
        max_tokens=args.max_tokens,
        stream=args.stream,
        image_url=args.image,
    )


if __name__ == "__main__":
    main()
