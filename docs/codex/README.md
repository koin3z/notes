# Codex Knowledge Base

This directory is the repository's durable memory for future Codex runs. It stores
concise, verified knowledge that prevents repeated investigation and repeated failures.
It is not a session transcript or a destination for raw logs.

## Read order

1. Read the repository-root `AGENTS.md`.
2. Check `research-log.md` before starting a substantial investigation.
3. Check `troubleshooting.md` when a command, build, test, or workflow fails.
4. Check `decisions.md` before changing architecture, conventions, or established
   workflow choices.

## Files

- `research-log.md`: durable findings, evidence, and unresolved questions.
- `troubleshooting.md`: symptoms, causes, fixes, and verification steps.
- `decisions.md`: lightweight decision records and their consequences.

## Recording rules

- Record repository-specific knowledge that is likely to help a later task.
- Prefer short summaries and links over copied output.
- Label hypotheses and unresolved questions explicitly.
- Include dates, scope, evidence, and verification.
- Update or supersede stale entries; do not silently contradict them.
- Do not record routine successful commands unless the result teaches something durable.
- Store raw logs and private scratch material only in ignored paths such as
  `docs/codex/raw/`, `docs/codex/private/`, or `.codex-local/`.

## Mandatory secret handling

Never save authentication credentials, API keys, tokens, cookies, Authorization
headers, private keys, passwords, or their values in any knowledge-base file, example,
command, URL, log, or error excerpt. Redact sensitive values before recording. If a
secret appears during work, do not copy it here; keep it out of the repository and
recommend rotation when exposure is possible.
