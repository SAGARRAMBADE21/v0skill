---
name: v0-vercel
description: Full control of Vercel v0 platform — manage projects and chats, deploy apps, handle Vercel integrations, monitor deployments, manage user billing, and leverage all v0 features from OpenClaw.
homepage: https://v0.app/docs
user-invocable: true
metadata: { "openclaw": { "requires": { "env": ["V0_API_KEY"] }, "primaryEnv": "V0_API_KEY" } }
---

# v0 by Vercel — Full Control Skill

## Overview

This skill provides **complete programmatic control** over the entire Vercel v0
platform from OpenClaw. It covers:

1. **v0 Platform API** — Full project lifecycle via the v0 REST API
2. **Vercel Integration** — Link Vercel projects to v0, manage deployments
3. **User & Team Management** — Billing, plans, rate limits

---

## When to Use This Skill

Use this skill when the user wants to:

- **Create, list, update, or delete v0 projects**
- **Start, continue, fork, or delete v0 AI chats**
- **Generate UI/app code** from text or image prompts via platform chats
- **Retrieve generated files** from chat sessions
- **Deploy apps** to Vercel with one command
- **Monitor deployments** and view deployment logs
- **Link Vercel projects** to v0 projects via Vercel integration
- **Check billing, plan, and rate limits**
- **Manage chat privacy** (private, team, public)
- **Stream AI responses** in real-time
- **Attach images/screenshots** for multimodal code generation

---

## Tool Categories

### Category 1: Project Management (Platform API)

#### 1.1 Create a Project

```bash
node {baseDir}/scripts/v0_platform.mjs create-project "<NAME>" ["<DESCRIPTION>"]
```

#### 1.2 List All Projects

```bash
node {baseDir}/scripts/v0_platform.mjs list-projects
```

#### 1.3 Get Project Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-project "<PROJECT_ID>"
```

#### 1.4 Get Project by Chat ID

```bash
node {baseDir}/scripts/v0_platform.mjs get-project-by-chat "<CHAT_ID>"
```

#### 1.5 Update / Rename a Project

```bash
node {baseDir}/scripts/v0_platform.mjs update-project "<PROJECT_ID>" "<NEW_NAME>"
```

#### 1.6 Delete a Project

```bash
node {baseDir}/scripts/v0_platform.mjs delete-project "<PROJECT_ID>" --confirm
```

Note: `--confirm` flag is required for destructive operations.

---

### Category 2: Chat Management (Platform API)

#### 2.1 Create a Chat (with full options)

```bash
node {baseDir}/scripts/v0_platform.mjs create-chat "<MESSAGE>" [--project <ID>] [--model <MODEL>] [--privacy <private|team|public>] [--system "<SYSTEM_PROMPT>"] [--image "<URL>"]
```

Returns: chat ID, web URL, demo/preview URL, generated files.

#### 2.2 Create a Chat with Streaming

```bash
node {baseDir}/scripts/v0_platform.mjs create-chat-stream "<MESSAGE>" [--project <ID>] [--model <MODEL>]
```

Streams the response in real-time via SSE.

#### 2.3 Send a Follow-up Message

```bash
node {baseDir}/scripts/v0_platform.mjs send-message "<CHAT_ID>" "<MESSAGE>"
```

#### 2.4 Get Chat Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-chat "<CHAT_ID>"
```

#### 2.5 Get Chat History (all your chats)

```bash
node {baseDir}/scripts/v0_platform.mjs list-chats
```

#### 2.6 Get Generated Files from a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs get-files "<CHAT_ID>"
```

#### 2.7 Fork a Chat (branch from existing chat)

```bash
node {baseDir}/scripts/v0_platform.mjs fork-chat "<CHAT_ID>"
```

#### 2.8 Favorite / Unfavorite a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs favorite-chat "<CHAT_ID>"
node {baseDir}/scripts/v0_platform.mjs unfavorite-chat "<CHAT_ID>"
```

#### 2.9 Delete a Chat

