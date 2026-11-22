# Windows desktop pilot: Heaventree Freneme

Use only a **disposable test project and separate non-production Windows account**. Do not test on a production website/server or a Windows account containing client access keys.

## Before starting

- Node.js 22, Claude Code and OpenAI Codex CLI installed and signed in.
- A clean directory, for example `C:\FrenemePilot\sample-project`, containing a harmless text/code file.
- The newest **successful** GitHub Actions run under `Pilot package smoke test`. Download its artifact, extract the artifact ZIP, then extract the contained `Freneme-HT-Pilot.zip`. Open PowerShell in the resulting `frenemy-2.0.0` folder.

## Safe setup

Open a new PowerShell window. Change the sample path below if needed:

```powershell
New-Item -ItemType Directory -Force 'C:\FrenemePilot\sample-project'
$env:FRENEMY_REQUIRE_ROOTS = '1'
$env:FRENEMY_ALLOWED_ROOTS = 'C:\FrenemePilot\sample-project'
node install.mjs --check
node install.mjs --no-connect --no-snitch --prefix "$env:USERPROFILE\.local\share\freneme-ht-pilot"
```

The last command **does not connect or change Claude, Codex or VS Code settings**. Inspect the generated `config` files and the installer documentation before enabling connections.

To enable the pilot after inspection, in the **same PowerShell window** run:

```powershell
node install.mjs --no-snitch --prefix "$env:USERPROFILE\.local\share\freneme-ht-pilot"
```

The installer backs up changed client settings. Reopen the AI CLI clients from a shell that has these environment variables so relays can enforce the approved directory. The current PowerShell assignments are not permanent Windows settings.

## Tests to run

1. With Claude Code opened in the sample project, ask Codex to review the harmless test file. Record its reply.
2. From Codex opened in the same test project, ask Claude to review it independently.
3. Ask the driver to delegate one small code/text edit using an explicit `allowed_files` path. Verify the original file is unchanged until the driver applies the finished job.
4. Attempt a request for a directory **outside** `C:\FrenemePilot\sample-project`; the MCP relay must reject it.
5. Test a failed/cancelled assignment and its explicit recovery/abandon procedure.
6. Only then install Snitch on the disposable VS Code setup and validate the activity panel.
7. Test Gemini/Antigravity and Kimi separately if those CLIs are installed and signed in. Mark unavailable models explicitly instead of claiming they work.

Never provide real credentials as test prompts. See `docs/LAUNCH-PILOT.md` and GitHub Issue #11 for required evidence and stop-ship conditions.

**Not production-ready:** approved project boundaries and safe worker copies do not prevent an agent executing with your Windows user's permissions from reading other files or making arbitrary network connections. True OS sandboxing remains a production gate in Issue #12.
