# v0-vercel — Full Control OpenClaw Skill

Complete programmatic control over the **entire Vercel v0 platform** from OpenClaw.

## Features Covered

| Category | Commands | What It Controls |
|----------|:--------:|------------------|
| **AI Code Generation** | 3 | Text prompts, image-to-code, streaming |
| **Project Management** | 6 | Create, list, get, update, delete, lookup by chat |
| **Chat Management** | 9 | Create, stream, send, fork, favorite, delete, privacy, model select |
| **Deployments** | 3 | Deploy, status check, view logs |
| **Vercel Integration** | 2 | Link GitHub/Vercel projects, list integrations |
| **User & Account** | 4 | Profile, billing/plan, permissions, rate limits |
| **Total** | **27** | |

## Setup

### 1. Get your v0 API Key
Go to [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)
Requires **Premium** ($20/mo) or **Team** ($30/user/mo) plan.

### 2. Set the API Key

**Environment Variable:**
```bash
# Windows (PowerShell)
$env:V0_API_KEY = "your_key_here"

# Linux / macOS
export V0_API_KEY=your_key_here
```

**OpenClaw Config** (`~/.openclaw/openclaw.json`):
```json
{
  "skills": {
    "entries": {
      "v0-vercel": {
        "enabled": true,
        "env": { "V0_API_KEY": "your_key_here" },
        "apiKey": { "source": "env", "provider": "default", "id": "V0_API_KEY" }
      }
    }
  }
}
```

### 3. Install the Skill
```bash
cp -r v0-vercel ~/.openclaw/workspace/skills/
```
Then: `/refresh skills`

> **Important:** Folder name must be `v0-vercel` (matches the `name` field).

---

## Usage

### AI Code Generation
```bash
# Generate from text prompt
python scripts/v0_quick.py "Create a dashboard with sidebar"

# Generate from image/screenshot
python scripts/v0_quick.py "Recreate this UI" --image "https://example.com/mockup.png"

# Stream output for complex tasks
python scripts/v0_quick.py "Full e-commerce platform" --stream --model v0-1.5-lg
```

### Project Management
```bash
node scripts/v0_platform.mjs list-projects
node scripts/v0_platform.mjs create-project "My App" "Description here"
node scripts/v0_platform.mjs get-project <projectId>
node scripts/v0_platform.mjs get-project-by-chat <chatId>
node scripts/v0_platform.mjs update-project <projectId> "New Name"
node scripts/v0_platform.mjs delete-project <projectId>
```

### Chat Management
```bash
# Create with options
node scripts/v0_platform.mjs create-chat "Build a todo app" --model v0-1.5-md --privacy private

# Create with image attachment
node scripts/v0_platform.mjs create-chat "Match this design" --image "https://..."

# Create with streaming response
node scripts/v0_platform.mjs create-chat-stream "Build a complex app"

# Continue conversation
node scripts/v0_platform.mjs send-message <chatId> "Add dark mode"

# Get generated files
node scripts/v0_platform.mjs get-files <chatId>

# Other operations
node scripts/v0_platform.mjs list-chats
node scripts/v0_platform.mjs get-chat <chatId>
node scripts/v0_platform.mjs fork-chat <chatId>
node scripts/v0_platform.mjs favorite-chat <chatId>
node scripts/v0_platform.mjs delete-chat <chatId>
```

### Deployments
```bash
node scripts/v0_platform.mjs deploy <projectId> <chatId> <versionId>
node scripts/v0_platform.mjs get-deployment <deploymentId>
node scripts/v0_platform.mjs deployment-logs <deploymentId>
```

### Vercel Integration
```bash
node scripts/v0_platform.mjs vercel-create <vercelProjectId> "project-name"
node scripts/v0_platform.mjs vercel-list
```

### User & Account
```bash
node scripts/v0_platform.mjs user-info        # Profile
node scripts/v0_platform.mjs user-plan         # Billing & credits
node scripts/v0_platform.mjs user-scopes       # Permissions
node scripts/v0_platform.mjs rate-limits       # API usage
```

---

## File Structure
```
v0-vercel/
├── SKILL.md                          # Full skill definition (27 tools)
├── README.md                         # This file
└── scripts/
    ├── v0_quick.py                   # Model API — cross-platform Python
    ├── v0_generate.sh                # Model API — bash (non-streaming)
    ├── v0_generate_with_image.sh     # Model API — bash (multimodal)
    ├── v0_stream.sh                  # Model API — bash (streaming)
    └── v0_platform.mjs              # Platform API — full control CLI
```

## Links
- [v0 Docs](https://v0.app/docs)
- [v0 Model API](https://v0.app/docs/api/model)
- [v0 Platform API](https://v0.app/docs/api/platform/overview)
- [v0-sdk GitHub](https://github.com/vercel/v0-sdk)
- [v0 API Keys](https://v0.dev/chat/settings/keys)
- [OpenClaw Skills](https://docs.openclaw.ai/tools/skills)