```bash
node {baseDir}/scripts/v0_platform.mjs delete-chat "<CHAT_ID>" --confirm
```

---

### Category 3: Deployments

#### 3.1 Deploy a Project

```bash
node {baseDir}/scripts/v0_platform.mjs deploy "<PROJECT_ID>" "<CHAT_ID>" "<VERSION_ID>"
```

#### 3.2 Get Deployment Details

```bash
node {baseDir}/scripts/v0_platform.mjs get-deployment "<DEPLOYMENT_ID>"
```

#### 3.3 View Deployment Logs

```bash
node {baseDir}/scripts/v0_platform.mjs deployment-logs "<DEPLOYMENT_ID>"
```

---

### Category 4: Vercel Integration

#### 4.1 Create Vercel Integration Project

```bash
node {baseDir}/scripts/v0_platform.mjs vercel-create "<VERCEL_PROJECT_ID>" "<NAME>"
```

Links a Vercel project to a v0 project.

#### 4.2 List Vercel Integration Projects

```bash
node {baseDir}/scripts/v0_platform.mjs vercel-list
```

---

### Category 5: Environment Variables

#### 5.1 List Environment Variables

```bash
node {baseDir}/scripts/v0_platform.mjs list-env-vars "<PROJECT_ID>" [--decrypted]
```

Use `--decrypted` to return plain-text values instead of encrypted ones.

#### 5.2 Create an Environment Variable

```bash
node {baseDir}/scripts/v0_platform.mjs create-env-var "<PROJECT_ID>" "<KEY>" "<VALUE>" [--upsert]
```

Use `--upsert` to overwrite if the key already exists (otherwise fails on duplicate).

#### 5.3 Update an Environment Variable

```bash
node {baseDir}/scripts/v0_platform.mjs update-env-var "<PROJECT_ID>" "<ENV_VAR_ID>" "<NEW_VALUE>"
```

Only the value can be updated (not the key).

#### 5.4 Delete an Environment Variable

```bash
node {baseDir}/scripts/v0_platform.mjs delete-env-var "<PROJECT_ID>" "<ENV_VAR_ID>" --confirm
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

## Critical Rules

- **Call `create-chat` exactly ONCE per user request.** Never make multiple `create-chat` calls for a single prompt, even if the prompt is vague or ambiguous.
- If you are unsure what the user wants, ask for clarification **before** calling any command.
- Do not retry `create-chat` with rephrased or alternate prompts — one call, one chat.

---

## Workflow Guidelines

### Full Project Workflow
1. `create-project` — Create a project container
2. `create-chat` — Start an AI chat with initial prompt
3. `get-files` — Retrieve generated files
4. `send-message` — Iterate with follow-up prompts
5. `deploy` — Deploy when user is satisfied

### Quick Code Generation
1. `create-chat` — Start a chat with your prompt (returns preview URL + files)
2. `get-files` — Download the generated code
3. `send-message` — Refine with follow-ups if needed

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
- Models available: `claude-opus-4-5` (included at no extra cost), default v0 model

---

## MCP Server

v0 now has an official MCP (Model Context Protocol) server at `https://mcp.v0.dev`. It allows AI tools and IDEs to access v0 capabilities directly without using this CLI.

To use it, configure your MCP client with:
- **Endpoint:** `https://mcp.v0.dev`
- **Auth:** Bearer token using your `V0_API_KEY`

This skill uses the REST API directly — the MCP server is an alternative integration path for tools that support MCP natively.

---

## Error Handling

- If `V0_API_KEY` is not set, inform the user to set it
- Parse JSON error objects and present the `userMessage` field
- Common errors:
  - `401 Unauthorized` — Invalid or missing API key
  - `429 Too Many Requests` — Rate limited, inform the user and exit
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

Optional overrides:
- `V0_BASE_URL` — Override the API base URL (default: `https://api.v0.dev/v1`)

Get your API key from: https://v0.dev/chat/settings/keys
Requires a **Premium** ($20/mo) or **Team** ($30/user/mo) plan.
