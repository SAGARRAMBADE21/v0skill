#!/usr/bin/env node
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
    console.error(`Error: Node.js 18+ required (you have ${process.versions.node}). Download: https://nodejs.org/`);
    process.exit(1);
}

const BASE_URL = process.env.V0_BASE_URL || 'https://api.v0.dev/v1';
const VERBOSE = process.argv.includes('--verbose');

function getApiKey() {
    const key = process.env.V0_API_KEY;
    if (!key) {
        console.error('Error: V0_API_KEY environment variable is not set.');
        console.error('Set it: export V0_API_KEY=your_key_here');
        console.error('Or configure in ~/.openclaw/openclaw.json under skills.entries.v0-vercel.env.V0_API_KEY');
        console.error('Get key: https://v0.dev/chat/settings/keys');
        process.exit(1);
    }
    return key;
}

function parseFlags(args) {
    const flags = {};
    const positional = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].slice(2);
            if (key === 'confirm' || key === 'verbose' || key === 'force' || key === 'json') {
                flags[key] = true;
            } else {
                const next = args[i + 1];
                if (next !== undefined && !next.startsWith('--')) {
                    flags[key] = next;
                    i++;
                } else {
                    flags[key] = true;
                }
            }
        } else {
            positional.push(args[i]);
        }
    }
    return { flags, positional };
}

const JSON_OUTPUT = process.argv.includes('--json');
function log(...args) { if (VERBOSE) console.log('[DEBUG]', ...args); }
function printJSON(label, data) { if (VERBOSE || JSON_OUTPUT) console.log(`\n--- ${label} ---\n${JSON.stringify(data, null, 2)}`); }

