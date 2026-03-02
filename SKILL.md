---
name: v0-vercel
description: Full control of Vercel v0 AI platform — generate code, manage projects and chats, deploy apps, handle Vercel integrations, monitor deployments, manage user billing, and leverage all v0 features from OpenClaw.
homepage: https://v0.app/docs
user-invocable: true
metadata: { "openclaw": { "requires": { "env": ["V0_API_KEY"] }, "primaryEnv": "V0_API_KEY" } }
---

# v0 by Vercel — Full Control Skill

## Overview

This skill provides **complete programmatic control** over the entire Vercel v0
platform from OpenClaw. It covers:

1. **v0 Model API** — Direct AI code generation (OpenAI-compatible)
2. **v0 Platform API** — Full project lifecycle via v0-sdk
3. **Vercel Integration** — GitHub, deployments, custom domains
4. **User & Team Management** — Billing, plans, rate limits

---

## When to Use This Skill

Use this skill when the user wants to:

- **Generate UI/app code** from text or image prompts using v0 AI models
- **Create, list, update, or delete v0 projects**
- **Start, continue, fork, or delete v0 AI chats**
- **Retrieve generated files** from chat sessions
- **Deploy apps** to Vercel with one command
- **Monitor deployments** and view deployment logs
- **Connect GitHub repos** to v0 projects (Vercel integration)
- **Check billing, plan, and rate limits**
- **Use templates** to bootstrap new projects
- **Manage chat privacy** (private, team, public)
- **Stream AI responses** in real-time
- **Attach images/screenshots** for multimodal code generation

---

## Available Models

| Model        | Input Tokens | Output Tokens | Best For                           |
|--------------|-------------|---------------|-------------------------------------|
| `v0-1.5-md`  | 128,000     | 64,000        | General-purpose, everyday UI tasks  |
| `v0-1.5-lg`  | 512,000     | 64,000        | Advanced reasoning, complex apps    |
| `v0-1.0-md`  | 128,000     | 64,000        | Legacy / compatibility              |

Default to `v0-1.5-md` unless the user requests the larger model or the task
requires advanced reasoning.

---

## Tool Categories

### Category 1: AI Code Generation (Model API)

#### 1.1 Generate Code from Text

```bash
python {baseDir}/scripts/v0_quick.py "<PROMPT>" --model <MODEL> --max-tokens <N>
```

Example:
```bash
python {baseDir}/scripts/v0_quick.py "Create a Next.js dashboard with dark mode, sidebar navigation, and analytics cards" --model v0-1.5-md --max-tokens 8000
```

#### 1.2 Generate Code from Image (Multimodal)

```bash
python {baseDir}/scripts/v0_quick.py "<PROMPT>" --image "<IMAGE_URL>" --model <MODEL>
```

Example:
```bash
python {baseDir}/scripts/v0_quick.py "Recreate this UI exactly" --image "https://example.com/mockup.png"
```

#### 1.3 Stream Code Generation (Real-time)

```bash
python {baseDir}/scripts/v0_quick.py "<PROMPT>" --stream --model <MODEL>
```

---

### Category 2: Project Management (Platform API)

#### 2.1 Create a Project

```bash
node {baseDir}/scripts/v0_platform.mjs create-project "<NAME>" ["<DESCRIPTION>"]
```

#### 2.2 List All Projects

```bash
node {baseDir}/scripts/v0_platform.mjs list-projects
```

#### 2.3 Get Project Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-project "<PROJECT_ID>"
```

#### 2.4 Get Project by Chat ID

```bash
node {baseDir}/scripts/v0_platform.mjs get-project-by-chat "<CHAT_ID>"
```

#### 2.5 Delete a Project

```bash
node {baseDir}/scripts/v0_platform.mjs delete-project "<PROJECT_ID>" --confirm
```

Note: `--confirm` flag is required for destructive operations.

---

### Category 3: Chat Management (Platform API)

#### 3.1 Create a Chat (with full options)

```bash
node {baseDir}/scripts/v0_platform.mjs create-chat "<MESSAGE>" [--project <ID>] [--model <MODEL>] [--privacy <private|team|public>] [--system "<SYSTEM_PROMPT>"] [--image "<URL>"]
```

Returns: chat ID, web URL, demo/preview URL, generated files.

#### 3.2 Create a Chat with Streaming

```bash
node {baseDir}/scripts/v0_platform.mjs create-chat-stream "<MESSAGE>" [--project <ID>] [--model <MODEL>]
```

Streams the response in real-time via SSE.

#### 3.3 Send a Follow-up Message

```bash
node {baseDir}/scripts/v0_platform.mjs send-message "<CHAT_ID>" "<MESSAGE>"
```

#### 3.4 Get Chat Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-chat "<CHAT_ID>"
```

