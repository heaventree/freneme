# Heaventree Freneme: controlled launch-pilot gates

Status: **development pilot**, not certified for production or sensitive repositories.

## Operating boundary

- Run only on a dedicated, non-production machine or account with no client secrets or production credentials.
- Keep the upstream contribution fork (`heaventree/frenemy`) separate from this working repository.
- Start with two real clients, Claude Code and Codex, on a disposable test project. Expand to Gemini/Antigravity and Kimi only after each real account and CLI route is verified.
- For the pilot, set `FRENEMY_REQUIRE_ROOTS=1` and `FRENEMY_ALLOWED_ROOTS` to an **absolute, existing directory** containing only approved test projects. Multiple entries use the platform's path separator (`;` on Windows, `:` on Unix). Restart all AI clients after changing the configuration.
- Never approve production deployments, destructive commands or access to a secret-bearing home directory merely because the Freneme worker copy/allowlist checks pass.

The project-policy gate rejects MCP consultations, write assignments and crew job actions when the supplied `working_directory` is outside the approved realpath boundary. With `FRENEMY_REQUIRE_ROOTS=1`, missing configuration and missing directories fail closed. Existing installations are backwards compatible when neither setting is enabled. The policy is applied by Frenemy's MCP relay only, **not** to arbitrary OS processes or directly invoked CLI programs.

### Recommended single-project pilot

Create a separate disposable test folder, e.g. `C:\\FrenemePilot\\sample-project` on Windows. Set both variables in the environment of each launching AI CLI process. Only that folder and its descendants will be approved by the relay. Never approve your Windows user home, drive root, a production site directory, or a directory containing cloud credentials.

## Release gates

1. **Offline checks:** Run `node tools/check-release.mjs --skip-browser`; zero failed checks, plus `node tools/test-project-policy.mjs`. A skipped browser test is **not** a visual pass.
2. **Cross-platform tests:** GitHub Actions Windows, Linux and macOS on Node 18 and 22; all results green. They use mocked AI clients.
3. **Installation:** Inspect install scripts, run `node install.mjs --check`, then `node install.mjs --no-connect` before changing any real CLI settings. Verify backups and uninstall on a disposable system.
4. **Live consultation:** Claude → Codex, Codex → Claude; compare outputs and verify that context stays in the approved project.
5. **Worker lifecycle:** Create a write job for an allowed test file; verify original unchanged until driver applies. Confirm rejected out-of-scope edits, restore, abandon, cancelled process and timed-out process.
6. **Other models:** Verify actual Gemini/Antigravity and Kimi driver/worker routes independently, or explicitly mark unavailable. Subscription authentication and quotas are not tested in CI.
7. **IDE:** Exercise Snitch in a real VS Code instance. Offline tests cannot certify the interface.
8. **Security:** Check with a dedicated OS user or real container boundary, review environment and logs, and confirm production credentials are not available. Same-account workers remain outside a strong sandbox.
9. **Documentation:** Record provider versions, platform, findings and outcomes. Never mark untested live routes as passing.

## Stop-ship conditions

- Any worker reads files outside its approved project on a supposedly isolated machine.
- Unexpected command execution, production credential access, unsafe escalation or external network activity.
- Missing explicit approval before applying a delegated write.
- Unverified cancellation/termination or failed recovery.
- Failed CI, unresolved installation rollback, or inability to inspect Snitch logs.

## Scope of the security improvements

PR #6 excludes dotenv files from staging. PR #7 excludes selected plaintext credential files. The approved-project policy further restricts **MCP assignment targets**. Neither protects an OS account from a malicious same-user process or filters every possible secret file. Strong OS-level isolation remains a required security improvement before production use.

## Contribution strategy

General fixes with independent tests can be cherry-picked into `heaventree/frenemy` and submitted as small PRs to `noblehacks/frenemy`. Heaventree-specific routing and Nifty adapters should remain modular in this repository.