async function apiRequest(method, path, body = null) {
    const apiKey = getApiKey();
    const url = `${BASE_URL}${path}`;
    const options = {
        method,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    log(`${method} ${url}`);

    try {
        const response = await fetch(url, options);
        log(`Response: ${response.status} ${response.statusText}`);
        if (response.status === 204) return null;
        let data;
        try {
            data = await response.json();
        } catch {
            console.error(`Error: API returned non-JSON response (status ${response.status}).`);
            process.exit(1);
        }
        if (!response.ok) {
            console.error(`Error: API returned ${response.status}`);
            if (data && data.error) {
                console.error(`Code: ${data.error.code}`);
                console.error(`Type: ${data.error.type}`);
                console.error(`Message: ${data.error.userMessage || data.error.message}`);
            } else if (data) {
                console.error(JSON.stringify(data, null, 2));
            }
            const exitCode = response.status === 401 ? 2
                : response.status === 404 ? 3
                : response.status === 429 ? 4
                : 1;
            process.exit(exitCode);
        }
        return data;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

async function apiStream(path, body) {
    const apiKey = getApiKey();
    const url = `${BASE_URL}${path}`;
    log(`STREAM POST ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error(`Error: Stream API returned ${response.status}: ${errText}`);
            process.exit(1);
        }
        return response;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

async function listProjects() {
    const data = await apiRequest('GET', '/projects');
    const projects = Array.isArray(data) ? data : (data.data || data.projects || []);
    console.log(`Found ${projects.length} project(s):\n`);
    projects.forEach(p => {
        console.log(`  ${p.name || 'Untitled'}`);
        console.log(`    ID: ${p.id}`);
        if (p.url) console.log(`    URL: ${p.url}`);
        console.log('');
    });
    printJSON('Raw', data);
}

async function createProject(name, description) {
    const body = { name };
    if (description) body.description = description;
    const data = await apiRequest('POST', '/projects', body);
    console.log(`Project created: ${data.name} (ID: ${data.id})`);
    if (data.url) console.log(`URL: ${data.url}`);
    printJSON('Full Response', data);
}

async function getProject(projectId) {
    const data = await apiRequest('GET', `/projects/${encodeURIComponent(projectId)}`);
    console.log(`Project: ${data.name || 'Untitled'} (ID: ${data.id})`);
    if (data.url) console.log(`URL: ${data.url}`);
    printJSON('Full Details', data);
}

async function getProjectByChat(chatId) {
    const data = await apiRequest('GET', `/chats/${encodeURIComponent(chatId)}/project`);
    console.log(`Project for chat ${chatId}:`);
    if (data) {
        console.log(`  Name: ${data.name || 'Untitled'}`);
        console.log(`  ID: ${data.id}`);
        if (data.url) console.log(`  URL: ${data.url}`);
    }
    printJSON('Project', data);
}

async function updateProject(projectId, name) {
    const data = await apiRequest('PUT', `/projects/${encodeURIComponent(projectId)}`, { name });
    console.log(`Project updated.`);
    printJSON('Updated', data);
}

async function deleteProject(projectId, confirmed) {
    if (!confirmed) {
        console.error('Error: Destructive operation. Add --confirm flag to delete.');
        console.error(`Usage: node v0_platform.mjs delete-project "${projectId}" --confirm`);
        process.exit(1);
    }
    console.log(`Deleting project "${projectId}"...`);
    await apiRequest('DELETE', `/projects/${encodeURIComponent(projectId)}`);
    console.log(`Project ${projectId} deleted.`);
}

async function createChat(message, flags = {}) {
    const body = { message };
    if (flags.project) body.projectId = flags.project;
    if (flags.system) body.system = flags.system;
    if (flags.privacy) body.chatPrivacy = flags.privacy;
    if (flags.model) body.modelConfiguration = { modelId: flags.model };
    if (flags.image) body.attachments = [{ url: flags.image }];

    const data = await apiRequest('POST', '/chats', body);
    console.log(`Chat created (ID: ${data.id})`);
    if (data.webUrl) console.log(`Web URL: ${data.webUrl}`);
    if (data.latestVersion?.demoUrl) console.log(`Preview: ${data.latestVersion.demoUrl}`);
    if (data.demo) console.log(`Demo: ${data.demo}`);
    if (data.files && data.files.length > 0) {
        console.log(`Generated ${data.files.length} file(s):`);
        data.files.forEach(f => console.log(`  - ${f.name}`));
    }
    printJSON('Full Response', data);
}

async function createChatStream(message, flags = {}) {
    const body = { message, responseMode: 'experimental_stream' };
    if (flags.project) body.projectId = flags.project;
    if (flags.model) body.modelConfiguration = { modelId: flags.model };

    const response = await apiStream('/chats', body);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('Streaming response:\n');
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') { console.log('\n\nStream complete.'); return; }
            try {
                const chunk = JSON.parse(dataStr);
                if (chunk.event === 'message' && chunk.data) process.stdout.write(chunk.data);
                else if (chunk.content) process.stdout.write(chunk.content);
            } catch (parseErr) { log(`SSE parse error: ${parseErr.message}`); }
        }
    }
    console.log('\nStream complete.');
}

async function getChat(chatId) {
    const data = await apiRequest('GET', `/chats/${encodeURIComponent(chatId)}`);
    console.log(`Chat: ${data.title || data.id}`);
    if (data.webUrl) console.log(`URL: ${data.webUrl}`);
    printJSON('Chat Details', data);
}

async function listChats() {
    const data = await apiRequest('GET', '/chats');
    const chats = Array.isArray(data) ? data : (data.data || data.chats || []);
    console.log(`Found ${chats.length} chat(s):\n`);
    chats.forEach(c => {
        console.log(`  ${c.title || c.id}`);
        console.log(`    ID: ${c.id}`);
        if (c.webUrl) console.log(`    URL: ${c.webUrl}`);
        console.log('');
    });
    printJSON('Raw', data);
}

async function sendMessage(chatId, message) {
    const data = await apiRequest('POST', `/chats/${encodeURIComponent(chatId)}/messages`, { message });
    console.log(`Message sent to chat ${chatId}`);
    if (data.content) { console.log(`\n--- AI Response ---\n${data.content}`); }
    if (data.files && data.files.length > 0) {
        console.log(`\nUpdated ${data.files.length} file(s):`);
        data.files.forEach(f => console.log(`  - ${f.name}`));
    }
    printJSON('Full Response', data);
}

async function getFiles(chatId) {
    const data = await apiRequest('GET', `/chats/${encodeURIComponent(chatId)}/messages`);
    const seenNames = new Set();
    let allFiles = [];
    const messages = Array.isArray(data) ? data : (data.messages || []);
    const topFiles = Array.isArray(data) ? [] : (data.files || []);
    for (const msg of messages) {
        if (msg.files) for (const f of msg.files) {
            if (!seenNames.has(f.name)) { seenNames.add(f.name); allFiles.push(f); }
        }
    }
    for (const f of topFiles) {
        if (!seenNames.has(f.name)) { seenNames.add(f.name); allFiles.push(f); }
    }

    if (allFiles.length === 0) {
        console.log('No files found in this chat.');
    } else {
        console.log(`Found ${allFiles.length} file(s) in chat ${chatId}:\n`);
        allFiles.forEach(file => {
            console.log(`--- ${file.name} ---`);
            if (file.content !== undefined) console.log(file.content);
            console.log('');
        });
    }
    printJSON('Raw', data);
}

async function forkChat(chatId) {
    const data = await apiRequest('POST', `/chats/${encodeURIComponent(chatId)}/fork`);
    console.log(`Chat forked.`);
    if (data?.id) console.log(`New Chat ID: ${data.id}`);
    printJSON('Forked Chat', data);
}

async function favoriteChat(chatId) {
    await apiRequest('POST', `/chats/${encodeURIComponent(chatId)}/favorite`);
    console.log(`Chat ${chatId} favorited.`);
}

async function unfavoriteChat(chatId) {
    await apiRequest('POST', `/chats/${encodeURIComponent(chatId)}/unfavorite`);
    console.log(`Chat ${chatId} unfavorited.`);
}

async function deleteChat(chatId, confirmed) {
    if (!confirmed) {
        console.error('Error: Destructive operation. Add --confirm flag to delete.');
        console.error(`Usage: node v0_platform.mjs delete-chat "${chatId}" --confirm`);
        process.exit(1);
    }
    console.log(`Deleting chat "${chatId}"...`);
    await apiRequest('DELETE', `/chats/${encodeURIComponent(chatId)}`);
    console.log(`Chat ${chatId} deleted.`);
}

async function deploy(projectId, chatId, versionId) {
    const data = await apiRequest('POST', '/deployments', { projectId, chatId, versionId });
    console.log(`Deployed (ID: ${data.id})`);
    if (data.url) console.log(`URL: ${data.url}`);
    printJSON('Deployment', data);
}

async function getDeployment(deploymentId) {
    const data = await apiRequest('GET', `/deployments/${encodeURIComponent(deploymentId)}`);
    console.log(`Deployment: ${deploymentId}`);
    if (data.url) console.log(`URL: ${data.url}`);
    if (data.status) console.log(`Status: ${data.status}`);
    printJSON('Details', data);
}

async function deploymentLogs(deploymentId) {
    const data = await apiRequest('GET', `/deployments/${encodeURIComponent(deploymentId)}/logs`);
    console.log(`Deployment logs for ${deploymentId}:\n`);
    if (Array.isArray(data)) {
        data.forEach(entry => {
            const ts = entry.timestamp ? new Date(entry.timestamp).toISOString() : '';
            console.log(`[${ts}] ${entry.message || JSON.stringify(entry)}`);
        });
    } else {
        printJSON('Logs', data);
    }
}

async function vercelCreate(vercelProjectId, name) {
    const data = await apiRequest('POST', '/integrations/vercel/projects', { projectId: vercelProjectId, name });
    console.log(`Vercel integration created.`);
    printJSON('Integration', data);
}

async function vercelList() {
    const data = await apiRequest('GET', '/integrations/vercel/projects');
    const projects = Array.isArray(data) ? data : (data.projects || []);
    console.log(`Found ${projects.length} Vercel integration project(s):\n`);
    projects.forEach(p => {
        console.log(`  ${p.name || p.id}`);
        if (p.url) console.log(`    URL: ${p.url}`);
        console.log('');
    });
    printJSON('Projects', data);
}

async function userInfo() {
    const data = await apiRequest('GET', '/user');
    console.log(`User Info:`);
    if (data.name) console.log(`  Name: ${data.name}`);
    if (data.email) console.log(`  Email: ${data.email}`);
    printJSON('Details', data);
}

async function userPlan() {
    const data = await apiRequest('GET', '/user/plan');
    console.log(`Plan & Billing:`);
    if (data) {
        if (data.plan) console.log(`  Plan: ${data.plan}`);
        if (data.credits !== undefined) console.log(`  Credits: ${data.credits}`);
        if (data.renewsAt) console.log(`  Renews: ${data.renewsAt}`);
    }
    printJSON('Plan', data);
}

async function userScopes() {
    const data = await apiRequest('GET', '/user/scopes');
    const scopes = Array.isArray(data) ? data : (data.scopes || []);
    console.log(`User Scopes/Permissions:`);
    if (scopes.length > 0) scopes.forEach(s => console.log(`  - ${s}`));
    else console.log('  (none)');
    printJSON('Scopes', data);
}

async function rateLimits() {
    const data = await apiRequest('GET', '/rate-limits');
    console.log(`Rate Limits:`);
    if (data) {
        if (data.limit !== undefined) console.log(`  Limit: ${data.limit}`);
        if (data.remaining !== undefined) console.log(`  Remaining: ${data.remaining}`);
        if (data.reset) console.log(`  Resets: ${data.reset}`);
    }
    printJSON('Limits', data);
}

async function listEnvVars(projectId, flags = {}) {
    const query = flags.decrypted ? '?decrypted=true' : '';
    const data = await apiRequest('GET', `/projects/${encodeURIComponent(projectId)}/env-vars${query}`);
    const vars = Array.isArray(data) ? data : (data.environmentVariables || []);
    console.log(`Found ${vars.length} environment variable(s) for project ${projectId}:\n`);
    vars.forEach(v => {
        console.log(`  ${v.key}: ${v.value || '(encrypted)'}`);
        if (v.id) console.log(`    ID: ${v.id}`);
    });
    printJSON('Raw', data);
}

async function createEnvVar(projectId, key, value, flags = {}) {
    const body = { environmentVariables: [{ key, value }] };
    if (flags.upsert) body.upsert = true;
    const data = await apiRequest('POST', `/projects/${encodeURIComponent(projectId)}/env-vars`, body);
    console.log(`Environment variable "${key}" created for project ${projectId}.`);
    printJSON('Full Response', data);
}

async function updateEnvVar(projectId, envVarId, value) {
    const body = { environmentVariables: [{ id: envVarId, value }] };
    const data = await apiRequest('PATCH', `/projects/${encodeURIComponent(projectId)}/env-vars`, body);
    console.log(`Environment variable ${envVarId} updated.`);
    printJSON('Full Response', data);
}

async function deleteEnvVar(projectId, envVarId, confirmed) {
    if (!confirmed) {
        console.error('Error: Destructive operation. Add --confirm flag to delete.');
        console.error(`Usage: node v0_platform.mjs delete-env-var "${projectId}" "${envVarId}" --confirm`);
        process.exit(1);
    }
    await apiRequest('DELETE', `/projects/${encodeURIComponent(projectId)}/env-vars`, { environmentVariableIds: [envVarId] });
    console.log(`Environment variable ${envVarId} deleted.`);
}

const VERSION = '1.0.0';
const [, , command, ...rawArgs] = process.argv;
const { flags, positional } = parseFlags(rawArgs);

if (command === '--version' || command === '-v') {
    console.log(`v0-cli v${VERSION}`);
    process.exit(0);
}

switch (command) {
    case 'list-projects': await listProjects(); break;
    case 'create-project':
        if (!positional[0]) { console.error('Usage: create-project <name> [description]'); process.exit(1); }
        await createProject(positional[0], positional[1]); break;
    case 'get-project':
        if (!positional[0]) { console.error('Usage: get-project <projectId>'); process.exit(1); }
        await getProject(positional[0]); break;
    case 'get-project-by-chat':
        if (!positional[0]) { console.error('Usage: get-project-by-chat <chatId>'); process.exit(1); }
        await getProjectByChat(positional[0]); break;
    case 'update-project':
        if (!positional[0] || !positional[1]) { console.error('Usage: update-project <projectId> <name>'); process.exit(1); }
        await updateProject(positional[0], positional[1]); break;
    case 'delete-project':
        if (!positional[0]) { console.error('Usage: delete-project <projectId> --confirm'); process.exit(1); }
        await deleteProject(positional[0], flags.confirm); break;
    case 'create-chat':
        if (!positional[0]) { console.error('Usage: create-chat <message> [--project ID] [--model MODEL] [--privacy private|team|public] [--system "..."] [--image URL]'); process.exit(1); }
        await createChat(positional[0], flags); break;
    case 'create-chat-stream':
        if (!positional[0]) { console.error('Usage: create-chat-stream <message> [--project ID] [--model MODEL]'); process.exit(1); }
        await createChatStream(positional[0], flags); break;
    case 'get-chat':
        if (!positional[0]) { console.error('Usage: get-chat <chatId>'); process.exit(1); }
        await getChat(positional[0]); break;
    case 'list-chats': await listChats(); break;
    case 'send-message':
        if (!positional[0] || !positional[1]) { console.error('Usage: send-message <chatId> <message>'); process.exit(1); }
        await sendMessage(positional[0], positional[1]); break;
    case 'get-files':
        if (!positional[0]) { console.error('Usage: get-files <chatId>'); process.exit(1); }
        await getFiles(positional[0]); break;
    case 'fork-chat':
        if (!positional[0]) { console.error('Usage: fork-chat <chatId>'); process.exit(1); }
        await forkChat(positional[0]); break;
    case 'favorite-chat':
        if (!positional[0]) { console.error('Usage: favorite-chat <chatId>'); process.exit(1); }
        await favoriteChat(positional[0]); break;
    case 'unfavorite-chat':
        if (!positional[0]) { console.error('Usage: unfavorite-chat <chatId>'); process.exit(1); }
        await unfavoriteChat(positional[0]); break;
    case 'delete-chat':
        if (!positional[0]) { console.error('Usage: delete-chat <chatId> --confirm'); process.exit(1); }
        await deleteChat(positional[0], flags.confirm); break;
    case 'deploy':
        if (!positional[0] || !positional[1] || !positional[2]) { console.error('Usage: deploy <projectId> <chatId> <versionId>'); process.exit(1); }
        await deploy(positional[0], positional[1], positional[2]); break;
    case 'get-deployment':
        if (!positional[0]) { console.error('Usage: get-deployment <deploymentId>'); process.exit(1); }
        await getDeployment(positional[0]); break;
    case 'deployment-logs':
        if (!positional[0]) { console.error('Usage: deployment-logs <deploymentId>'); process.exit(1); }
        await deploymentLogs(positional[0]); break;
    case 'vercel-create':
        if (!positional[0] || !positional[1]) { console.error('Usage: vercel-create <vercelProjectId> <name>'); process.exit(1); }
        await vercelCreate(positional[0], positional[1]); break;
    case 'vercel-list': await vercelList(); break;
    case 'user-info': await userInfo(); break;
    case 'user-plan': await userPlan(); break;
    case 'user-scopes': await userScopes(); break;
    case 'rate-limits': await rateLimits(); break;
    case 'list-env-vars':
        if (!positional[0]) { console.error('Usage: list-env-vars <projectId> [--decrypted]'); process.exit(1); }
        await listEnvVars(positional[0], flags); break;
    case 'create-env-var':
        if (!positional[0] || !positional[1] || !positional[2]) { console.error('Usage: create-env-var <projectId> <key> <value> [--upsert]'); process.exit(1); }
        await createEnvVar(positional[0], positional[1], positional[2], flags); break;
    case 'update-env-var':
        if (!positional[0] || !positional[1] || !positional[2]) { console.error('Usage: update-env-var <projectId> <envVarId> <value>'); process.exit(1); }
        await updateEnvVar(positional[0], positional[1], positional[2]); break;
    case 'delete-env-var':
        if (!positional[0] || !positional[1]) { console.error('Usage: delete-env-var <projectId> <envVarId> --confirm'); process.exit(1); }
        await deleteEnvVar(positional[0], positional[1], flags.confirm); break;
    default:
        console.log(`v0 Platform API CLI v1.0

PROJECT MANAGEMENT
  list-projects                              List all projects
  create-project <name> [description]        Create a new project
  get-project <projectId>                    Get project details
  get-project-by-chat <chatId>               Get project for a chat
  update-project <projectId> <name>          Rename a project
  delete-project <projectId> --confirm       Delete a project

CHAT MANAGEMENT
  create-chat <msg> [flags]                  Start a new AI chat
    Flags: --project ID  --model MODEL  --privacy private|team|public
           --system "prompt"  --image URL
  create-chat-stream <msg> [flags]           Chat with streaming response
  get-chat <chatId>                          Get chat details
  list-chats                                 List all chats
  send-message <chatId> <msg>                Send a follow-up message
  get-files <chatId>                         Get generated files
  fork-chat <chatId>                         Fork/branch a chat
  favorite-chat <chatId>                     Favorite a chat
  unfavorite-chat <chatId>                   Unfavorite a chat
  delete-chat <chatId> --confirm             Delete a chat

DEPLOYMENTS
  deploy <projectId> <chatId> <versionId>    Deploy to production
  get-deployment <deploymentId>              Get deployment details
  deployment-logs <deploymentId>             View deployment logs

VERCEL INTEGRATION
  vercel-create <vercelProjectId> <name>     Link Vercel project
  vercel-list                                List Vercel integrations

USER & ACCOUNT
  user-info                                  Get your profile info
  user-plan                                  Check plan & billing
  user-scopes                                View permissions
  rate-limits                                Check rate limits

ENVIRONMENT VARIABLES
  list-env-vars <projectId> [--decrypted]          List project env vars
  create-env-var <projectId> <key> <value>         Create an env var
    Flags: --upsert  (overwrite if key exists)
  update-env-var <projectId> <envVarId> <value>    Update an env var value
  delete-env-var <projectId> <envVarId> --confirm  Delete an env var

OPTIONS
  --verbose         Show debug info and full JSON responses
  --json            Show full JSON responses (without debug info)
  --confirm         Required for destructive operations
  --version, -v     Show version

ENVIRONMENT
  V0_API_KEY        Your v0 API key (required)
  V0_BASE_URL       Override API base URL (optional)
  Get key at:       https://v0.dev/chat/settings/keys`);
        break;
}