#### 3.5 Get Chat History (all your chats)

```bash
node {baseDir}/scripts/v0_platform.mjs list-chats
```

#### 3.6 Get Generated Files from a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs get-files "<CHAT_ID>"
```

#### 3.7 Fork a Chat (branch from existing chat)

```bash
node {baseDir}/scripts/v0_platform.mjs fork-chat "<CHAT_ID>"
```

#### 3.8 Favorite / Unfavorite a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs favorite-chat "<CHAT_ID>"
node {baseDir}/scripts/v0_platform.mjs unfavorite-chat "<CHAT_ID>"
```

#### 3.9 Delete a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs delete-chat "<CHAT_ID>" --confirm
```

---

### Category 4: Deployments

#### 4.1 Deploy a Project

```bash
node {baseDir}/scripts/v0_platform.mjs deploy "<PROJECT_ID>" "<CHAT_ID>" "<VERSION_ID>"
```

#### 4.2 Get Deployment Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-deployment "<DEPLOYMENT_ID>"
```

#### 4.3 View Deployment Logs

```bash
node {baseDir}/scripts/v0_platform.mjs deployment-logs "<DEPLOYMENT_ID>"
```

---

### Category 5: Vercel Integration

#### 5.1 Create Vercel Integration Project

```bash
node {baseDir}/scripts/v0_platform.mjs vercel-create "<VERCEL_PROJECT_ID>" "<NAME>"
```

Links a Vercel project to a v0 project.

#### 5.2 List Vercel Integration Projects

```bash
node {baseDir}/scripts/v0_platform.mjs vercel-list
```

---

### Category 6: User & Account Management

#### 6.1 Get User Info

```bash
node {baseDir}/scripts/v0_platform.mjs user-info
```

#### 6.2 Get Current Plan & Billing

```bash
node {baseDir}/scripts/v0_platform.mjs user-plan
```

#### 6.3 Get User Scopes / Permissions

```bash
node {baseDir}/scripts/v0_platform.mjs user-scopes
```

#### 6.4 Check Rate Limits

```bash
node {baseDir}/scripts/v0_platform.mjs rate-limits
```

---

## Workflow Guidelines

### Quick Code Generation
1. Take the user's prompt
2. Call v0_quick.py with model and options
3. Parse and present the generated code
4. If user wants changes, call again with refined prompt

### Full Project Workflow
1. `create-project` — Create a project container
2. `create-chat` — Start an AI chat with initial prompt
3. `get-files` — Retrieve generated files
4. `send-message` — Iterate with follow-up prompts
5. `deploy` — Deploy when user is satisfied

### GitHub Integration Workflow
1. `vercel-create` — Link GitHub repo to v0 via Vercel
2. `create-chat` — Start a chat attached to the project
3. Changes auto-commit to a branch
4. `deploy` — Triggers PR and production build

### Monitoring & Operations
1. `list-projects` — See all projects
2. `list-chats` — See chat history
3. `deployment-logs` — Debug deployment issues
4. `rate-limits` — Check API usage
5. `user-plan` — Check billing and credits

### Prompt Tips for Better v0 Results
- Be specific: "Next.js 14 App Router with TypeScript"
- Mention design: "Tailwind CSS, shadcn/ui, dark mode"
- Include layout: "sidebar, header, responsive grid"
- Add features: "authentication, database CRUD, form validation"
- Reference patterns: "dashboard, landing page, e-commerce"
- Attach images: Use --image for screenshot-to-code

---

## Error Handling

- If `V0_API_KEY` is not set, inform the user to set it
- Parse JSON error objects and present the `userMessage` field
- Common errors:
  - `401 Unauthorized` — Invalid or missing API key
  - `429 Too Many Requests` — Rate limited, wait and retry
  - `project_not_found` — Invalid project ID
  - `chat_not_found` — Invalid chat ID
  - `insufficient_credits` — User needs to purchase more credits

---

## Configuration

Set your v0 API key in OpenClaw config:

```json
{
  "skills": {
    "entries": {
      "v0-vercel": {
        "enabled": true,
        "env": {
          "V0_API_KEY": "your_api_key_here"
        },
        "apiKey": {
          "source": "env",
          "provider": "default",
          "id": "V0_API_KEY"
        }
      }
    }
  }
}
```

Or set as environment variable: `export V0_API_KEY=your_api_key_here`

Get your API key from: https://v0.dev/chat/settings/keys
Requires a **Premium** ($20/mo) or **Team** ($30/user/mo) plan.
